"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import CallOutcomeModal from '../leads/CallOutcomeModal';

interface MobileLeadCardProps {
  id: string;
  name: string;
  phone: string;
  subtitle: string;
  tag: string;
  aiAction: string;
  aiReason: string;
  source: string;
  urgencyText: string;
  urgencyColor: string;
  overdueText?: string;
  onUpdate?: () => void;
}

export default function MobileLeadCard({
  id,
  name,
  phone,
  subtitle,
  tag,
  aiAction,
  aiReason,
  source,
  urgencyText,
  urgencyColor,
  overdueText,
  onUpdate,
}: MobileLeadCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCall = () => {
    // Open the tel link
    window.location.href = `tel:${phone}`;
    
    // Show the outcome modal after a short delay or immediately
    // In mobile, the user will be switched to the phone app, 
    // and when they return, the modal will be waiting.
    setTimeout(() => {
      setIsModalOpen(true);
    }, 1000);
  };

  return (
    <>
      <div className="bg-linear-to-br from-[#ffffff] to-[#f8fafc] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#E2E8F0] border-l-4 border-l-[#b91c1c] overflow-hidden">
        <div className="p-5">
          {/* Header line */}
          <div className="flex justify-between items-start mb-1">
            <span className="bg-[#fce7f3] text-[#be185d] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
              {tag}
            </span>
            <span className="text-[28px] leading-none">🔥</span>
          </div>

          {/* Lead Identity */}
          <Link href={`/dashboard/leads/${id}`} className="block active:opacity-70 transition-opacity">
            <h3 className="text-xl font-bold text-content leading-tight mt-2">{name}</h3>
            <p className="text-xs text-outline/80 font-medium mt-1">{subtitle}</p>
          </Link>

          {/* AI Recommendation Box */}
          <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-3 mt-4 relative">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1.5 text-[#0369a1]">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                <span className="text-[10px] font-bold tracking-widest uppercase">AI Recommendation</span>
              </div>
              <span className="bg-[#0369a1] text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm">
                Quality: High
              </span>
            </div>
            <p className="text-sm font-bold text-[#0c4a6e] mt-1.5">Action: {aiAction}</p>
            <p className="text-xs text-[#0369a1]/80 italic mt-0.5">Reason: {aiReason}</p>
            
            <span className="absolute -left-1.5 -bottom-1.5 bg-[#22c55e] text-white rounded-full w-4 h-4 flex items-center justify-center p-0.5 border-2 border-white shadow-sm">
              <span className="material-symbols-outlined text-[10px] font-bold">check</span>
            </span>
            <span className="absolute right-2 bottom-2 text-[#0369a1]/40 material-symbols-outlined text-[14px]">call</span>
          </div>

          {/* Details Row */}
          <div className="flex justify-between items-end mt-5 mb-4">
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Source</p>
              <p className="text-xs font-semibold text-content mt-0.5">{source}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Urgency</p>
              <p className={`text-xs font-bold mt-0.5 ${urgencyColor}`}>{urgencyText}</p>
              {overdueText && (
                <p className="text-[8px] font-black text-[#be185d] uppercase tracking-widest mt-0.5">
                  {overdueText}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#f1f5f9]">
            <button 
              onClick={handleCall}
              className="flex-1 bg-[#b91c1c] active:bg-[#991b1b] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_12px_rgba(185,28,28,0.3)] flex justify-center items-center gap-2 transition-transform active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              Call Now
            </button>
            <button className="w-12 h-12 bg-[#f1f5f9] flex items-center justify-center rounded-xl text-content active:bg-[#e2e8f0] transition-colors">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-12 h-12 bg-[#f1f5f9] flex items-center justify-center rounded-xl text-content active:bg-[#e2e8f0] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] font-bold">check_circle</span>
            </button>
          </div>
        </div>
      </div>

      <CallOutcomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leadId={id}
        leadName={name}
        onSuccess={() => {
          if (onUpdate) onUpdate();
        }}
      />
    </>
  );
}
