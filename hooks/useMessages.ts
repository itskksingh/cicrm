import { useState, useEffect, useCallback, useRef } from 'react';

export type Message = {
  id: string;
  content: string;
  sender: 'USER' | 'BOT' | 'STAFF';
  timestamp: string;
  isRead: boolean;
  leadId: string;
};

export function useMessages(leadId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState(leadId);
  const pendingMessages = useRef<Message[]>([]);

  // Reset state when leadId changes during render to avoid cascading renders from effects
  if (leadId !== currentLeadId) {
    setCurrentLeadId(leadId);
    setMessages([]);
    if (leadId) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    pendingMessages.current = [];

    if (!leadId) {
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages?leadId=${leadId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            // Merge server data with any messages still waiting to send
            setMessages([...data, ...pendingMessages.current]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMessages();

    // Poll every 3 seconds
    const interval = setInterval(fetchMessages, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [leadId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!leadId) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      content,
      sender: 'STAFF',
      timestamp: new Date().toISOString(),
      isRead: true,
      leadId,
    };

    // Optimistically track and display
    pendingMessages.current.push(newMessage);
    setMessages((prev) => [...prev, newMessage]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, content, sender: 'STAFF' }),
      });
      if (res.ok) {
        const data = await res.json();
        // Remove from pending
        pendingMessages.current = pendingMessages.current.filter(m => m.id !== tempId);
        // Replace temp message with server confirmed message
        setMessages((prev) => prev.map((msg) => (msg.id === tempId ? data : msg)));
      } else {
        // Rollback on failure
        pendingMessages.current = pendingMessages.current.filter(m => m.id !== tempId);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      pendingMessages.current = pendingMessages.current.filter(m => m.id !== tempId);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  }, [leadId]);

  return { messages, loading, sendMessage };
}
