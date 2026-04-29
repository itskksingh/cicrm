import { Priority } from "@prisma/client";

export type UnifiedAIResponse = {
  reply: string;
  classification?: {
    department: string;
    problem: string;
    priority: Priority;
    booking_intent: "none" | "booking_requested" | "visit_confirmed";
  };
};

const DOCTOR_NAME_MAP: Record<string, string> = {
  "Dr. Avijeet Prasad": "डॉ. अभिजीत प्रसाद",
  "Dr. Sushil Kumar": "डॉ. सुशिल कुमार",
  "Dr. Priyamvada": "डॉ. प्रियम्वदा",

  // Common incorrect outputs to auto-correct
  "डॉ. अविजीत प्रसाद": "डॉ. अभिजीत प्रसाद",
  "डॉ. सुषिल कुमार": "डॉ. सुशिल कुमार",
  "डॉ. प्रियाम्वदा": "डॉ. प्रियम्वदा",
};

// ─── DETERMINISTIC OVERRIDE LAYER ────────────────────────────────────────────
// These run BEFORE OpenAI to guarantee 100% accuracy for critical factual queries.
// DO NOT modify OpenAI flow below this section.

// ── Intent Detectors ──
const isScheduleQuery = (msg: string) => {
  const t = msg.toLowerCase();
  return (
    t.includes("kab") ||
    t.includes("kis din") ||
    t.includes("opd") ||
    t.includes("timing") ||
    t.includes("time") ||
    t.includes("baithte") ||
    t.includes("available") ||
    t.includes("schedule")
  );
};

const isFeeQuery = (msg: string) => {
  const t = msg.toLowerCase();
  return (
    t.includes("fee") ||
    t.includes("fees") ||
    t.includes("charge") ||
    t.includes("kitna") ||
    t.includes("cost") ||
    t.includes("price") ||
    t.includes("kitne paise")
  );
};

const isAddressQuery = (msg: string) => {
  const t = msg.toLowerCase();
  return (
    t.includes("address") ||
    t.includes("kahan") ||
    t.includes("location") ||
    t.includes("kidhar") ||
    t.includes("map") ||
    t.includes("kaise aaye")
  );
};

const isEmergencyQuery = (msg: string) => {
  const t = msg.toLowerCase();
  return (
    t.includes("emergency") ||
    t.includes("urgent") ||
    t.includes("accident") ||
    t.includes("serious") ||
    t.includes("saans nahi") ||
    t.includes("bleeding") ||
    t.includes("jaldi")
  );
};

const isGreeting = (msg: string) => {
  const t = msg.trim().toLowerCase();
  // Match messages that are ONLY a greeting (nothing else meaningful)
  return /^(hi+|hello+|hey+|hlo+|helo+|namaste|namaskar|jai hind|good morning|good evening|good afternoon|g\.?m\.?|g\.?e\.?|hy|hii+|helo+|hlw)[\.!\s]*$/.test(t);
};

const isVoiceMessage = (msg: string) => {
  const t = msg.toLowerCase();
  // WhatsApp sends a transcription placeholder or specific text for audio
  return (
    t.includes("[audio]") ||
    t.includes("[voice]") ||
    t.includes("voice message") ||
    t.includes("audio message") ||
    t === "audio" ||
    t === "voice"
  );
};

// ── Doctor Detector ──
const detectDoctor = (msg: string): string | null => {
  const t = msg.toLowerCase();
  if (t.includes("avijeet") || t.includes("abhijeet")) return "doc_avijeet";
  if (t.includes("rahul")) return "doc_rahul";
  if (t.includes("sushil")) return "doc_sushil";
  if (t.includes("shrawan") || t.includes("shravan")) return "doc_shrawan";
  if (t.includes("priyam")) return "doc_priyamvada";
  if (t.includes("ajay")) return "doc_ajay";
  if (t.includes("rohit")) return "doc_rohit";
  if (t.includes("rakesh")) return "doc_rakesh";
  return null;
};

