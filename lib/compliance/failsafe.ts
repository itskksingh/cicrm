import { prisma } from "../prisma";

export async function checkFailsafe(
  leadId: string, 
  riskScore: number, 
  sanitizerTriggered: boolean
): Promise<boolean> {
  // If risk score is extremely high or sanitizer triggered, track it
  if (riskScore > 70 || sanitizerTriggered) {
    // We update the lead to increment a failsafe trigger count
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (lead) {
      // Use followUpStage or a new field, but since we can't change schema easily, 
      // let's use a metadata or just change status to HANDOVER if triggered multiple times.
      // If we don't have a specific field, we can just return true if risk > 70 for simplicity.
      // But let's check past messages if needed, or simply trigger handover immediately.
      
      // We will trigger failsafe immediately on risk > 70 or sanitizer triggered
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'ASSIGNED', // Escalate to staff
          notes: '⚠️ FAILSAFE TRIGGERED: High risk query or sanitizer blocked.',
          priority: 'HOT'
        }
      });
      return true;
    }
  }

  return false;
}
