/**
 * RAG & AI Test Script for Crest Care Hospital
 * 
 * Tests the full pipeline: query → vector search → AI response
 * 
 * Run with: npm run test:rag "your query here"
 * Example:  npm run test:rag "kidney stone ka operation kon karta hai"
 *           npm run test:rag "ayushman se free me operation hoga"
 *           npm run test:rag "CT scan hota hai kya"
 *           npm run test:rag "hospital ka address kya hai"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

// ─── Embedding ────────────────────────────────────────────────────
async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  const data = await res.json();
  return data.data[0].embedding;
}

// ─── Vector Search ────────────────────────────────────────────────
async function searchKnowledge(query: string, limit = 3) {
  const embedding = await generateEmbedding(query);
  const embeddingString = `[${embedding.join(',')}]`;
  const results = await prisma.$queryRaw`
    SELECT id, department, content, metadata,
           (embedding <-> ${embeddingString}::vector) AS distance
    FROM knowledge_chunks
    ORDER BY embedding <-> ${embeddingString}::vector
    LIMIT ${limit}
  ` as { id: string; department: string; content: string; metadata: any; distance: number }[];
  return results;
}

// ─── AI Chat ──────────────────────────────────────────────────────
async function askAI(query: string, context: string): Promise<string> {
  const systemPrompt = `You are an empathetic medical AI assistant for Crest Care Hospital.

**HOSPITAL KNOWLEDGE BASE:**
${context}

**RULES FOR REPLY:**
1. YOU MUST REPLY ONLY IN HINDI USING THE DEVANAGARI SCRIPT (e.g., "जी, हमारे यहाँ..."). NEVER use English or Hinglish alphabet in the reply.
2. Be empathetic, polite, and professional.
3. Keep the reply short (1-3 sentences) suitable for WhatsApp.
4. Only use information from the hospital knowledge base. Do NOT assume or hallucinate.
5. Doctor names must not be translated — use exact names from context.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${err}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(`OpenAI error: ${data.error.message}`);
  return data.choices?.[0]?.message?.content || "[No content in response]";
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function main() {
  const query = process.argv[2];

  if (!query) {
    console.log(`\n❌ Please provide a query!`);
    console.log(`Usage: npm run test:rag "your question here"\n`);
    console.log(`Examples:`);
    console.log(`  npm run test:rag "kidney stone ka operation kon karta hai"`);
    console.log(`  npm run test:rag "ayushman se free me haddi ka operation hoga kya"`);
    console.log(`  npm run test:rag "CT scan hota hai kya"`);
    console.log(`  npm run test:rag "bawasir ka laser surgery hota hai kya"`);
    console.log(`  npm run test:rag "Dr. Avijeet Prasad ka OPD kab hai"`);
    console.log(`  npm run test:rag "pregnancy ke liye kaun sa doctor hai"\n`);
    process.exit(1);
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`🔍 QUERY: "${query}"`);
  console.log(`${"═".repeat(60)}\n`);

  // Step 1: Vector Search
  console.log(`📡 Step 1: Searching Vector DB...\n`);
  const chunks = await searchKnowledge(query, 3);

  if (chunks.length === 0) {
    console.log(`❌ No chunks found! Your vector DB might be empty.\n`);
    process.exit(1);
  }

  chunks.forEach((c, i) => {
    const distLabel = c.distance.toFixed(4);
    // For OpenAI normalized embeddings: L2 distance range is 0 (identical) to ~1.41 (opposite)
    // cosine_similarity = 1 - (distance² / 2)
    const cosineSim = (1 - (c.distance * c.distance) / 2).toFixed(3);
    const quality = c.distance < 0.7 ? "🟢 Strong" : c.distance < 1.0 ? "🟡 Moderate" : "🔴 Weak";
    console.log(`  [${i + 1}] ${c.department} | Distance: ${distLabel} | CosineSim: ${cosineSim} ${quality}`);
    if (c.metadata) {
      const meta = typeof c.metadata === "string" ? JSON.parse(c.metadata) : c.metadata;
      if (meta.doctor) console.log(`      Doctor: ${meta.doctor}`);
      if (meta.type) console.log(`      Type: ${meta.type}`);
    }
    console.log(`      Preview: "${c.content.substring(0, 100).replace(/\n/g, ' ')}..."`);
    console.log();
  });

  // Step 2: AI Response
  console.log(`\n🤖 Step 2: Generating AI response...\n`);
  const context = chunks.map(c => c.content).join("\n\n---\n\n");
  const reply = await askAI(query, context);

  console.log(`${"─".repeat(60)}`);
  console.log(`💬 BOT REPLY (what patient will see on WhatsApp):\n`);
  console.log(`  "${reply}"`);
  console.log(`${"─".repeat(60)}\n`);

  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
