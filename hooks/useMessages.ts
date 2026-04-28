import { useState, useEffect, useCallback } from 'react';

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

  useEffect(() => {
    if (!leadId) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages?leadId=${leadId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMessages(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    setLoading(true);
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

    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      content,
      sender: 'STAFF',
      timestamp: new Date().toISOString(),
      isRead: true,
      leadId,
    };

    setMessages((prev) => [...prev, newMessage]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, content, sender: 'STAFF' }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => prev.map((msg) => (msg.id === tempId ? data : msg)));
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  }, [leadId]);

  return { messages, loading, sendMessage };
}
