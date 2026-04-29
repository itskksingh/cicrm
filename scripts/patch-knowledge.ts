/**
 * Micro-patch: Add Hinglish-heavy Pediatrics chunk + Gastro Hinglish boost
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!res.ok) throw new Error(`Embedding failed: ${await res.text()}`);
  const data = await res.json();
  return data.data[0].embedding;
}

async function addChunk(department: string, content: string, metadata: Record<string, string>) {
  const metaString = Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(", ");
  const embedText = `[Metadata: ${metaString}] \n\n ${content}`;
  const embedding = await generateEmbedding(embedText);
  const embeddingString = `[${embedding.join(',')}]`;
  await prisma.$executeRaw`
    INSERT INTO knowledge_chunks (id, department, content, metadata, embedding, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${department}, ${content}, ${JSON.stringify(metadata)}::jsonb, ${embeddingString}::vector, NOW(), NOW())
  `;
}

const boostChunks = [
  // Hinglish-heavy Pediatrics — catches Roman script child queries
  {
    department: "Pediatrics",
    metadata: {
      type: "condition_routing",
      doctor: "Dr. Rakesh Ranjan",
      intent: "child_doctor_hinglish",
      keywords: "baccha,bacche,bacha,bache,bacchi,baby,child,kids,neonatal,bukhar fever,khansi,diarrhea,vaccination,tikka",
    },
    content: `bacche ko bukhar hai? baby ki tabiyat theek nahi? child doctor chahiye? newborn baby ki care chahiye? vaccination (tika) lagwana hai?

Crest Care Hospital me bacchon ke doctor (Pediatrician) hain: डॉ. राकेश रंजन (Dr. Rakesh Ranjan).

OPD: हर गुरुवार और रविवार | सुबह 11 बजे से शाम 4 बजे | ₹500 fee
NICU (Neonatal ICU) bhi available hai premature aur sick newborns ke liye.

Appointment: +91 92418 07380`,
  },
  // Hinglish-heavy Gastro — catches "endoscopy hota hai kya" type queries
  {
    department: "Gastroenterology",
    metadata: {
      type: "condition_routing",
      doctor: "Dr. Sushil Kumar",
      intent: "gastro_hinglish",
      keywords: "endoscopy,colonoscopy,pet dard,acidity,jaundice,liver,hepatitis,ulcer,IBS,gastro,pet ki bimari",
    },
    content: `endoscopy hoti hai? colonoscopy hota hai? pet dard, acidity, jaundice, liver problem, hepatitis, ulcer, IBS ka ilaj chahiye?

Crest Care Hospital me Gastroenterology ke specialist hain: डॉ. सुशिल कुमार (Dr. Sushil Kumar). Unke paas Gastroenterology me special Fellowship hai.

OPD: हर दिन | सुबह 10 बजे से शाम 4 बजे
Endoscopy aur Colonoscopy dono hote hain.

Appointment: +91 92418 07380`,
  },
];

async function main() {
  console.log(`\n🔧 Micro-patch: Hinglish Boost Chunks`);
  for (const chunk of boostChunks) {
    process.stdout.write(`  ⏳ ${chunk.department} (${chunk.metadata.intent})...`);
    try {
      await addChunk(chunk.department, chunk.content, chunk.metadata);
      console.log(` ✅`);
      await new Promise(r => setTimeout(r, 400));
    } catch (err: any) {
      console.log(` ❌ ${err.message}`);
    }
  }
  console.log(`\n✅ Boost chunks added!\n`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
