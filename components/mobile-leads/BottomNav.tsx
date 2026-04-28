"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: 'home', label: 'HOME', href: '/dashboard' },
    { icon: 'chat', label: 'CHATS', href: '/dashboard/chats' },
    { icon: 'group', label: 'LEADS', href: '/dashboard/leads' },
    { icon: 'insights', label: 'ANALYTICS', href: '/dashboard/analytics' },
    { icon: 'settings', label: 'SETTINGS', href: '/dashboard/settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-6 py-3 pb-8 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center">
      {navItems.map((item, idx) => {
        // Handle active state
        const isActive = 
          item.href === '/dashboard' 
            ? pathname === '/dashboard' 
            : pathname?.startsWith(item.href);

        return (
          <Link key={idx} href={item.href} className="flex flex-col items-center gap-1 min-w-[50px]">
            <span 
              className={`material-symbols-outlined text-[24px] ${isActive ? 'text-primary' : 'text-[#94A3B8]'}`}
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>
            <span className={`text-[10px] font-bold tracking-widest ${isActive ? 'text-primary' : 'text-[#94A3B8]'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
