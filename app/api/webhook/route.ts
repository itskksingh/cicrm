import { NextResponse } from "next/server";
import { createOrGetLead } from "@/lib/db/leads";
import { saveMessage } from "@/lib/db/messages";
import { Sender, Priority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateChatResponse } from "@/lib/ai";
import { searchKnowledge } from "@/lib/knowledge";

// ─── Auto-Reply Content ───────────────────────────────────────────────────────

const AUTO_REPLY_TEXT = `🙏 Thank you for contacting Crest Care Hospital.

How can we help you today?

1. Doctor Appointment
2. Surgery Inquiry
3. Emergency`;

// ─── Helper: Send WhatsApp reply via Cloud API ────────────────────────────────

async function sendWhatsAppReply(to: string, text: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("WhatsApp credentials not set. Skipping auto-reply.");
    return;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`WhatsApp API error [${response.status}]: ${err}`);
  }
}

// ─── GET: Webhook Verification ────────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid token" }, { status: 403 });
}

// ─── POST: Receive Incoming Messages ─────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            const message = change.value.messages[0];
            const contact = change.value.contacts?.[0];

            // Only process incoming text messages
            if (message.type === "text" && message.text) {
              const phone = message.from;
              const text = message.text.body;
              const name = contact?.profile?.name;

              // Check if we already have an active lead for this phone
              const existingLead = await prisma.lead.findFirst({
                where: { phone, status: { not: "CLOSED" } },
                orderBy: { createdAt: "desc" },
              });

              let department = existingLead?.department || "General";
              let problemText = existingLead?.problem || text;
              let priority: Priority = existingLead?.priority || Priority.COLD;

              // Fetch chat history for context
              let chatHistory: { role: "user" | "assistant"; content: string }[] = [];
              if (existingLead) {
                const pastMessages = await prisma.message.findMany({
                  where: { leadId: existingLead.id },
                  orderBy: { timestamp: "desc" },
                  take: 6,
                });
                chatHistory = pastMessages.reverse().map((m) => ({
                  role: m.sender === "USER" ? "user" : "assistant",
                  content: m.content,
                }));
              }

              // Fetch hospital context
              const contextChunks = await searchKnowledge(department, problemText);
              const hospitalContext = contextChunks.map((c) => c.content).join("\n\n");

              // Generate AI response & continuous classification
              const aiResult = await generateChatResponse(chatHistory, text, hospitalContext);

              if (aiResult.classification) {
                department = aiResult.classification.department;
                problemText = aiResult.classification.problem;
                priority = aiResult.classification.priority;
              }

              // Step 1: Create or update lead
              let lead = await createOrGetLead({
                phone,
                name,
                problem: problemText,
                department,
                priority,
              });

              // If AI detected a new classification for an existing lead, update it explicitly
              if (aiResult.classification && existingLead) {
                lead = await prisma.lead.update({
                  where: { id: lead.id },
                  data: { department, problem: problemText, priority },
                });
              }

              // Step 2: Save incoming user message to DB
              await saveMessage({
                leadId: lead.id,
                sender: Sender.USER,
                content: text,
              });

              // Step 3: Send AI reply via WhatsApp
              try {
                await sendWhatsAppReply(phone, aiResult.reply);

                // Step 4: Save the bot reply in DB
                await saveMessage({
                  leadId: lead.id,
                  sender: Sender.BOT,
                  content: aiResult.reply,
                });
              } catch (replyError) {
                console.error("Auto-reply failed:", replyError);
              }
            }
          }
        }
      }
    }

    // Always return 200 so Meta doesn't retry the delivery
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
