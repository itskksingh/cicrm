"use client";

import React from 'react';
import MobileLeadCard from './MobileLeadCard';
import { useLeads } from '@/hooks/useLeads';

export default function HotLeadsSection() {
  const { leads, loading } = useLeads();
  const hotLeads = leads.filter(l => l.priority === 'HOT');

  return (
    <div className="px-4 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#b91c1c]">local_fire_department</span>
        <h2 className="text-sm font-black text-[#b91c1c] tracking-widest uppercase">Hot Leads</h2>
        <span className="bg-[#7f1d1d] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
          {hotLeads.length} Urgent
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-xs text-[#64748B]">Loading...</p>
        ) : hotLeads.length === 0 ? (
          <p className="text-xs text-[#64748B]">No urgent leads right now.</p>
        ) : (
          hotLeads.map((lead) => (
            <MobileLeadCard 
              key={lead.id} 
              name={lead.name || lead.phone}
              subtitle={lead.problem.substring(0, 40) + '...'}
              tag="ACTION REQUIRED"
              aiAction="Call Now"
              aiReason={lead.problem.substring(0, 20)}
              source={lead.department}
              urgencyText="Waiting"
              urgencyColor="text-[#dc2626]"
            />
          ))
        )}
      </div>
    </div>
  );
}
