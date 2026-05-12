import { prisma } from "@/lib/prisma";
import { CallOutcome, LeadStatus } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LogCallInput = {
  leadId: string;
  staffId: string;
  duration: number; // Duration in seconds
  outcome: CallOutcome;
  notes?: string;
  organizationId?: string;
};

import { getDefaultOrganizationId } from "./organization";

// ─── Query Functions ──────────────────────────────────────────────────────────

/**
 * Records a completed call and atomically updates the lead's call metadata.
 *
 * In a single transaction:
 *  1. Creates the CallLog entry
 *  2. Updates the lead:
 *     - lastCallAt   → now
 *     - callAttempts  → incremented by 1
 *     - status        → CLOSED if outcome is CONVERTED, else ASSIGNED
 */
export async function logCall(data: LogCallInput) {
  const now = new Date();

  const resolvedStatus =
    data.outcome === CallOutcome.CONVERTED
      ? LeadStatus.CLOSED
      : LeadStatus.ASSIGNED;

  const [callLog] = await prisma.$transaction([
    prisma.callLog.create({
      data: {
        leadId: data.leadId,
        staffId: data.staffId,
        duration: data.duration,
        outcome: data.outcome,
        notes: data.notes,
        organizationId: data.organizationId || await getDefaultOrganizationId(),
      },
      include: {
        lead: { select: { name: true, phone: true } },
        staff: { select: { name: true } },
      },
    }),
    prisma.lead.update({
      where: { id: data.leadId },
      data: {
        lastCallAt: now,
        callAttempts: { increment: 1 },
        status: resolvedStatus,
      },
    }),
  ]);

  return callLog;
}

/**
 * Retrieves all call logs for a specific lead, newest first.
 * Used to show call history in the lead detail view.
 */
export async function getCallsByLead(leadId: string) {
  return prisma.callLog.findMany({
    where: { leadId },
    include: {
      staff: { select: { name: true, department: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retrieves all calls made by a specific staff member.
 * Used in the Admin analytics panel to track caller performance.
 */
export async function getCallsByStaff(staffId: string) {
  return prisma.callLog.findMany({
    where: { staffId },
    include: {
      lead: { select: { name: true, phone: true, priority: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Returns conversion analytics grouped by outcome.
 * Used on the Admin analytics dashboard.
 */
export async function getCallAnalytics(organizationId?: string) {
  const orgId = organizationId || await getDefaultOrganizationId();
  const [total, byOutcome, avgDuration] = await prisma.$transaction([
    prisma.callLog.count({ where: { organizationId: orgId } }),
    prisma.callLog.groupBy({
      by: ["outcome"],
      where: { organizationId: orgId },
      _count: { outcome: true },
      orderBy: { outcome: "asc" },
    }),
    prisma.callLog.aggregate({
      where: { organizationId: orgId },
      _avg: { duration: true },
    }),
  ]);

  return {
    total,
    byOutcome: byOutcome.reduce(
      (acc, row: any) => {
        acc[row.outcome as CallOutcome] = row._count?.outcome ?? row._count?._all ?? row._count ?? 0;
        return acc;
      },
      {} as Partial<Record<CallOutcome, number>>
    ),
    avgDurationSeconds: Math.round(avgDuration._avg.duration ?? 0),
  };
}
