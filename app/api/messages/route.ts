import { NextResponse } from "next/server";
import { getMessagesByLead, markMessagesAsRead, saveMessage } from "@/lib/db/messages";
import { getLeadById } from "@/lib/db/leads";
import { Sender } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWhatsAppCredentials } from "@/lib/db/whatsapp-credentials";

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

    let token = process.env.WHATSAPP_TOKEN;
    let phoneNumberId = process.env.PHONE_NUMBER_ID;

    if (lead.organizationId) {
      const orgCreds = await getWhatsAppCredentials(lead.organizationId);
      if (orgCreds) {
        console.log(`[WhatsApp] Using DB credentials for org ${lead.organizationId}`);
        token = orgCreds.accessToken || token;
        phoneNumberId = orgCreds.phoneNumberId || phoneNumberId;
      } else {
        console.log(`[WhatsApp] No DB credentials found for org ${lead.organizationId}, using environment fallback`);
      }
    } else {
      console.log(`[WhatsApp] No organizationId found for lead, using environment fallback`);
    }

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

    // Save message to DB after successful API call.
    // organizationId is sourced from the session for tenant isolation.
    // Falls back to getDefaultOrganizationId() inside saveMessage if no session.
    const session = await getServerSession(authOptions);
    const organizationId = session?.user?.organizationId ?? undefined;

    const savedMessage = await saveMessage({
      leadId,
      sender: sender || Sender.STAFF,
      content,
      organizationId,
    });

    return NextResponse.json(savedMessage, { status: 200 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
