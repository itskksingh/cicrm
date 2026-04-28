"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { useLeads, Lead } from "@/hooks/useLeads";
import { useMessages, Message } from "@/hooks/useMessages";

interface ChatContextValue {
  leads: Lead[];
  loadingLeads: boolean;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  selectedLead: Lead | null;
  messages: Message[];
  loadingMessages: boolean;
  sendMessage: (content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { leads, loading: loadingLeads } = useLeads();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  
  const { messages, loading: loadingMessages, sendMessage } = useMessages(selectedLeadId);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  return (
    <ChatContext.Provider
      value={{
        leads,
        loadingLeads,
        selectedLeadId,
        setSelectedLeadId,
        selectedLead,
        messages,
        loadingMessages,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
