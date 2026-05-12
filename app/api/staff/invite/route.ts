import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone, role = "staff" } = await req.json();

    if (!name || (!email && !phone)) {
      return NextResponse.json(
        { error: "Name and at least one contact method (email or phone) are required" },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 400 }
      );
    }

    // Hash a temporary password
    const tempPassword = "Welcome123!"; // In production, this should be sent via email/SMS
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create User and Staff in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phone,
          password: hashedPassword,
          role,
          organizationId,
        },
      });

      const staff = await tx.staff.create({
        data: {
          name,
          email,
          phone: phone || `invited-${user.id}`, // Staff phone is unique in schema, if not provided we need a placeholder or update schema
          role: role.toUpperCase() === "ADMIN" ? "ADMIN" : "CALLER",
          department: "General",
          organizationId,
        },
      });

      return { user, staff };
    });

    return NextResponse.json({
      message: "Staff invited successfully",
      user: {
        id: result.user.id,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
      },
    });
  } catch (error: any) {
    console.error("Staff invite error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
