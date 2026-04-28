import { useState, useEffect } from 'react';

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
      if (messages.length === 0) setLoading(true);
      try {
        const res = await fetch(`/api/messages?leadId=${leadId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMessages(data);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchMessages();

    // Poll every 5 seconds
    const interval = setInterval(fetchMessages, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [leadId]);

  return { messages, loading };
}
