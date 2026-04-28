import React, { useState, useRef } from 'react';
import { useChat } from './ChatContext';
import { Video, MoreVertical, Paperclip, Send, UserPlus, Flame, Snowflake } from 'lucide-react';
import {  format } from 'date-fns';

export default function ChatWindow() {
  const { selectedLead: lead, messages, loadingMessages, sendMessage } = useChat();
  const [inputText, setInputText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isInitialLoad = prevMessagesLength.current === 0 && messages.length > 0;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    const userSentMessage = messages.length > prevMessagesLength.current && messages[messages.length - 1]?.sender === 'STAFF';

    if (isInitialLoad || isNearBottom || userSentMessage) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }

    prevMessagesLength.current = messages.length;
  }, [messages]);

  if (!lead) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] h-full border-r border-[#E2E8F0]">
        <p className="text-[#64748B] text-lg font-medium">Select a lead to view chat</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    
    // Optimistically clear input instantly
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
    }

    try {
      await sendMessage(textToSend);
    } catch (err) {
      console.error(err);
      setInputText(textToSend); // Restore on error
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">
        {loadingMessages ? (
          <div className="flex justify-center text-[#94A3B8]">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center text-[#94A3B8]">No messages yet.</div>
        ) : (
          messages.map((msg) => {
            const isCustomer = msg.sender === 'USER';
            return (
              <div key={msg.id} className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}>
                <div 
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    isCustomer 
                      ? 'bg-white border border-[#E2E8F0] shadow-sm text-[#1E293B] rounded-tl-sm'
                      : msg.sender === 'BOT' 
                        ? 'bg-[#E2E8F0] text-[#1E293B] rounded-tr-sm'
                        : 'bg-[#0F52BA] text-white rounded-tr-sm'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{msg.content}</p>
                </div>
                <span className="text-xs text-[#94A3B8] mt-2 px-1 font-medium">
                  {msg.sender === 'BOT' ? 'Bot' : isCustomer ? 'User' : 'Staff'} • {format(new Date(msg.timestamp), 'hh:mm a')}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
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
          <div className="flex-1 relative bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] focus-within:border-[#0F52BA] transition-colors flex items-end p-2 shadow-sm">
            <button className="text-[#94A3B8] hover:text-[#475569] p-2 shrink-0 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            
            <textarea 
              ref={textareaRef}
              value={inputText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              className="flex-1 bg-transparent px-2 py-2 min-h-[40px] max-h-32 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none overflow-y-auto self-center"
              rows={1}
            ></textarea>
            
            <button 
              onClick={handleSend} 
              disabled={!inputText.trim()}
              className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                inputText.trim() 
                  ? 'bg-[#0F52BA] hover:bg-[#0A3D8E] text-white shadow-md cursor-pointer' 
                  : 'bg-transparent text-[#CBD5E1] cursor-not-allowed'
              }`}
            >
              <Send className={`w-5 h-5 ${inputText.trim() ? 'ml-0.5' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
