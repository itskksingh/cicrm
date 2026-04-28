"use client";

import React from 'react';
import LeadRow from './LeadRow';
import { useLeads } from '@/hooks/useLeads';

export default function LeadsTable() {
  const { leads, loading } = useLeads();

  return (
    <div className="bg-surface rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="py-4 px-6 text-[10px] font-bold text-outline tracking-widest uppercase w-[20%]">Name & Contact</th>
              <th className="py-4 px-6 text-[10px] font-bold text-outline tracking-widest uppercase w-[30%]">Problem Description</th>
              <th className="py-4 px-6 text-[10px] font-bold text-outline tracking-widest uppercase w-[15%]">Department</th>
              <th className="py-4 px-6 text-[10px] font-bold text-outline tracking-widest uppercase w-[10%]">Priority</th>
              <th className="py-4 px-6 text-[10px] font-bold text-outline tracking-widest uppercase w-[15%]">Assigned Staff</th>
              <th className="py-4 px-6 text-[10px] font-bold text-outline tracking-widest uppercase text-right w-[10%]">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-outline">Loading leads...</td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-outline">No leads found.</td>
              </tr>
            ) : (
              leads.map((lead) => (
                <LeadRow 
                  key={lead.id} 
                  name={lead.name || 'Unknown'} 
                  phone={lead.phone} 
                  problem={lead.problem} 
                  department={lead.department} 
                  priority={lead.priority} 
                  staff={{ name: lead.assignedTo?.name || 'Unassigned' }} 
                  status={lead.status as string} 
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="bg-[#F8FAFC]/50 py-4 px-6 border-t border-[#E2E8F0] flex items-center justify-between">
        <span className="text-sm font-semibold text-content/70">
          Showing {leads.length} results
        </span>
        <div className="flex items-center gap-4">
          <button className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-outline hover:text-content hover:bg-surface transition-colors cursor-not-allowed opacity-50">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="text-sm font-bold text-content">Page 1 of 1</span>
          <button className="w-8 h-8 rounded-full border border-[#E2E8F0] bg-surface flex items-center justify-center text-content hover:bg-[#F1F5F9] transition-colors shadow-sm opacity-50 cursor-not-allowed">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
