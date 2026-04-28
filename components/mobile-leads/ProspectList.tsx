"use client";

import React from 'react';
import { useLeads } from '@/hooks/useLeads';
import { formatDistanceToNow } from 'date-fns';

export default function ProspectList() {
  const { leads, loading } = useLeads();
  const prospects = leads.filter(l => l.priority !== 'HOT');

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
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${avatarBg} ${avatarColor}`}>
                    {initials}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-content">{prospect.name || prospect.phone}</h3>
                    <p className="text-[11px] text-outline/80 font-medium mt-0.5 max-w-[180px] leading-tight truncate">
                      {prospect.problem}
                    </p>
                    <p className="text-[10px] text-outline/60 mt-0.5">
                      Waiting: {formatDistanceToNow(new Date(prospect.lastMessageAt))}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-outline/60 tracking-wider">STATUS</p>
                    <p className={`text-xs font-bold leading-tight ${badgeColor}`}>{prospect.priority}</p>
                    <p className={`text-xs font-bold leading-tight ${badgeColor}`}>LEAD</p>
                  </div>
                  <span className="material-symbols-outlined text-outline/40">chevron_right</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
