"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import CallOutcomeModal from '@/components/leads/CallOutcomeModal';
import Header from '@/components/dashboard/Header';

interface Message {
  id: string;
  content: string;
  sender: 'USER' | 'BOT' | 'STAFF';
  timestamp: string;
}

interface Lead {
  id: string;
  name: string | null;
  phone: string;
  problem: string;
  aiSummary: string | null;
  priority: 'HOT' | 'WARM' | 'COLD';
  status: string;
  messages: Message[];
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await fetch(`/api/leads/${id}`);
        if (res.ok) {
          const data = await res.json();
          setLead(data);
        } else {
          router.push('/dashboard/leads');
        }
      } catch (err) {
        console.error("Fetch lead error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) return null;

  const handleCall = () => {
    window.location.href = `tel:${lead.phone}`;
    setTimeout(() => setIsModalOpen(true), 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-32">
      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] px-4 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-primary truncate leading-tight">
            {lead.name || lead.phone}
          </h1>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
            Patient Detail
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${
          lead.priority === 'HOT' ? 'bg-red-100 text-red-700' : 
          lead.priority === 'WARM' ? 'bg-yellow-100 text-yellow-700' : 
          'bg-blue-100 text-blue-700'
        }`}>
          {lead.priority}
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pt-6 space-y-6">
        {/* Quick Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
          <h2 className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4">Problem Summary</h2>
          <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl p-4">
            <p className="text-sm font-bold text-[#0C4A6E] leading-relaxed">
              {lead.aiSummary || lead.problem}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Phone</p>
              <p className="text-sm font-bold text-content mt-1">{lead.phone}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Current Status</p>
              <p className="text-sm font-bold text-primary mt-1 uppercase">{lead.status}</p>
            </div>
          </div>
        </div>

        {/* Chat History */}
        <div>
          <h2 className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4 px-2">WhatsApp Conversation</h2>
          <div className="space-y-4">
            {lead.messages.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-[#E2E8F0] text-outline text-xs">
                No messages found.
              </div>
            ) : (
              lead.messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'USER' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.sender === 'USER' 
                      ? 'bg-white border border-[#E2E8F0] rounded-bl-none' 
                      : msg.sender === 'BOT'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-content text-white rounded-br-none'
                  }`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                    <div className={`text-[9px] mt-1 font-bold ${
                      msg.sender === 'USER' ? 'text-outline' : 'text-white/70'
                    }`}>
                      {msg.sender === 'BOT' ? 'AI • ' : ''}
                      {format(new Date(msg.timestamp), 'HH:mm')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#E2E8F0] z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button 
            onClick={handleCall}
            className="flex-2 bg-primary active:bg-primary-dark text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">call</span>
            CALL PATIENT NOW
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 bg-white border-2 border-[#E2E8F0] text-content font-black py-4 rounded-2xl flex items-center justify-center active:bg-surface-hover active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">check_circle</span>
          </button>
        </div>
      </div>

      <CallOutcomeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leadId={lead.id}
        leadName={lead.name || lead.phone}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
