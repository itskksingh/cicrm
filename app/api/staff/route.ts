import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Get all users for this organization who are staff
    const staff = await prisma.user.findMany({
      where: {
        organizationId,
        role: "staff",
      },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        // Join with Staff model if exists
      },
    });

    // Also get Staff model details to get names
    const staffDetails = await prisma.staff.findMany({
      where: {
        organizationId,
      },
    });

    // Merge them
    const combinedStaff = staff.map(u => {
      const details = staffDetails.find(s => s.email === u.email || s.phone === u.phone);
      return {
        ...u,
        name: details?.name || "Unknown",
        department: details?.department || "N/A",
        staffId: details?.id,
      };
    });

    return NextResponse.json(combinedStaff);
  } catch (error: any) {
    console.error("Staff fetch error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json(); // User ID

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "User not found or unauthorized" }, { status: 404 });
    }

    // Delete both User and Staff in transaction
    await prisma.$transaction(async (tx) => {
      // Find corresponding staff
      const staff = await tx.staff.findFirst({
        where: {
          OR: [
            ...(user.email ? [{ email: user.email }] : []),
            ...(user.phone ? [{ phone: user.phone }] : []),
          ],
          organizationId: user.organizationId,
        },
      });

      if (staff) {
        // Update leads to null before deleting staff
        await tx.lead.updateMany({
          where: { assignedToId: staff.id },
          data: { assignedToId: null },
        });
        
        await tx.staff.delete({
          where: { id: staff.id },
        });
      }

      await tx.user.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Staff removed successfully" });
  } catch (error: any) {
    console.error("Staff delete error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
