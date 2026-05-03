"use client";

import React, { useState } from 'react';

interface CallOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  onSuccess: () => void;
}

export default function CallOutcomeModal({ isOpen, onClose, leadId, leadName, onSuccess }: CallOutcomeModalProps) {
  const [outcome, setOutcome] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcome) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/leads/outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          outcome,
          notes,
          nextFollowUpDate: outcome === 'FOLLOW_UP' ? followUpDate : null,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save outcome');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-md rounded-t-[24px] sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-primary">Call Outcome</h3>
              <p className="text-xs text-outline font-medium mt-1 uppercase tracking-wider">Log result for: {leadName}</p>
            </div>
            <button onClick={onClose} className="p-2 text-outline hover:text-content transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold border border-red-100">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setOutcome('CONVERTED')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  outcome === 'CONVERTED' 
                    ? 'border-[#22c55e] bg-[#f0fdf4] shadow-sm' 
                    : 'border-[#f1f5f9] hover:border-[#22c55e]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#22c55e] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-[#166534]">Converted</p>
                    <p className="text-[10px] text-[#166534]/70 font-medium">Patient booked/visited</p>
                  </div>
                </div>
                {outcome === 'CONVERTED' && <span className="material-symbols-outlined text-[#22c55e]">check_circle</span>}
              </button>

              <button
                type="button"
                onClick={() => setOutcome('FOLLOW_UP')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  outcome === 'FOLLOW_UP' 
                    ? 'border-[#f59e0b] bg-[#fffbeb] shadow-sm' 
                    : 'border-[#f1f5f9] hover:border-[#f59e0b]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">sync</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-[#92400e]">Follow-up</p>
                    <p className="text-[10px] text-[#92400e]/70 font-medium">Needs another call</p>
                  </div>
                </div>
                {outcome === 'FOLLOW_UP' && <span className="material-symbols-outlined text-[#f59e0b]">check_circle</span>}
              </button>

              <button
                type="button"
                onClick={() => setOutcome('NOT_INTERESTED')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  outcome === 'NOT_INTERESTED' 
                    ? 'border-[#ef4444] bg-[#fef2f2] shadow-sm' 
                    : 'border-[#f1f5f9] hover:border-[#ef4444]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ef4444] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-[#991b1b]">Not Interested</p>
                    <p className="text-[10px] text-[#991b1b]/70 font-medium">Lost lead / Wrong number</p>
                  </div>
                </div>
                {outcome === 'NOT_INTERESTED' && <span className="material-symbols-outlined text-[#ef4444]">check_circle</span>}
              </button>
            </div>

            {outcome === 'FOLLOW_UP' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Next Follow-up Date</label>
                <input
                  type="date"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm"
                />
              </div>
            )}

            <div className="pt-2">
              <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Short Note (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm resize-none h-20"
                placeholder="Mention specific patient concerns..."
              />
            </div>

            <button
              type="submit"
              disabled={!outcome || loading}
              className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
            >
              {loading ? "SAVING..." : "CONFIRM OUTCOME"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
