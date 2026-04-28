import { prisma } from "@/lib/prisma";
import { Priority, LeadStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateLeadInput = {
  name?: string;
  phone: string;
  age?: number;
  problem: string;
  department: string;
  priority?: Priority;
};

export type AssignLeadInput = {
  leadId: string;
  staffId: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_RANK: Record<Priority, number> = {
  [Priority.HOT]: 0,
  [Priority.WARM]: 1,
  [Priority.COLD]: 2,
};

// ─── Query Functions ──────────────────────────────────────────────────────────

/**
 * Creates a new lead OR updates an existing open lead with the same phone.
 *
 * De-duplication logic:
 *  - If a lead with the same phone exists and is NOT CLOSED → update it
 *    with the latest problem, department, priority, and lastMessageAt.
 *  - Otherwise → create a new lead.
 *
 * HOT leads are auto-assigned status ASSIGNED for fast-track handling.
 */
export async function createOrGetLead(data: CreateLeadInput) {
  const resolvedPriority = data.priority ?? Priority.COLD;
  const now = new Date();

  // Look for an existing open lead with the same phone number
  const existingLead = await prisma.lead.findFirst({
    where: {
      phone: data.phone,
      status: { not: LeadStatus.CLOSED },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingLead) {
    // ── Update the existing lead with fresh classification data ──
    return prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        name: data.name ?? existingLead.name,
        age: data.age ?? existingLead.age,
        problem: data.problem,
        department: data.department,
        priority: resolvedPriority,
        lastMessageAt: now,
        // HOT leads get fast-tracked to ASSIGNED automatically
        ...(resolvedPriority === Priority.HOT &&
          existingLead.status === LeadStatus.NEW && {
            status: LeadStatus.ASSIGNED,
          }),
      },
    });
  }

  // ── Create a brand-new lead ──
  return prisma.lead.create({
    data: {
      name: data.name,
      phone: data.phone,
      age: data.age,
      problem: data.problem,
      department: data.department,
      priority: resolvedPriority,
      status:
        resolvedPriority === Priority.HOT
          ? LeadStatus.ASSIGNED
          : LeadStatus.NEW,
      lastMessageAt: now,
    },
  });
}

/**
 * Assigns a lead to a specific staff member (caller/admin).
 * Automatically updates the lead status to ASSIGNED.
 */
export async function assignLead({ leadId, staffId }: AssignLeadInput) {
  return prisma.lead.update({
    where: { id: leadId },
    data: {
      assignedToId: staffId,
      status: LeadStatus.ASSIGNED,
    },
    include: {
      assignedTo: true,
    },
  });
}

/**
 * Fetches all leads sorted by priority (HOT → WARM → COLD),
 * then by latest lastMessageAt within the same priority tier.
 *
 * Also includes an unread message count for badge display.
 */
export async function getLeadsByPriority() {
  const leads = await prisma.lead.findMany({
    include: {
      assignedTo: {
        select: { id: true, name: true, phone: true, department: true },
      },
      _count: {
        select: { messages: true, callLogs: true },
      },
      messages: {
        where: { isRead: false },
        select: { id: true },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  // Sort by priority tier first, then lastMessageAt (already desc from query)
  return leads
    .map((lead) => ({
      ...lead,
      unreadCount: lead.messages.length,
      messages: undefined, // Strip raw message IDs from response
    }))
    .sort((a, b) => {
      const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Same priority → most recent message first
      return (
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
      );
    });
}

/**
 * Updates a lead's conversion status (e.g., mark as CLOSED after conversion).
 */
export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  return prisma.lead.update({
    where: { id: leadId },
    data: { status },
  });
}

/**
 * Fetches a single lead with full details including messages and call logs.
 */
export async function getLeadById(leadId: string) {
  return prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedTo: true,
      messages: { orderBy: { timestamp: "asc" } },
      callLogs: {
        include: { staff: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
