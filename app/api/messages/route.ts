import { NextResponse } from "next/server";
import { getMessagesByLead, markMessagesAsRead, saveMessage } from "@/lib/db/messages";
import { getLeadById } from "@/lib/db/leads";
import { Sender } from "@prisma/client";

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, content, sender } = body;

    if (!leadId || !content) {
      return NextResponse.json({ error: "Missing leadId or content" }, { status: 400 });
    }

    const lead = await getLeadById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Format phone number (no '+', includes country code)
    const phoneNumber = lead.phone.replace(/\+/g, "");

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      console.warn("WhatsApp credentials not set. Cannot send message.");
      return NextResponse.json({ error: "WhatsApp credentials not configured" }, { status: 500 });
    }

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    // Log the payload for debugging as requested
    const requestPayload = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "text",
      text: { body: content },
    };
    console.log("WhatsApp API Request Payload:", JSON.stringify(requestPayload, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`WhatsApp API error [${response.status}]: ${errText}`);
      return NextResponse.json({ error: `WhatsApp API error: ${errText}` }, { status: 502 });
    }

    const responseData = await response.json();
    console.log("WhatsApp API Response:", JSON.stringify(responseData, null, 2));

    // Save message to DB after successful API call
    const savedMessage = await saveMessage({
      leadId,
      sender: sender || Sender.STAFF,
      content,
    });

    return NextResponse.json(savedMessage, { status: 200 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
