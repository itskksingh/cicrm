import { Sender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { saveMessage } from "@/lib/db/messages";
import {
  getWhatsAppCredentials,
  updateCredentialHealth,
} from "@/lib/db/whatsapp-credentials";
import { sendWhatsAppReply } from "@/lib/whatsapp";
import { evaluateChannelPolicy, type MessageOrigin } from "./policy";

export class MessagingPolicyError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "MessagingPolicyError";
  }
}

export async function sendSafeServiceMessage(input: {
  organizationId: string;
  leadId: string;
  content: string;
  origin: MessageOrigin;
  sender: "BOT" | "STAFF";
}) {
  if (!input.organizationId) {
    throw new MessagingPolicyError("TENANT_REQUIRED", "Organization is required");
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: input.leadId,
      organizationId: input.organizationId,
      organization: { disabled: false },
    },
    select: { id: true, phone: true },
  });

  if (!lead) {
    throw new MessagingPolicyError(
      "LEAD_NOT_ACCESSIBLE",
      "Lead does not belong to an active organization",
    );
  }

  const latestPatientMessage = await prisma.message.findFirst({
    where: {
      leadId: lead.id,
      organizationId: input.organizationId,
      sender: Sender.USER,
    },
    select: { timestamp: true },
    orderBy: { timestamp: "desc" },
  });

  const policy = evaluateChannelPolicy({
    origin: input.origin,
    lastPatientMessageAt: latestPatientMessage?.timestamp ?? null,
  });

  if (!policy.allowed) {
    console.warn(
      JSON.stringify({
        event: "whatsapp_send_blocked",
        organizationId: input.organizationId,
        leadId: input.leadId,
        origin: input.origin,
        reason: policy.reason,
      }),
    );
    throw new MessagingPolicyError(policy.reason, "WhatsApp service window is closed");
  }

  const credentials = await getWhatsAppCredentials(input.organizationId);
  if (!credentials?.accessToken || !credentials.phoneNumberId) {
    throw new MessagingPolicyError(
      "TENANT_CREDENTIALS_REQUIRED",
      "Dedicated WhatsApp credentials are required for this organization",
    );
  }

  try {
    const result = await sendWhatsAppReply(lead.phone, input.content, credentials);
    await saveMessage({
      leadId: lead.id,
      sender: input.sender,
      content: input.content,
      organizationId: input.organizationId,
    });
    await updateCredentialHealth(input.organizationId, true);

    console.info(
      JSON.stringify({
        event: "whatsapp_send_allowed",
        organizationId: input.organizationId,
        leadId: input.leadId,
        origin: input.origin,
        consentBasis: policy.consentBasis,
        metaMessageId: result.messageId ?? null,
      }),
    );

    return result;
  } catch (error) {
    await updateCredentialHealth(input.organizationId, false);
    throw error;
  }
}
