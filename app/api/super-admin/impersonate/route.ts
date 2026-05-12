import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { organizationId } = await req.json();

  // Find the admin user for this org
  const adminUser = await prisma.user.findFirst({
    where: { organizationId, role: "admin" },
  });

  if (!adminUser) {
    return NextResponse.json({ error: "No admin found for this org" }, { status: 404 });
  }

  // Create an impersonation JWT signed with the same secret
  const impersonationToken = await encode({
    token: {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      organizationId: adminUser.organizationId,
      impersonatedBy: session.user.id, // Audit trail
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev",
  });

  return NextResponse.json({ token: impersonationToken });
}
