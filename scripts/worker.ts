import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@/lib/prisma';
import { LeadStatus, Sender, Priority } from '@prisma/client';
import { createOrGetLead } from '@/lib/db/leads';
import { generateChatResponse, type UnifiedAIResponse } from '@/lib/ai';
import { searchKnowledge } from '@/lib/knowledge';
import type { WebhookJobData } from '@/lib/queue';
import { getOrganizationByPhoneNumberId } from '@/lib/db/whatsapp';
import { classifyIntent, getRiskScore, evaluatePolicy, sanitizeResponse, appendDisclaimer } from '@/lib/compliance';
import { evaluateChannelPolicy, evaluateMedicalSafety } from '@/lib/messaging/policy';
import { sendSafeServiceMessage } from '@/lib/messaging/safe-send';
import { escalateLead } from '@/lib/messaging/handoff';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

const worker = new Worker<WebhookJobData>(
  'webhook-events',
  async (job) => {
    const { messageId, phone, text, name, businessNumber, phoneNumberId } = job.data;
    const organizationId = job.data.organizationId;

    console.log(`[Worker] Processing job ${job.id} for message ${messageId} (Business: ${businessNumber})`);

    if (!organizationId) {
      throw new Error(`TENANT_REQUIRED: message ${messageId} was not mapped to an organization`);
    }

    // Revalidate Meta's stable phone-number ID at the worker boundary. A
    // mismatch is a hard failure rather than a tenant/global fallback.
    if (phoneNumberId) {
      const mapping = await getOrganizationByPhoneNumberId(phoneNumberId);
      if (!mapping || mapping.organizationId !== organizationId || mapping.organization.disabled) {
        throw new Error(`TENANT_MISMATCH: phone number ID ${phoneNumberId} failed validation`);
      }
    } else {
      throw new Error(`PHONE_NUMBER_ID_REQUIRED: message ${messageId} has no stable sender identifier`);
    }

    const organization = await prisma.organization.findFirst({
      where: { id: organizationId, disabled: false },
      select: { id: true, name: true },
    });
    if (!organization) {
      throw new Error(`TENANT_INACTIVE: organization ${organizationId} is unavailable`);
    }

    // The current inbound patient message establishes the consent basis for a
    // service reply. This is checked again against persisted data before send.
    const inboundEligibility = evaluateChannelPolicy({
      origin: 'REACTIVE_AUTOMATION',
      lastPatientMessageAt: new Date(),
    });
    if (!inboundEligibility.allowed) {
      throw new Error(`CHANNEL_POLICY_BLOCKED: ${inboundEligibility.reason}`);
    }

    // Check deduplication
    const existingMessage = await prisma.message.findUnique({
      where: { messageId }
    });

    if (existingMessage) {
      console.log(`[Worker] Skipping duplicate message ${messageId}`);
      return;
    }

    // Process logic extracted from webhook
    const existingLead = await prisma.lead.findFirst({
      where: { 
        phone, 
        organizationId, 
        status: { not: 'CLOSED' } 
      },
      orderBy: { createdAt: 'desc' },
    });

    let department = existingLead?.department || 'General';
    let problemText = existingLead?.problem || text;
    let priority: Priority = existingLead?.priority || Priority.COLD;

    let chatHistory: { role: 'user' | 'assistant'; content: string }[] = [];
    if (existingLead) {
      const pastMessages = await prisma.message.findMany({
        where: { 
          leadId: existingLead.id,
          organizationId 
        },
        orderBy: { timestamp: 'desc' },
        take: 6,
      });
      chatHistory = pastMessages.reverse().map((m) => ({
        role: m.sender === 'USER' ? 'user' : 'assistant',
        content: m.content,
      }));
    }

    const contextChunks = await searchKnowledge(text, 3, organizationId);
    const hospitalContext = contextChunks.map((c) => c.content).join('\n\n');

    // COMPLIANCE LAYER: Intent & Policy Engine
    const intent = classifyIntent(text);
    const riskScore = getRiskScore(text);
    const policyRedirect = evaluatePolicy(intent);

    let aiResult: UnifiedAIResponse;
    let sanitizerTriggered = false;

    if (policyRedirect) {
      console.log(`[Worker] Policy triggered for intent: ${intent}. Redirecting.`);
      aiResult = {
        reply: policyRedirect,
        classification: {
          department: "General",
          problem: text,
          priority: intent === "EMERGENCY" ? Priority.HOT : Priority.WARM,
          booking_intent: "none"
        }
      };
    } else {
      try {
        aiResult = await generateChatResponse(chatHistory, text, hospitalContext);
      } catch (aiError) {
        console.error('[Worker] AI Failed, using fallback. Error:', aiError);
        // Fallback message via DB config or hardcoded
        aiResult = {
          reply: 'हमारी टीम आपसे जल्द संपर्क करेगी',
          classification: undefined
        };
      }
    }

    // COMPLIANCE LAYER: Output Sanitizer and deterministic medical safety gate
    const sanitizedRedirect = sanitizeResponse(aiResult.reply);
    if (sanitizedRedirect) {
      sanitizerTriggered = true;
    }

    const medicalDecision = evaluateMedicalSafety({
      intent,
      riskScore,
      draftReply: aiResult.reply,
      sanitizerTriggered,
    });

    if (medicalDecision.finalReply) {
      aiResult.reply = medicalDecision.finalReply;
    }

    // COMPLIANCE LAYER: Auto Disclaimer
    const isFirstMessage = chatHistory.length === 0;

    if (medicalDecision.finalReply) {
      aiResult.reply = appendDisclaimer(
        medicalDecision.finalReply,
        isFirstMessage,
        organization.name,
      );
    }

    let newStatus: LeadStatus = existingLead?.status ?? LeadStatus.NEW;
    if (existingLead && newStatus === LeadStatus.NEW) newStatus = LeadStatus.ENGAGED;

    if (aiResult.classification) {
      department = aiResult.classification.department;
      problemText = aiResult.classification.problem;
      priority = aiResult.classification.priority;
      
      if (aiResult.classification.booking_intent === 'booking_requested') {
        newStatus = LeadStatus.BOOKED;
      } else if (aiResult.classification.booking_intent === 'visit_confirmed') {
        newStatus = LeadStatus.VISITED;
      }
    }

    // Step 1: Create or update lead
    let lead = await createOrGetLead({
      phone,
      name,
      problem: problemText,
      department,
      priority,
      organizationId,
    });

    lead = await prisma.lead.update({
      where: { id: lead.id },
      data: { 
        department, 
        problem: problemText, 
        priority,
        status: newStatus,
        lastInteraction: new Date(),
        followUpStage: 0 
      },
    });

    // Step 2: Save incoming user message to DB with messageId
    await prisma.$transaction([
      prisma.message.create({
        data: {
          leadId: lead.id,
          sender: Sender.USER,
          content: text,
          messageId, // Store for deduplication
          isRead: false,
          organizationId,
        }
      }),
      prisma.lead.update({
        where: { id: lead.id },
        data: { lastMessageAt: new Date() }
      })
    ]);

    if (medicalDecision.action !== 'SEND') {
      await escalateLead({
        organizationId,
        leadId: lead.id,
        reason: medicalDecision.reason,
        priority: medicalDecision.priority,
      });
    }

    if (medicalDecision.action === 'REFUSE' || !medicalDecision.finalReply) {
      console.warn(
        JSON.stringify({
          event: 'automated_reply_refused',
          organizationId,
          leadId: lead.id,
          reason: medicalDecision.reason,
        }),
      );
      return;
    }

    // Step 3: Send AI reply via WhatsApp
    try {
      await sendSafeServiceMessage({
        organizationId,
        leadId: lead.id,
        origin: 'REACTIVE_AUTOMATION',
        sender: Sender.BOT,
        content: aiResult.reply,
      });
    } catch (replyError) {
      console.error('[Worker] Auto-reply failed:', replyError);
      throw replyError; // Let BullMQ retry
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

console.log('[Worker] Started listening for webhook events...');
