import { prisma } from "@/lib/prisma";
import { Sender } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SaveMessageInput = {
  leadId: string;
  sender: Sender;
  content: string;
  organizationId?: string;
};

import { getDefaultOrganizationId } from "./organization";

// ─── Query Functions ──────────────────────────────────────────────────────────

/**
 * Saves a message and atomically updates the lead's lastMessageAt timestamp.
 *
 * Uses a Prisma transaction to guarantee consistency — if either
 * the message insert or the lead update fails, both are rolled back.
 */
export async function saveMessage(data: SaveMessageInput) {
  const now = new Date();

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        leadId: data.leadId,
        sender: data.sender,
        content: data.content,
        isRead: data.sender !== Sender.USER, // Staff/Bot messages are pre-read
        organizationId: data.organizationId || await getDefaultOrganizationId(),
      },
    }),
    prisma.lead.update({
      where: { id: data.leadId },
      data: { lastMessageAt: now },
    }),
  ]);

  return message;
}

/**
 * Marks all unread messages for a lead as read.
 * Called when a staff member opens the lead's chat view.
 */
export async function markMessagesAsRead(leadId: string) {
  return prisma.message.updateMany({
    where: {
      leadId,
      isRead: false,
    },
    data: { isRead: true },
  });
}

/**
 * Retrieves the full conversation history for a lead in chronological order.
 * Used to display the WhatsApp-style chat thread in the lead detail view.
 */
export async function getMessagesByLead(leadId: string) {
  return prisma.message.findMany({
    where: { leadId },
    orderBy: { timestamp: "asc" },
  });
}

/**
 * Saves multiple messages at once — useful for batch-importing
 * historical WhatsApp chat history.
 */
export async function saveMessageBatch(messages: SaveMessageInput[]) {
  const orgId = messages[0]?.organizationId || await getDefaultOrganizationId();
  return prisma.message.createMany({
    data: messages.map((m) => ({
      leadId: m.leadId,
      sender: m.sender,
      content: m.content,
      organizationId: m.organizationId || orgId,
    })),
  });
}
