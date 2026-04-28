import React, { useState } from 'react';
import { useChat } from './ChatContext';
import { Video, MoreVertical, Paperclip, Send, Phone, UserPlus, Flame, Snowflake } from 'lucide-react';
import {  format } from 'date-fns';

export default function ChatWindow() {
  const { selectedLead: lead, messages, loadingMessages } = useChat();
  const [inputText, setInputText] = useState("");

  if (!lead) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] h-full border-r border-[#E2E8F0]">
        <p className="text-[#64748B] text-lg font-medium">Select a lead to view chat</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!inputText.trim()) return;
    try {
      // Create message via an API route (for now just clear the text as we only show receiving messages in instructions)
      // wait, the USER only requested: "When a user sends WhatsApp message: -> Lead appears in CRM -> Message visible in chat -> Ready for staff to call"
      // They did not request sending messages from staff yet, but we'll clear the box just in case
      setInputText("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative border-r border-[#E2E8F0]">
      {/* Header */}
      <div className="h-20 border-b border-[#E2E8F0] px-6 flex items-center justify-between bg-white z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
            {lead.name ? lead.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">{lead.name || lead.phone}</h2>
            <div className="flex items-center gap-1.5 text-xs font-semibold mt-0.5">
              <span className="text-[#64748B]">CHAT ID: #{lead.id.substring(0,6)}</span>
              <span className="text-[#94A3B8]">•</span>
              <span className="text-[#DC2626] font-black px-1.5 py-0.5 bg-[#FEF2F2] rounded-md shadow-[0_0_8px_rgba(220,38,38,0.5)] tracking-wide uppercase">{lead.status}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[#475569]">
          <button className="hover:text-[#0F172A] transition-colors"><Video className="w-6 h-6" fill="currentColor" strokeWidth={0} /></button>
          <button className="hover:text-[#0F172A] transition-colors"><MoreVertical className="w-6 h-6" /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">
        {loadingMessages ? (
          <div className="flex justify-center text-[#94A3B8]">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center text-[#94A3B8]">No messages yet.</div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    isUser 
                      ? 'bg-[#0F52BA] text-white rounded-tr-sm' 
                      : msg.sender === 'BOT' 
                        ? 'bg-[#E2E8F0] text-[#1E293B] rounded-tl-sm'
                        : 'bg-white border border-[#E2E8F0] shadow-sm text-[#1E293B] rounded-tl-sm'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{msg.content}</p>
                </div>
                <span className="text-xs text-[#94A3B8] mt-2 px-1 font-medium">
                  {msg.sender === 'BOT' ? 'Bot' : msg.sender === 'USER' ? 'User' : 'Staff'} • {format(new Date(msg.timestamp), 'hh:mm a')}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-[#E2E8F0] shrink-0">
        {/* Quick Actions */}
        <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2 scrollbar-none">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-semibold text-xs rounded-full transition-colors">
            <UserPlus className="w-3.5 h-3.5" />
            ASSIGN STAFF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] font-semibold text-xs rounded-full transition-colors">
            <Flame className="w-3.5 h-3.5" />
            MARK HOT
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-semibold text-xs rounded-full transition-colors">
            <Snowflake className="w-3.5 h-3.5" />
            MARK COLD
          </button>
        </div>

        {/* Input Field */}
        <div className="flex items-end gap-3">
          <div className="flex-1 relative bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors overflow-hidden flex items-center pr-3">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your response..."
              className="w-full bg-transparent p-4 min-h-[56px] max-h-32 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none"
              rows={1}
            ></textarea>
            <button className="text-[#94A3B8] hover:text-[#475569] p-2 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          
          <button onClick={handleSend} className="w-14 h-14 lg:w-16 lg:h-16 bg-[#0F52BA] hover:bg-[#0A3D8E] text-white rounded-xl flex flex-col items-center justify-center transition-all shadow-md shrink-0 active:scale-95">
            <Send className="w-5 h-5 lg:w-6 lg:h-6 ml-1" />
          </button>
          <button className="w-14 h-14 lg:w-16 lg:h-16 bg-linear-to-br from-[#0F52BA] to-[#0A3D8E] hover:from-[#0A3D8E] hover:to-[#0A3D8E] text-white rounded-xl flex items-center justify-center transition-all shrink-0 shadow-[0_4px_20px_0_rgba(15,82,186,0.45)] hover:shadow-[0_4px_25px_0_rgba(15,82,186,0.6)] active:scale-95">
            <Phone className="w-6 h-6 lg:w-8 lg:h-8" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
