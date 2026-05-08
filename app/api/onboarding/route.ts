import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

import { encrypt } from "@/lib/encryption";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      hospitalName, 
      whatsappPhoneNumberId, 
      whatsappAccessToken, 
      doctorName, 
      doctorDepartment 
    } = await req.json();

    const organizationId = session.user.organizationId;

    await prisma.$transaction(async (tx) => {
      // 1. Update Organization Name
      await tx.organization.update({
        where: { id: organizationId },
        data: { 
          name: hospitalName,
          onboardingComplete: true 
        },
      });

      // 2. Create WhatsApp Credentials (ENCRYPTED)
      await tx.whatsAppCredential.create({
        data: {
          organizationId,
          phoneNumberId: whatsappPhoneNumberId,
          accessToken: encrypt(whatsappAccessToken),
        },
      });

      // 3. Create First Doctor
      await tx.doctor.create({
        data: {
          name: doctorName,
          department: doctorDepartment,
          organizationId,
        },
      });
    });

    return NextResponse.json({ message: "Onboarding complete" });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
