import React from 'react';
import { useChat } from './ChatContext';
import { MapPin, ChevronDown, Flame, Thermometer, Snowflake, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function LeadDetails() {
  const { selectedLead: lead } = useChat();

  if (!lead) {
    return (
      <div className="w-full md:w-[320px] lg:w-[350px] bg-[#F8FAFC] flex flex-col items-center justify-center h-full shrink-0 p-6">
        <p className="text-[#64748B] text-sm font-medium">Select a lead</p>
      </div>
    );
  }

  return (
    <div className="w-full md:w-[320px] lg:w-[350px] bg-[#F8FAFC] flex flex-col h-full overflow-y-auto shrink-0 p-6">
      
      {/* Top Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 mb-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-2xl object-cover shadow-sm mb-4 bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
            {lead.name ? lead.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] mb-1">{lead.name || lead.phone}</h2>
          <div className="flex items-center text-[#64748B] text-sm font-medium">
            <MapPin className="w-4 h-4 mr-1" />
            Unknown Location
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-1">Phone</p>
            <p className="text-sm font-bold text-[#0F172A]">{lead.phone}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-1">Age / Sex</p>
            <p className="text-sm font-bold text-[#0F172A]">{lead.age || '--'} / --</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-1">Problem</p>
            <p className="text-sm font-bold text-[#DC2626] line-clamp-2">{lead.problem}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-1">Department</p>
            <p className="text-sm font-bold text-[#0F172A]">{lead.department}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-2">Status</p>
          <div className="flex items-center gap-2">
            <span className="bg-[#FEE2E2] text-[#DC2626] text-[10px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider">
              {lead.status}
            </span>
            <span className="text-xs text-[#94A3B8] font-medium">Since {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>

      {/* Assign Staff */}
      <div className="mb-6">
        <p className="text-[11px] font-bold text-[#475569] tracking-widest uppercase mb-3">Assign Staff</p>
        <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 cursor-pointer hover:border-[#CBD5E1] transition-colors flex justify-between items-center shadow-sm">
          <span className="text-sm font-medium text-[#0F172A]">{lead.assignedTo?.name || "Unassigned"}</span>
          <ChevronDown className="w-5 h-5 text-[#94A3B8]" />
        </div>
      </div>

      {/* Internal Notes */}
      <div className="mb-6">
        <p className="text-[11px] font-bold text-[#475569] tracking-widest uppercase mb-3">Internal Notes</p>
        <textarea 
          placeholder="Add a note about patient urgency..."
          className="w-full bg-white border border-[#E2E8F0] rounded-xl p-4 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA] transition-all resize-none shadow-sm min-h-[100px]"
          defaultValue={lead.notes || ""}
        ></textarea>
      </div>

      {/* Change Priority */}
      <div className="mb-6">
        <p className="text-[11px] font-bold text-[#475569] tracking-widest uppercase mb-3">Change Priority</p>
        <div className="grid grid-cols-3 gap-3">
          <button className={`flex flex-col items-center justify-center py-4 ${lead.priority === 'HOT' ? 'bg-[#FEE2E2] border-[#FCA5A5]' : 'bg-[#FEF2F2] border-[#FECACA]'} hover:bg-[#FEE2E2] rounded-xl transition-colors border`}>
            <Flame className="w-6 h-6 text-[#DC2626] mb-1" />
            <span className="text-[10px] font-bold text-[#DC2626] uppercase">Hot</span>
          </button>
          <button className={`flex flex-col items-center justify-center py-4 ${lead.priority === 'WARM' ? 'bg-[#FEF3C7] border-[#FCD34D]' : 'bg-[#FFFBEB] border-[#FDE68A]'} hover:bg-[#FEF3C7] rounded-xl transition-colors border`}>
            <Thermometer className="w-6 h-6 text-[#D97706] mb-1" />
            <span className="text-[10px] font-bold text-[#D97706] uppercase">Warm</span>
          </button>
          <button className={`flex flex-col items-center justify-center py-4 ${lead.priority === 'COLD' ? 'bg-[#DBEAFE] border-[#93C5FD]' : 'bg-[#EFF6FF] border-[#BFDBFE]'} hover:bg-[#DBEAFE] rounded-xl transition-colors border`}>
            <Snowflake className="w-6 h-6 text-[#2563EB] mb-1" />
            <span className="text-[10px] font-bold text-[#2563EB] uppercase">Cold</span>
          </button>
        </div>
      </div>

      {/* Final CTA */}
      <div className="mt-auto pt-2">
        <button className="w-full bg-[#0F52BA] hover:bg-[#0A3D8E] text-white rounded-xl py-4 flex items-center justify-center gap-2 transition-colors shadow-[0_4px_14px_0_rgba(15,82,186,0.39)]">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">UPDATE LEAD DATA</span>
        </button>
      </div>

    </div>
  );
}