// ── Source of Truth Maps ──
const DOCTOR_SCHEDULE: Record<string, { name: string; days: string; time: string }> = {
  doc_avijeet: { name: "डॉ. अभिजीत प्रसाद", days: "गुरुवार और रविवार", time: "सुबह 10 से शाम 4 बजे" },
  doc_rahul: { name: "डॉ. राहुल कुमार चंदन", days: "सोमवार", time: "सुबह 10 से शाम 4 बजे" },
  doc_sushil: { name: "डॉ. सुशिल कुमार", days: "हर दिन", time: "सुबह 10 से शाम 4 बजे" },
  doc_shrawan: { name: "डॉ. श्रवण कुमार", days: "शुक्रवार", time: "सुबह 10 से शाम 4 बजे" },
  doc_priyamvada: { name: "डॉ. प्रियम्वदा", days: "हर दिन", time: "सुबह 10 से शाम 5 बजे" },
  doc_ajay: { name: "डॉ. अजय कुमार", days: "गुरुवार और रविवार", time: "दोपहर 1 से शाम 5 बजे" },
  doc_rohit: { name: "डॉ. रोहित कुमार", days: "हर महीने का तीसरा शनिवार", time: "सुबह 10 से दोपहर 1 बजे" },
  doc_rakesh: { name: "डॉ. राकेश रंजन", days: "गुरुवार और रविवार", time: "सुबह 11 से शाम 4 बजे" },
};

const DOCTOR_FEES: Record<string, string> = {
  doc_avijeet: "₹500",
  doc_rahul: "₹500",
  doc_sushil: "₹500",
  doc_shrawan: "₹500",
  doc_priyamvada: "₹300",
  doc_ajay: "₹500",
  doc_rohit: "₹500",
  doc_rakesh: "₹500",
};

const HOSPITAL_INFO = {
  address: "Crest Care Hospital, Jamua, Giridih — Jamua थाना के पास | संपर्क: +91 92418 07380",
  emergency: "Crest Care Hospital में 24/7 इमरजेंसी और एम्बुलेंस सेवा उपलब्ध है। तुरंत: +91 92418 07380",
};

// ── Response Builders ──
const getSchedule = (id: string): string | null => {
  const d = DOCTOR_SCHEDULE[id];
  if (!d) return null;
  return `${d.name} ${d.days} को OPD में बैठते हैं 🙏\nसमय: ${d.time}\nAppointment: +91 92418 07380`;
};

const getFees = (id: string): string | null => {
  const f = DOCTOR_FEES[id];
  const d = DOCTOR_SCHEDULE[id];
  if (!f || !d) return null;
  return `${d.name} की परामर्श फीस ${f} है 🙏\nOPD: ${d.days} | ${d.time}`;
};

const getAddress = (): string => `📍 ${HOSPITAL_INFO.address}\nGPS पर "Crest Care Hospital Jamua" खोजें।`;

const getEmergency = (): string => `⚠️ यह इमरजेंसी हो सकती है।\nकृपया तुरंत अस्पताल आएं।\n${HOSPITAL_INFO.emergency}`;

// ────// ─────────────────────────────────────────────────────────────────────────

