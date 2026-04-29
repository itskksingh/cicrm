import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppReply } from "@/lib/whatsapp";
import { saveMessage } from "@/lib/db/messages";
import { Sender, Priority, LeadStatus } from "@prisma/client";

// Define follow-up stages and delays (in minutes)
const FOLLOWUP_RULES = [
  { stage: 0, minDelay: 20, maxDelay: 60 * 3 },      // 20 mins - 3 hours
  { stage: 1, minDelay: 60 * 3, maxDelay: 60 * 24 }, // 3 hours - 24 hours
  { stage: 2, minDelay: 60 * 24, maxDelay: 60 * 48 }, // 24 hours - 48 hours
];

const HOT_FOLLOWUP_RULES = [
  { stage: 0, minDelay: 10, maxDelay: 60 * 1 },      // 10 mins - 1 hour
  { stage: 1, minDelay: 60 * 1, maxDelay: 60 * 4 },  // 1 hour - 4 hours
];

function getTemplate(stage: number, isHot: boolean, problem?: string) {
  // Try to use the problem dynamically, otherwise leave blank
  // We check if problem string is short enough to safely inject, else ignore
  const probText = (problem && problem.length < 50 && problem !== "hello") ? `आपकी ${problem} की समस्या के लिए ` : "";

  if (isHot) {
    if (stage === 0) return `नमस्ते 🙏 ${probText}जल्दी जांच जरूरी है। आप आज ही अस्पताल आ सकते हैं या मैं तुरंत अपॉइंटमेंट बुक कर दूँ?`;
    if (stage === 1) return `नमस्ते 🙏 ${probText}देर करना ठीक नहीं है। मैं डॉ. साहब से बात करके आपका अपॉइंटमेंट अभी कन्फर्म कर सकता हूँ।`;
    return null;
  }

  if (stage === 0) return `नमस्ते 🙏 क्या आपको अभी भी मदद चाहिए? ${probText}अगर आपके पास कोई पुरानी रिपोर्ट है, तो आप यहाँ भेज सकते हैं 📄`;
  if (stage === 1) return `नमस्ते 🙏 आपने अभी तक विज़िट प्लान नहीं किया। अगर आप चाहें तो मैं आपके लिए अपॉइंटमेंट बुक कर सकता हूँ।`;
  if (stage === 2) return `नमस्ते 🙏 ${probText}बीमारी को ज्यादा देर तक टालना सही नहीं है। Crest Care Hospital में सही इलाज उपलब्ध है। क्या मैं आपका अपॉइंटमेंट बुक कर दूँ?`;
  
  return null;
}

export async function GET(req: Request) {
  // To secure this endpoint, we check an authorization header
  // You will set this header in your Cron service
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "crestcare-cron";
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Fetch all leads that might need a follow up
    const activeLeads = await prisma.lead.findMany({
      where: {
        status: { in: [LeadStatus.NEW, LeadStatus.ENGAGED] },
        followUpStage: { lt: 3 },
      }
    });

    let sentCount = 0;

    for (const lead of activeLeads) {
      const minutesSinceLastInteraction = (now.getTime() - lead.lastInteraction.getTime()) / (1000 * 60);
      const isHot = lead.priority === Priority.HOT;
      const rules = isHot ? HOT_FOLLOWUP_RULES : FOLLOWUP_RULES;
      
      const currentRule = rules.find(r => r.stage === lead.followUpStage);
      if (!currentRule) continue;

      // Check if the elapsed time falls within the required delay window for this stage
      if (minutesSinceLastInteraction >= currentRule.minDelay && minutesSinceLastInteraction <= currentRule.maxDelay) {
        
        const message = getTemplate(lead.followUpStage, isHot, lead.problem);
        if (!message) continue;

        try {
          await sendWhatsAppReply(lead.phone, message);

          await saveMessage({
            leadId: lead.id,
            sender: Sender.BOT,
            content: message,
          });

          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              followUpStage: lead.followUpStage + 1,
              lastFollowUpAt: now,
            }
          });

          sentCount++;
          console.log(`[Cron] Sent Stage ${lead.followUpStage} follow-up to ${lead.phone}`);
        } catch (error) {
          console.error(`[Cron] Failed to send follow up to ${lead.phone}`, error);
        }
      }
    }

    return NextResponse.json({ success: true, followUpsSent: sentCount });

  } catch (error: any) {
    console.error("[Cron] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
