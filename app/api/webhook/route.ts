import { NextResponse } from "next/server";
import { createOrGetLead } from "@/lib/db/leads";
import { saveMessage } from "@/lib/db/messages";
import { Sender, Priority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeLeadMessage } from "@/lib/ai";

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

              let department = "General";
              let problemText = text;
              let priority: Priority = Priority.COLD;

              if (!existingLead) {
                // First message from this user: run AI to extract problem/department/priority
                const analysis = await analyzeLeadMessage(text);
                department = analysis.department;
                problemText = analysis.problem;
                priority = analysis.priority;
              } else {
                // For subsequent messages, keep the established priority
                priority = existingLead.priority;
              }

              // Step 1: Create or update lead
              const lead = await createOrGetLead({
                phone,
                name,
                problem: problemText,
                department,
                priority,
              });

              // Step 2: Save incoming user message to DB
              await saveMessage({
                leadId: lead.id,
                sender: Sender.USER,
                content: text,
              });

              // Step 3: Send auto-reply (errors caught safely — webhook stays alive)
              try {
                await sendWhatsAppReply(phone, AUTO_REPLY_TEXT);

                // Step 4: Save the bot reply in DB so it shows in chat
                await saveMessage({
                  leadId: lead.id,
                  sender: Sender.BOT,
                  content: AUTO_REPLY_TEXT,
                });
              } catch (replyError) {
                // Never crash the webhook — Meta must always receive 200
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
