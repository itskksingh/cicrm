import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow more time for AI processing on Vercel

import {
  getOrganizationByPhoneNumberId,
  getOrganizationByWhatsAppNumber,
} from "@/lib/db/whatsapp";

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

import { getWebhookQueue } from "@/lib/queue";

import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    if (process.env.NODE_ENV === "production") {
      const appSecret = process.env.WHATSAPP_APP_SECRET;
      if (!appSecret) {
        console.error("[Webhook] WHATSAPP_APP_SECRET is not configured");
        return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
      }

      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }

      const expectedSignature = "sha256=" + crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

      const actualBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);
      if (
        actualBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
      ) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            const value = change.value;
            const metadata = value.metadata;
            const phoneNumberId = metadata?.phone_number_id;
            const businessNumber = metadata?.display_phone_number
              ? metadata.display_phone_number.replace(/[+\s]/g, "")
              : null;

            // Phone-number ID is Meta's stable identifier. Display-number mapping
            // remains a compatibility fallback for already-onboarded organizations.
            const mapping = phoneNumberId
              ? await getOrganizationByPhoneNumberId(phoneNumberId)
              : businessNumber
                ? await getOrganizationByWhatsAppNumber(businessNumber)
                : null;

            if (!mapping || mapping.organization.disabled) {
              console.error(
                JSON.stringify({
                  event: "whatsapp_webhook_quarantined",
                  reason: "UNKNOWN_OR_DISABLED_TENANT",
                  phoneNumberId: phoneNumberId ?? null,
                  businessNumber,
                }),
              );
              continue;
            }

            const organizationId = mapping.organizationId;

            const message = value.messages[0];
            const contact = value.contacts?.[0];

            if (message.type === "text" && message.text) {
              const phone = message.from;
              const text = message.text.body;
              const name = contact?.profile?.name;
              const messageId = message.id;

              await getWebhookQueue().add(
                "process-whatsapp",
                {
                  messageId,
                  phone,
                  text,
                  name,
                  businessNumber,
                  phoneNumberId,
                  organizationId,
                },
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
    // Let Meta retry transient queue/database failures. Message IDs are used as
    // queue job IDs and stored uniquely, so retries remain idempotent.
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
