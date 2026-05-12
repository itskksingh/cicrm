import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [orgs, totalLeads, failingOrgs] = await Promise.all([
    prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        disabled: true,
        onboardingComplete: true,
        createdAt: true,
        _count: { select: { leads: true, staff: true, users: true } },
        whatsappCredential: {
          select: { failureCount: true, lastSuccessAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lead.count(),
    prisma.whatsAppCredential.count({ where: { failureCount: { gte: 5 } } }),
  ]);

  const active = orgs.filter(
    (o) => !o.disabled && (o.whatsappCredential?.failureCount ?? 0) < 5
  ).length;

  return NextResponse.json({
    summary: {
      total: orgs.length,
      active,
      failing: failingOrgs,
      totalLeads,
    },
    organizations: orgs,
  });
}
