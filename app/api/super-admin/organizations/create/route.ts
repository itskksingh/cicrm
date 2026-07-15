import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { hospitalName, adminName, adminEmail, adminPhone } = await req.json();

  if (!hospitalName || !adminName || (!adminEmail && !adminPhone)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const tempPassword = "Welcome123!";
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Organization
    const org = await tx.organization.create({
      data: { name: hospitalName },
    });

    // 2. Create Admin User
    const user = await tx.user.create({
      data: {
        email: adminEmail || null,
        phone: adminPhone || null,
        password: hashedPassword,
        role: "admin",
        organizationId: org.id,
      },
    });

    // 3. Create Staff record
    await tx.staff.create({
      data: {
        name: adminName,
        email: adminEmail || null,
        phone: adminPhone || `admin-${org.id}`,
        role: "ADMIN",
        department: "Management",
        organizationId: org.id,
      },
    });

    return { org, user };
  });

  return NextResponse.json({
    message: "Organization created",
    organizationId: result.org.id,
    tempPassword,
  });
}
