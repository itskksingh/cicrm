import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow more time for AI processing on Vercel

import { createOrGetLead } from "@/lib/db/leads";
import { saveMessage } from "@/lib/db/messages";
import { Sender, Priority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateChatResponse } from "@/lib/ai";
import { searchKnowledge } from "@/lib/knowledge";
import { sendWhatsAppReply } from "@/lib/whatsapp";
import { getOrganizationByWhatsAppNumber } from "@/lib/db/whatsapp";

// ─── Auto-Reply Content ───────────────────────────────────────────────────────

const AUTO_REPLY_TEXT = `🙏 Thank you for contacting Crest Care Hospital.

How can we help you today?

1. Doctor Appointment
2. Surgery Inquiry
3. Emergency`;



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

import { webhookQueue } from "@/lib/queue";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            const value = change.value;
            const metadata = value.metadata;
            const businessNumber = metadata?.display_phone_number
              ? metadata.display_phone_number.replace(/[+\s]/g, "")
              : null;

            // Resolve organizationId early
            let organizationId: string | undefined;
            if (businessNumber) {
              const mapping = await getOrganizationByWhatsAppNumber(businessNumber);
              if (mapping) {
                organizationId = mapping.organizationId;
              }
            }

            const message = value.messages[0];
            const contact = value.contacts?.[0];

            if (message.type === "text" && message.text) {
              const phone = message.from;
              const text = message.text.body;
              const name = contact?.profile?.name;
              const messageId = message.id;

              await webhookQueue.add(
                "process-whatsapp",
                { messageId, phone, text, name, businessNumber, organizationId },
                {
                  jobId: messageId,
                  attempts: 3,
                  backoff: { type: "exponential", delay: 2000 },
                }
              );
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
