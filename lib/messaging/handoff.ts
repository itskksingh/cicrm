import { Priority } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function escalateLead(input: {
  organizationId: string;
  leadId: string;
  reason: string;
  priority: "HOT" | "WARM" | null;
}) {
  const existing = await prisma.lead.findFirst({
    where: { id: input.leadId, organizationId: input.organizationId },
    select: { notes: true },
  });

  if (!existing) return false;

  const timestamp = new Date().toISOString();
  const handoffNote = `[${timestamp}] HUMAN HANDOFF: ${input.reason}`;

  await prisma.lead.update({
    where: { id: input.leadId },
    data: {
      status: "ASSIGNED",
      priority:
        input.priority === "HOT"
          ? Priority.HOT
          : input.priority === "WARM"
            ? Priority.WARM
            : undefined,
      notes: existing.notes ? `${existing.notes}\n${handoffNote}` : handoffNote,
    },
  });

  console.warn(
    JSON.stringify({
      event: "human_handoff_requested",
      organizationId: input.organizationId,
      leadId: input.leadId,
      reason: input.reason,
      priority: input.priority,
    }),
  );

  return true;
}
