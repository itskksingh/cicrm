import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credential = await prisma.whatsAppCredential.findUnique({
      where: { organizationId: session.user.organizationId },
    });

    if (!credential) {
      return NextResponse.json({ status: "disconnected", message: "No credentials configured" });
    }

    const { failureCount, lastSuccessAt } = credential;
    
    let status = "working";
    let message = "WhatsApp connection is healthy";

    if (failureCount >= 5) {
      status = "disconnected";
      message = "WhatsApp disconnected — please check settings";
    } else if (failureCount > 0) {
      status = "issues";
      message = "WhatsApp connection issues detected";
    } else if (!lastSuccessAt) {
      status = "issues";
      message = "WhatsApp connection pending";
    }

    return NextResponse.json({ status, message, failureCount, lastSuccessAt });
  } catch (error: any) {
    console.error("WhatsApp status error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
