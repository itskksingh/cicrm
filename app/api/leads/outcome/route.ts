import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId, outcome, notes, nextFollowUpDate } = await req.json();

    if (!leadId || !outcome) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the lead and verify organization access
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead || lead.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Lead not found or unauthorized" }, { status: 404 });
    }

    // Determine new status based on outcome
    let newStatus = lead.status;
    if (outcome === "CONVERTED") {
      newStatus = "BOOKED";
    } else if (outcome === "FOLLOW_UP") {
      newStatus = "ENGAGED";
    } else if (outcome === "NOT_INTERESTED") {
      newStatus = "CLOSED";
    }

    // Find the staff record for the current user
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [
          ...(session.user.email ? [{ email: session.user.email }] : []),
          ...(session.user.phone ? [{ phone: session.user.phone }] : []),
        ],
        organizationId: session.user.organizationId,
      },
    });

    if (!staff) {
       // If no staff record, we might still want to log but we need a staffId
       // For now, let's assume every user has a staff record or use a fallback
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Lead
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          status: newStatus,
          lastInteraction: new Date(),
          lastCallAt: new Date(),
          callAttempts: { increment: 1 },
          ...(nextFollowUpDate ? { lastFollowUpAt: new Date(nextFollowUpDate) } : {}),
        },
      });

      // 2. Create Call Log
      if (staff) {
        await tx.callLog.create({
          data: {
            leadId,
            staffId: staff.id,
            outcome: outcome, // Map outcome string to enum
            notes: notes || `Call marked as ${outcome}`,
            duration: 0, // We don't track duration yet
            organizationId: session.user.organizationId,
          },
        });
      }

      return updatedLead;
    });

    return NextResponse.json({ message: "Outcome logged successfully", lead: result });
  } catch (error: any) {
    console.error("Call outcome error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
