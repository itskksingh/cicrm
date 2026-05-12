"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function WhatsAppHealthBanner() {
  const { data: session } = useSession();
  const [health, setHealth] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch (err) {
        console.error("Failed to fetch WhatsApp status", err);
      }
    };

    if (session) {
      fetchStatus();
    }
  }, [session]);

  if (!health || health.status === 'working') return null;

  const isAdmin = session?.user?.role === 'admin';
  const isDisconnected = health.status === 'disconnected';

  return (
    <div className={`w-full py-3 px-6 flex items-center justify-between transition-all animate-in slide-in-from-top duration-500 ${
      isDisconnected ? 'bg-red-600' : 'bg-amber-500'
    }`}>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-white text-[20px]">
          {isDisconnected ? 'error' : 'warning'}
        </span>
        <p className="text-white text-sm font-bold tracking-wide">
          {health.message}
        </p>
      </div>

      {isAdmin && (
        <Link 
          href="/dashboard/integrations"
          className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg transition-colors border border-white/20"
        >
          Check Settings
        </Link>
      )}
    </div>
  );
}