export async function generateChatResponse(
  chatHistory: { role: "user" | "assistant"; content: string }[],
  currentMessage: string,
  hospitalContext: string,
): Promise<UnifiedAIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY is not set.");
    return { reply: "माफ़ करें, अभी मैं जवाब नहीं दे सकता।" };
  }

  // ── DETERMINISTIC INTERCEPT — runs before OpenAI, zero hallucination risk ──
  const doctorId = detectDoctor(currentMessage);
  if (isVoiceMessage(currentMessage))
    return { reply: "🙏 नमस्ते! कृपया अपनी समस्या text में लिखकर भेजें, हम आपकी जल्दी मदद करेंगे।" };
  if (isGreeting(currentMessage))
    return { reply: "🙏 नमस्ते! Crest Care Hospital में आपका स्वागत है।\nकृपया अपनी समस्या बताएं — हम आपकी मदद के लिए हमेशा तैयार हैं।" };
  if (isEmergencyQuery(currentMessage)) return { reply: getEmergency() };
  if (isAddressQuery(currentMessage)) return { reply: getAddress() };
  if (doctorId && isScheduleQuery(currentMessage)) {
    const r = getSchedule(doctorId);
    if (r) return { reply: r };
  }
  if (doctorId && isFeeQuery(currentMessage)) {
    const r = getFees(doctorId);
    if (r) return { reply: r };
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Format history for OpenAI
  const messages = chatHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const doctorContext = `
STRICT DOCTOR-DEPARTMENT MAPPING (DO NOT VIOLATE):

1. General Surgery / Gastro → डॉ. सुशिल कुमार
- Handles: पेट दर्द, गैस, पाइल्स, हर्निया, ऑपरेशन

2. Orthopedics (Bone/Fracture/Joint):
- सोमवार → डॉ. राहुल कुमार चंदन
- गुरुवार/रविवार → डॉ. अभिजीत प्रसाद

3. Urology (Kidney/Urine/Stone):
→ ONLY डॉ. श्रवण कुमार

4. Gynecology (Pregnancy/Ladies):
→ ONLY डॉ. प्रियम्वदा

5. General Medicine (Fever/BP/Diabetes):
→ ONLY डॉ. अजय कुमार
→ DOES NOT DO SURGERY

6. Cardiology (Heart):
→ ONLY डॉ. रोहित कुमार
→ NO surgery / no angioplasty

7. Pediatrics (Child/Baby):
→ ONLY डॉ. राकेश रंजन

CRITICAL RULE:
- Never assign doctor outside this mapping
- If unsure → ask user for more details
`;

  // (old prompt removed)

  const systemPrompt = `
You are a medical assistant for Crest Care Hospital. Help patients find the right doctor and encourage a hospital visit.

${doctorContext}

HOSPITAL RAG CONTEXT:
${hospitalContext || ""}

-----------------------------
🔴 STRICT RULES

1. ALWAYS reply in Hindi (Devanagari only). NEVER use English letters in the reply.
2. NEVER guess doctor — use ONLY the doctor mapping above.
3. NEVER generate schedule, fees, or hospital address (handled by backend).
4. If condition detected → assign correct doctor only.
5. If condition unclear → ask: "कृपया अपनी समस्या थोड़ा विस्तार से बताएं"
6. Reply must be short: 1–3 lines, WhatsApp-friendly.
7. End every reply with: "क्या मैं आपका अपॉइंटमेंट बुक कर दूँ?"
8. If info not available → say: "इस जानकारी के लिए कृपया अस्पताल से संपर्क करें: +91 92418 07380"

-----------------------------
RESPOND IN JSON FORMAT ONLY:
{
  "reply": "हिंदी में जवाब",
  "classification": {
    "department": "Department name",
    "problem": "Brief English summary",
    "priority": "HOT | WARM | COLD",
    "booking_intent": "none | booking_requested | visit_confirmed"
  }
}
Only include classification if new medical info or booking intent was revealed. Otherwise omit it.
`;
  messages.push({ role: "user", content: currentMessage });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      throw new Error(`AI request failed: ${await res.text()}`);
    }

    const data = await res.json();
    const textContent = data.choices?.[0]?.message?.content;

    if (textContent) {
      let parsed;
      try {
        parsed = JSON.parse(textContent);
      } catch (err) {
        console.error("JSON parse error:", err);
        return { reply: "माफ़ करें, अभी मैं जवाब नहीं दे सकता।" };
      }

      let replyText = parsed.reply || "माफ़ करें, अभी मैं जवाब नहीं दे सकता।";

      // Fix doctor name issues
      Object.keys(DOCTOR_NAME_MAP).forEach((key) => {
        replyText = replyText.replaceAll(key, DOCTOR_NAME_MAP[key]);
      });

      return {
        reply: replyText,
        classification: parsed.classification
          ? {
              department: parsed.classification.department || "General",
              problem: parsed.classification.problem || currentMessage,
              priority: (parsed.classification.priority as Priority) || Priority.COLD,
              booking_intent: parsed.classification.booking_intent || "none",
            }
          : undefined,
      };
    }
  } catch (error) {
    console.error("Error generating chat response:", error);
  }

  return { reply: "माफ़ करें, सर्वर में कुछ खराबी है।" };
}
