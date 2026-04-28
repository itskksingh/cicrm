import { NextResponse } from "next/server";
import { getMessagesByLead, markMessagesAsRead } from "@/lib/db/messages";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");

  if (!leadId) {
    return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
  }

  try {
    // Optionally mark messages as read when fetching them
    await markMessagesAsRead(leadId);
    
    const messages = await getMessagesByLead(leadId);
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
