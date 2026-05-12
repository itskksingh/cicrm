"use client";

import React, { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import CallOutcomeModal from '../leads/CallOutcomeModal';

export default function ProspectList() {
  const { leads, loading } = useLeads();
  const [selectedLead, setSelectedLead] = useState<{id: string, name: string, phone: string} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const prospects = leads.filter(l => l.priority !== 'HOT');

  const handleCall = (lead: any) => {
    window.location.href = `tel:${lead.phone}`;
    setTimeout(() => {
      setSelectedLead({ id: lead.id, name: lead.name || lead.phone, phone: lead.phone });
      setIsModalOpen(true);
    }, 1000);
  };

  return (
    <div className="px-4 mt-8">
      <h2 className="text-xl font-bold text-content mb-4 tracking-tight">Recent Prospects</h2>
      
      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-xs text-[#64748B]">Loading...</p>
        ) : prospects.length === 0 ? (
          <p className="text-xs text-[#64748B]">No prospects found.</p>
        ) : (
          prospects.map((prospect) => {
            const isWarm = prospect.priority === 'WARM';
            const borderColor = isWarm ? 'border-l-[#b91c1c]' : 'border-l-[#2563eb]';
            const badgeColor = isWarm ? 'text-[#b91c1c]' : 'text-[#2563eb]';
            const avatarBg = 'bg-[#f1f5f9]';
            const avatarColor = isWarm ? 'text-[#334155]' : 'text-[#2563eb]';
            
            const initials = prospect.name 
              ? prospect.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() 
              : 'U';

            return (
              <div key={prospect.id} className={`bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 ${borderColor}`}>
                <Link href={`/dashboard/leads/${prospect.id}`} className="flex items-center gap-4 flex-1 min-w-0 active:opacity-70 transition-opacity">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarBg} ${avatarColor}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-content truncate">{prospect.name || prospect.phone}</h3>
                    <p className="text-[11px] text-outline/80 font-medium mt-0.5 leading-tight truncate">
                      {prospect.problem}
                    </p>
                    <p className="text-[10px] text-outline/60 mt-0.5">
                      Waiting: {formatDistanceToNow(new Date(prospect.lastMessageAt))}
                    </p>
                  </div>
                </Link>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleCall(prospect)}
                    className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[20px]">call</span>
                  </button>
                  <div className="text-right min-w-[60px]">
                    <p className="text-[10px] font-bold text-outline/60 tracking-wider">STATUS</p>
                    <p className={`text-xs font-bold leading-tight ${badgeColor}`}>{prospect.priority}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedLead && (
        <CallOutcomeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          leadId={selectedLead.id}
          leadName={selectedLead.name}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
