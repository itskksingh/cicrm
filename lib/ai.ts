import { Priority } from "@prisma/client";

export type AIAnalysisResult = {
  department: string;
  problem: string;
  priority: Priority;
};

export async function analyzeLeadMessage(text: string): Promise<AIAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY is not set. Using fallback logic for lead analysis.");
    return {
      department: "General",
      problem: text,
      priority: Priority.COLD,
    };
  }

  const prompt = `Analyze the following patient message and extract the appropriate medical department, a concise problem summary, and priority level.

Rules:
- Department: E.g., Pediatrics, Gynecology, General Medicine, Surgery, Orthopedics, Cardiology, etc.
- Problem: Short summary in English (e.g., "Baby fever for 3 days", "Period delayed by 4 days").
- Priority: 
  * HOT (bleeding, severe pain, surgery intent, emergencies)
  * WARM (consultation, mild symptoms, follow-ups)
  * COLD (general inquiry, timing, address requests)

Patient message: "${text}"

Respond in valid JSON format ONLY:
{
  "department": "Department Name",
  "problem": "Concise Problem Summary",
  "priority": "HOT" | "WARM" | "COLD"
}`;

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
          {
            role: "system",
            content: "You are an expert medical AI assistant for Crest Care Hospital. Always respond in valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("AI Request failed:", errorText);
      throw new Error("AI request failed");
    }

    const data = await res.json();
    const textContent = data.choices?.[0]?.message?.content;
    
    if (textContent) {
      const parsed = JSON.parse(textContent);
      return {
        department: parsed.department || "General",
        problem: parsed.problem || text,
        priority: (parsed.priority as Priority) || Priority.COLD,
      };
    }
  } catch (error) {
    console.error("Error analyzing lead message with AI:", error);
  }

  // Fallback
  return {
    department: "General",
    problem: text,
    priority: Priority.COLD,
  };
}
