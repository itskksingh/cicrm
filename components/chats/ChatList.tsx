import React from 'react';
import { useChat } from './ChatContext';
import { AlertCircle, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ChatList() {
  const { leads, loadingLeads, selectedLeadId, setSelectedLeadId } = useChat();

  return (
    <div className="w-full md:w-[320px] lg:w-[350px] bg-[#F8FAFC] border-r border-[#E2E8F0] flex flex-col h-full shrink-0">
      {/* Tabs */}
      <div className="p-4 flex items-center gap-2">
        <button className="bg-[#0F52BA] text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
          All
        </button>
        <button className="bg-[#E2E8F0] text-[#64748B] hover:bg-[#CBD5E1] transition-colors px-4 py-1.5 rounded-full text-sm font-medium">
          Unassigned
        </button>
        <button className="bg-[#E2E8F0] text-[#64748B] hover:bg-[#CBD5E1] transition-colors px-4 py-1.5 rounded-full text-sm font-medium">
          Starred
        </button>
      </div>

      {/* List */}
      <div className="flex-1 pb-4 overflow-y-auto">
        {loadingLeads && leads.length === 0 ? (
          <div className="p-4 text-center text-[#64748B] text-sm">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-4 text-center text-[#64748B] text-sm">No leads found</div>
        ) : (
          leads.map((chat) => {
            const isActive = chat.id === selectedLeadId;
            return (
              <div
                key={chat.id}
                onClick={() => setSelectedLeadId(chat.id)}
                className={`p-4 border-b border-[#E2E8F0] cursor-pointer transition-colors ${
                  isActive ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-bold ${isActive ? 'text-[#0F172A]' : 'text-[#334155]'}`}>
                    {chat.name || chat.phone}
                  </h3>
                  <span className="text-[11px] text-[#94A3B8] font-medium">
                    {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#F1F5F9] text-[#475569] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {chat.department}
                  </span>
                  {chat.priority === 'HOT' && (
                    <AlertCircle className="w-4 h-4 text-[#DC2626] fill-[#FEE2E2]" />
                  )}
                  {chat.priority === 'WARM' && (
                    <AlertTriangle className="w-4 h-4 text-[#D97706] fill-[#FEF3C7]" />
                  )}
                  {chat.priority === 'COLD' && (
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] fill-[#DBEAFE]" />
                  )}
                  {chat.unreadCount && chat.unreadCount > 0 ? (
                    <span className="ml-auto bg-[#DC2626] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {chat.unreadCount}
                    </span>
                  ) : null}
                </div>
                
                <p className={`text-sm truncate ${isActive ? 'text-[#475569] italic' : 'text-[#64748B]'}`}>
                  {chat.problem}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
