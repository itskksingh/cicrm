"use client";

import React, { useState } from 'react';
import { useChat } from './ChatContext';
import { Phone, Plus, Mic, Send, Sparkles, Home, MessageSquare, Users, BarChart2, Settings, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function MobileChatPage() {
  const { leads, loadingLeads, selectedLeadId, setSelectedLeadId, selectedLead, messages, loadingMessages } = useChat();
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;
    setInputText("");
  };

  // If no lead is selected, show the list
  if (!selectedLeadId || !selectedLead) {
    return (
      <div className="flex flex-col h-dvh bg-[#F8FAFC] w-full font-sans">
        <div className="px-4 py-4 bg-white border-b border-[#E2E8F0] shadow-sm sticky top-0 z-20">
          <h1 className="text-xl font-bold text-[#0F172A]">Chats</h1>
        </div>
        <div className="flex-1 overflow-y-auto pb-24">
          {loadingLeads ? (
            <div className="p-6 text-center text-[#94A3B8]">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-6 text-center text-[#94A3B8]">No leads available.</div>
          ) : (
            leads.map(lead => (
              <div 
                key={lead.id} 
                onClick={() => setSelectedLeadId(lead.id)}
                className="p-4 border-b border-[#E2E8F0] bg-white active:bg-[#F1F5F9] cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-[#0F172A]">{lead.name || lead.phone}</h3>
                  <span className="text-[11px] text-[#94A3B8] font-medium">{formatDistanceToNow(new Date(lead.lastMessageAt), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#F1F5F9] text-[#475569] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {lead.department}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${lead.priority === 'HOT' ? 'bg-[#FEE2E2] text-[#DC2626]' : lead.priority === 'WARM' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#DBEAFE] text-[#2563EB]'}`}>
                    {lead.priority}
                  </span>
                </div>
                <p className="text-sm truncate text-[#64748B]">{lead.problem}</p>
              </div>
            ))
          )}
        </div>
        {/* Bottom Navigation */}
        <div className="h-[70px] bg-white border-t border-[#E2E8F0] px-6 py-2 flex items-center justify-between shrink-0 sticky bottom-0 z-20 pb-safe">
          <NavButton icon={<Home className="w-6 h-6" />} label="Home" />
          <NavButton icon={<MessageSquare className="w-6 h-6" fill="currentColor" />} label="Chats" active />
          <NavButton icon={<Users className="w-6 h-6" />} label="Leads" />
          <NavButton icon={<BarChart2 className="w-6 h-6" />} label="Analytics" />
          <NavButton icon={<Settings className="w-6 h-6" />} label="Settings" />
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="flex flex-col h-dvh bg-[#F8FAFC] w-full font-sans relative z-30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#F8FAFC] shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedLeadId(null)} className="mr-1 text-[#0F172A] active:scale-95 transition-transform">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="relative">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
              {selectedLead.name ? selectedLead.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#F8FAFC] rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-[#0F172A] leading-tight">{selectedLead.name || selectedLead.phone}</h2>
            <span className="text-[13px] text-[#64748B]">{selectedLead.phone}</span>
          </div>
        </div>
        <button className="w-12 h-12 rounded-full bg-[#0F52BA] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform">
          <Phone className="w-5 h-5" fill="currentColor" />
        </button>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 flex flex-col pb-24">
        {loadingMessages ? (
          <div className="text-center text-[#94A3B8]">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-[#94A3B8]">No messages yet.</div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            return (
              <div key={msg.id} className={`flex flex-col w-full ${isUser ? 'items-start' : 'items-end'}`}>
                <div className={`flex items-center gap-2 mb-1 ${isUser ? 'pl-1' : 'pr-1 flex-row-reverse'}`}>
                  <span className="text-[10px] font-bold text-[#0F172A] uppercase">{isUser ? (selectedLead.name || 'User') : msg.sender}</span>
                  <span className="text-[10px] text-[#94A3B8]">{format(new Date(msg.timestamp), 'hh:mm a')}</span>
                  {!isUser && msg.sender === 'BOT' && <Sparkles className="w-3 h-3 text-[#0F52BA]" />}
                </div>
                <div className={`rounded-2xl shadow-sm max-w-[85%] ${
                  isUser 
                    ? 'bg-white rounded-tl-sm border border-[#E2E8F0] relative overflow-hidden text-[#1E293B]' 
                    : 'bg-[#0F52BA] text-white rounded-tr-sm'
                }`}>
                  {isUser && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0F52BA]"></div>}
                  <p className={`text-[15px] leading-relaxed py-3 ${isUser ? 'pl-4 pr-3' : 'px-4'}`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input + Call Floating Section */}
      <div className="absolute bottom-[80px] w-full px-4 flex items-end justify-between z-10 gap-3">
        {/* Input Bar */}
        <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.05)] rounded-full flex items-center p-1.5 h-[56px]">
          <button className="w-10 h-10 flex items-center justify-center text-[#64748B] shrink-0">
            <Plus className="w-6 h-6" />
          </button>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-[15px] placeholder-[#94A3B8]"
          />
          <button className="w-10 h-10 flex items-center justify-center text-[#94A3B8] shrink-0">
            <Mic className="w-5 h-5" />
          </button>
          <button onClick={handleSend} className="w-11 h-11 bg-[#0F52BA] rounded-full flex items-center justify-center text-white shadow-sm shrink-0 ml-1">
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>

        {/* Floating Call Button */}
        <button className="w-12 h-14 bg-[#990000] text-white rounded-l-2xl -mr-4 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform shrink-0">
          <Phone className="w-5 h-5" fill="currentColor" />
          <span className="text-[8px] font-bold mt-0.5 uppercase tracking-wider">Call</span>
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="h-[70px] bg-white border-t border-[#E2E8F0] px-6 py-2 flex items-center justify-between shrink-0 sticky bottom-0 z-20 pb-safe">
        <NavButton icon={<Home className="w-6 h-6" />} label="Home" />
        <NavButton icon={<MessageSquare className="w-6 h-6" fill="currentColor" />} label="Chats" active />
        <NavButton icon={<Users className="w-6 h-6" />} label="Leads" />
        <NavButton icon={<BarChart2 className="w-6 h-6" />} label="Analytics" />
        <NavButton icon={<Settings className="w-6 h-6" />} label="Settings" />
      </div>
    </div>
  );
}

function NavButton({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 min-w-[50px] ${active ? 'text-[#0F52BA]' : 'text-[#94A3B8]'}`}>
      <div className={`${active ? 'bg-[#EFF6FF] px-4 py-1 rounded-full text-[#0F52BA]' : ''}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-bold tracking-wide uppercase ${active ? 'text-[#0F52BA]' : 'text-[#94A3B8]'}`}>{label}</span>
    </div>
  );
}
