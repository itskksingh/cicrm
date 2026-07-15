import { NextResponse } from "next/server";
import { getMessagesByLead, markMessagesAsRead } from "@/lib/db/messages";
import { Sender } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MessagingPolicyError,
  sendSafeServiceMessage,
} from "@/lib/messaging/safe-send";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");

  if (!leadId) {
    return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId: session.user.organizationId,
        organization: { disabled: false },
      },
      select: { id: true },
    });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Optionally mark messages as read when fetching them
    await markMessagesAsRead(leadId);
    
    const messages = await getMessagesByLead(leadId);
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const organizationId = session?.user?.organizationId;
    if (!session?.user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { leadId, content } = body;

    if (!leadId || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Missing leadId or content" }, { status: 400 });
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId,
        organization: { disabled: false },
      },
      select: { id: true },
    });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const result = await sendSafeServiceMessage({
      organizationId,
      leadId,
      sender: Sender.STAFF,
      origin: "STAFF_REPLY",
      content: content.trim(),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof MessagingPolicyError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 409 },
      );
    }
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
