import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: { select: { leads: true, staff: true, users: true, doctors: true } },
      whatsappCredential: {
        select: {
          failureCount: true,
          lastSuccessAt: true,
          lastFailureAt: true,
          phoneNumberId: true,
        },
      },
    },
  });

  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(org);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { disabled } = await req.json();

  const org = await prisma.organization.update({
    where: { id },
    data: { disabled },
  });

  return NextResponse.json({ message: `Organization ${disabled ? "disabled" : "enabled"}`, org });
}
