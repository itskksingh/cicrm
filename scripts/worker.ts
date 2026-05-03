import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@/lib/prisma';
import { Sender, Priority } from '@prisma/client';
import { createOrGetLead } from '@/lib/db/leads';
import { saveMessage } from '@/lib/db/messages';
import { generateChatResponse } from '@/lib/ai';
import { searchKnowledge } from '@/lib/knowledge';
import { sendWhatsAppReply } from '@/lib/whatsapp';
import { WebhookJobData } from '@/lib/queue';
import { getOrganizationByWhatsAppNumber } from '@/lib/db/whatsapp';
import { getWhatsAppCredentials, updateCredentialHealth, validateOrganizationCredentials } from '@/lib/db/whatsapp-credentials';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

const worker = new Worker<WebhookJobData>(
  'webhook-events',
  async (job) => {
    const { messageId, phone, text, name, businessNumber } = job.data;
    let organizationId = job.data.organizationId;

    console.log(`[Worker] Processing job ${job.id} for message ${messageId} (Business: ${businessNumber})`);

    // Multi-tenant: Map business number to organization
    if (businessNumber) {
      const mapping = await getOrganizationByWhatsAppNumber(businessNumber);
      if (mapping) {
        organizationId = mapping.organizationId;
        console.log(`[Worker] Mapped business number ${businessNumber} to organization: ${organizationId}`);
      } else {
        console.error(`[Worker] CRITICAL: No organization found for business number ${businessNumber}. Falling back to default.`);
      }
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

    let aiResult;
    try {
      aiResult = await generateChatResponse(chatHistory, text, hospitalContext);
    } catch (aiError) {
      console.error('[Worker] AI Failed, using fallback. Error:', aiError);
      // Fallback message via DB config or hardcoded
      aiResult = {
        reply: 'हमारी टीम आपसे जल्द संपर्क करेगी',
        classification: null
      };
    }

    let newStatus = existingLead?.status || 'NEW';
    if (existingLead && newStatus === 'NEW') newStatus = 'ENGAGED';

    if (aiResult.classification) {
      department = aiResult.classification.department;
      problemText = aiResult.classification.problem;
      priority = aiResult.classification.priority;
      
      if (aiResult.classification.booking_intent === 'booking_requested') {
        newStatus = 'BOOKED';
      } else if (aiResult.classification.booking_intent === 'visit_confirmed') {
        newStatus = 'VISITED';
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
        status: newStatus as any,
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

    // Step 3: Send AI reply via WhatsApp
    try {
      let credentials = undefined;
      if (organizationId) {
        await validateOrganizationCredentials(organizationId);
        const orgCreds = await getWhatsAppCredentials(organizationId);
        if (orgCreds) {
          console.log(`[WhatsApp] Using DB credentials for org ${organizationId}`);
          credentials = {
            accessToken: orgCreds.accessToken,
            phoneNumberId: orgCreds.phoneNumberId
          };
        }
      } else {
        console.log(`[WhatsApp] No organizationId provided, using environment fallback`);
      }

      await sendWhatsAppReply(phone, aiResult.reply, credentials);

      if (organizationId) {
        await updateCredentialHealth(organizationId, true);
      }

      // Step 4: Save the bot reply in DB
      await saveMessage({
        leadId: lead.id,
        sender: Sender.BOT,
        content: aiResult.reply,
        organizationId,
      });
    } catch (replyError) {
      if (organizationId) {
        await updateCredentialHealth(organizationId, false);
      }
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
