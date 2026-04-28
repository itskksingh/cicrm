import { prisma } from "@/lib/prisma";

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small", // Fast and cheap OpenAI embeddings model
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding failed: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

export async function searchKnowledge(department: string, problem: string, limit = 3) {
  const queryText = `Department: ${department}. Problem: ${problem}`;
  
  try {
    const queryEmbedding = await generateEmbedding(queryText);
    
    // Convert the embedding array into a formatted string that Postgres pgvector accepts: "[0.1, 0.2, ...]"
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Using raw SQL to leverage pgvector's <-> operator for vector distance
    // We cast the string literal to ::vector manually
    const results = await prisma.$queryRaw`
      SELECT id, department, content
      FROM knowledge_chunks
      ORDER BY embedding <-> ${embeddingString}::vector
      LIMIT ${limit}
    `;
    
    return results as { id: string, department: string, content: string }[];
  } catch (error) {
    console.error("Vector search error:", error);
    // If pgvector is not set up yet, don't crash the whole app
    return [];
  }
}

// Utility function to add hospital data to your vector DB
export async function addKnowledgeChunk(department: string, content: string) {
  const embedding = await generateEmbedding(content);
  const embeddingString = `[${embedding.join(',')}]`;
  
  await prisma.$executeRaw`
    INSERT INTO knowledge_chunks (id, department, content, embedding, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${department}, ${content}, ${embeddingString}::vector, NOW(), NOW())
  `;
}

// Get all knowledge chunks (without embeddings for UI display)
export async function getKnowledgeChunks() {
  return prisma.$queryRaw`
    SELECT id, department, content, "createdAt"
    FROM knowledge_chunks
    ORDER BY "createdAt" DESC
  ` as Promise<{ id: string; department: string; content: string; createdAt: Date }[]>;
}

// Delete a knowledge chunk
export async function deleteKnowledgeChunk(id: string) {
  await prisma.$executeRaw`
    DELETE FROM knowledge_chunks WHERE id = ${id}::uuid
  `;
}
