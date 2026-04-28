import { useState, useEffect } from 'react';
import { Priority, LeadStatus } from '@prisma/client';

export type Lead = {
  id: string;
  name: string | null;
  phone: string;
  age: number | null;
  problem: string;
  department: string;
  priority: Priority;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  aiSummary: string | null;
  aiConfidence: number | null;
  lastMessageAt: string;
  lastCallAt: string | null;
  callAttempts: number;
  assignedToId: string | null;
  assignedTo?: { id: string; name: string; phone: string; department: string } | null;
  unreadCount?: number;
};

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchLeads = async () => {
      try {
        const res = await fetch('/api/leads');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setLeads(data);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Failed to fetch leads:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchLeads();

    // Poll every 5 seconds
    const interval = setInterval(fetchLeads, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { leads, loading };
}
