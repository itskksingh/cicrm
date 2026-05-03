import { generateChatResponse } from "../lib/ai";
import { searchKnowledge } from "../lib/knowledge";

async function main() {
  const text = "mera pet dard kar raha hai";
  const contextChunks = await searchKnowledge(text);
  const hospitalContext = contextChunks.map((c) => c.content).join("\n\n");
  
  const chatHistory = [
    { role: "user" as const, content: "hii" },
    { role: "assistant" as const, content: "🙏 नमस्ते! Crest Care Hospital में आपका स्वागत है।\nकृपया अपनी समस्या बताएं — हम आपकी मदद के लिए हमेशा तैयार हैं।" }
  ];

  console.log("Generating response with history...");
  const aiResult = await generateChatResponse(chatHistory, text, hospitalContext);
  console.log("AI Result:", aiResult);
}

main().catch(console.error);
