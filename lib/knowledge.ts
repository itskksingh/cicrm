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

export async function searchKnowledge(query: string, limit = 3) {
  try {
    const queryEmbedding = await generateEmbedding(query);
    
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
export async function addKnowledgeChunk(department: string, content: string, metadata?: Record<string, string>) {
  // Inject metadata into the text before embedding to boost semantic accuracy
  let embedText = content;
  if (metadata && Object.keys(metadata).length > 0) {
    const metaString = Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(", ");
    embedText = `[Metadata: ${metaString}] \n\n ${content}`;
  }

  const embedding = await generateEmbedding(embedText);
  const embeddingString = `[${embedding.join(',')}]`;
  const metadataJson = metadata ? JSON.stringify(metadata) : null;
  
  await prisma.$executeRaw`
    INSERT INTO knowledge_chunks (id, department, content, metadata, embedding, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${department}, ${content}, ${metadataJson}::jsonb, ${embeddingString}::vector, NOW(), NOW())
  `;
}

// Get all knowledge chunks (without embeddings for UI display)
export async function getKnowledgeChunks() {
  return prisma.$queryRaw`
    SELECT id, department, content, metadata, "createdAt"
    FROM knowledge_chunks
    ORDER BY "createdAt" DESC
  ` as Promise<{ id: string; department: string; content: string; metadata: any; createdAt: Date }[]>;
}

// Delete a knowledge chunk
export async function deleteKnowledgeChunk(id: string) {
  await prisma.$executeRaw`
    DELETE FROM knowledge_chunks WHERE id = ${id}::uuid
  `;
}
