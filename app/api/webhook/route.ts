import { NextResponse } from "next/server";
import { createOrGetLead } from "@/lib/db/leads";
import { saveMessage } from "@/lib/db/messages";
import { Sender } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verify token (you can set WHATSAPP_VERIFY_TOKEN in .env)
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid token" }, { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            const message = change.value.messages[0];
            const contact = change.value.contacts?.[0];
            
            if (message.type === "text" && message.text) {
              const phone = message.from;
              const text = message.text.body;
              const name = contact?.profile?.name;

              // Step 3: Create or update lead
              const lead = await createOrGetLead({
                phone,
                name,
                problem: text,
                department: "General", // Default for now
              });

              // Step 4: Save message
              await saveMessage({
                leadId: lead.id,
                sender: Sender.USER,
                content: text,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    // Important: Meta expects a 200 OK even if there is an error processing
    // so it doesn't retry indefinitely. But returning 500 here helps with debugging.
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
