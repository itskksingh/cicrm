"use client";

import { useState, useEffect } from "react";
import { fetchKnowledgeAction, addKnowledgeAction, deleteKnowledgeAction } from "@/app/actions/knowledge";
import { Trash2, Plus, Loader2 } from "lucide-react";

type Chunk = {
  id: string;
  department: string;
  content: string;
  createdAt: Date;
};

export default function KnowledgeBasePage() {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [department, setDepartment] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const loadChunks = async () => {
    setLoading(true);
    const res = await fetchKnowledgeAction();
    if (res.success && res.chunks) {
      setChunks(res.chunks);
    } else {
      setError(res.error || "Failed to load chunks");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadChunks();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !content) return;
    
    setSubmitting(true);
    setError("");
    const res = await addKnowledgeAction(department, content);
    if (res.success) {
      setDepartment("");
      setContent("");
      await loadChunks();
    } else {
      setError(res.error || "Failed to add chunk");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this knowledge chunk?")) return;
    
    setError("");
    const res = await deleteKnowledgeAction(id);
    if (res.success) {
      setChunks(chunks.filter(c => c.id !== id));
    } else {
      setError(res.error || "Failed to delete chunk");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Hospital AI Knowledge Base</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Add New Chunk Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-500" />
          Add Knowledge Chunk
        </h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Department</label>
            <input 
              type="text" 
              placeholder="e.g. Gastroenterology, Pediatrics, General"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Knowledge Content (Context for AI)</label>
            <textarea 
              placeholder="e.g. Dr. Sushil is our leading gastroenterologist. He performs endoscopies every day from 10 AM to 4 PM. The cost for an endoscopy is ₹2000."
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to Vector DB"}
          </button>
        </form>
      </div>

      {/* Existing Chunks List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700">Existing Knowledge</h2>
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : chunks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
            No knowledge chunks found. Add one above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chunks.map((chunk) => (
              <div key={chunk.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative group">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                    {chunk.department}
                  </span>
                  <button 
                    onClick={() => handleDelete(chunk.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete chunk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-600 text-sm whitespace-pre-wrap">{chunk.content}</p>
                <div className="mt-4 text-xs text-slate-400 font-medium">
                  {new Date(chunk.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
