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
  "डॉ. प्रियाम्वदा": "डॉ. प्रियम्वदा"
};

export async function generateChatResponse(
  chatHistory: { role: "user" | "assistant"; content: string }[],
  currentMessage: string,
  hospitalContext: string
): Promise<UnifiedAIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY is not set.");
    return { reply: "माफ़ करें, अभी मैं जवाब नहीं दे सकता।" };
  }

  // Format history for OpenAI
  const messages = chatHistory.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  const doctorContext = `
Doctors:
- Dr. Avijeet Prasad (डॉ. अभिजीत प्रसाद)
- Dr. Sushil Kumar (डॉ. सुशिल कुमार)
- Dr. Priyamvada (डॉ. प्रियम्वदा)
  `;

  const systemPrompt = `You are an empathetic medical AI assistant for Crest Care Hospital.
Your ultimate goal is to assist patients and convert them into hospital visits/appointments.

**HOSPITAL KNOWLEDGE BASE:**
${doctorContext}
${hospitalContext || "No specific context available for this yet."}

**RULES FOR REPLY:**
1. YOU MUST REPLY ONLY IN HINDI USING THE DEVANAGARI SCRIPT (e.g., "जी, हमारे यहाँ..."). Never use English alphabet for the reply.
2. Be empathetic, polite, and professional.
3. Keep the reply short (1-3 sentences maximum) suitable for WhatsApp.
4. If the user mentions a problem matching the knowledge base, tell them it's available and ask if you can book an appointment.
5. Doctor names MUST NOT be translated or guessed. Always use exact spelling if provided in context.
6. Only use information from the provided hospital knowledge base. Do NOT assume or hallucinate unknown details.

**RULES FOR CLASSIFICATION:**
If the user's latest message reveals *new* or *more specific* medical information, OR if they express intent to book/visit, you must provide an updated classification.
- Department: E.g., Pediatrics, Gynecology, General Medicine, Surgery, Orthopedics, Cardiology, Gastroenterology, etc.
- Problem: Short summary in English (e.g., "Severe abdominal pain, needs endoscopy").
- Priority: HOT (bleeding, severe pain, surgery intent), WARM (consultation, mild symptoms), COLD (general inquiry).
- Booking Intent:
  * "booking_requested" (e.g., "book my appointment", "mujhe dikhana hai")
  * "visit_confirmed" (e.g., "aa raha hu", "will visit today")
  * "none" (if just asking questions)

Respond in valid JSON format ONLY:
{
  "reply": "देवनागरी हिंदी में आपका जवाब",
  "classification": {
    "department": "Department Name",
    "problem": "Concise Problem Summary",
    "priority": "HOT | WARM | COLD",
    "booking_intent": "none | booking_requested | visit_confirmed"
  } // Only include classification if new medical information or booking intent was revealed. Otherwise, omit it.
}`;

  messages.push({ role: "user", content: currentMessage });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
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
        classification: parsed.classification ? {
          department: parsed.classification.department || "General",
          problem: parsed.classification.problem || currentMessage,
          priority: (parsed.classification.priority as Priority) || Priority.COLD,
          booking_intent: parsed.classification.booking_intent || "none"
        } : undefined
      };
    }
  } catch (error) {
    console.error("Error generating chat response:", error);
  }

  return { reply: "माफ़ करें, सर्वर में कुछ खराबी है।" };
}
