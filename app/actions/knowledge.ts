"use server";

import { addKnowledgeChunk, getKnowledgeChunks, deleteKnowledgeChunk } from "@/lib/knowledge";
import { revalidatePath } from "next/cache";

export async function fetchKnowledgeAction() {
  try {
    const chunks = await getKnowledgeChunks();
    return { success: true, chunks };
  } catch (error: any) {
    console.error("Failed to fetch knowledge chunks:", error);
    return { success: false, error: error.message };
  }
}

export async function addKnowledgeAction(department: string, content: string, metadata?: Record<string, string>) {
  try {
    if (!department || !content) throw new Error("Department and content are required.");
    await addKnowledgeChunk(department, content, metadata);
    revalidatePath("/dashboard/knowledge");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to add knowledge chunk:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteKnowledgeAction(id: string) {
  try {
    await deleteKnowledgeChunk(id);
    revalidatePath("/dashboard/knowledge");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete knowledge chunk:", error);
    return { success: false, error: error.message };
  }
}
