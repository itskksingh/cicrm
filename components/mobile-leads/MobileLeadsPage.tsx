"use client";

import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import HotLeadsSection from './HotLeadsSection';
import ProspectList from './ProspectList';
import StatsGrid from './StatsGrid';
import BottomNav from './BottomNav';

export default function MobileLeadsPage() {
  const { data: session } = useSession();

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24 font-sans relative max-w-md mx-auto shadow-2xl">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-40 flex items-center justify-between border-b border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary border-opacity-20 shadow-sm shrink-0 flex items-center justify-center bg-primary-container relative">
            {session?.user?.image ? (
              <Image 
                src={session.user.image} 
                alt="avatar" 
                fill
                className="object-cover"
                unoptimized // Use unoptimized for external profile images to avoid domain issues
              />
            ) : (
              <span className="material-symbols-outlined text-primary text-xl">person</span>
            )}
          </div>
          <h1 className="text-[#004b8f] font-black text-[18px] tracking-tight leading-none">
            CrestCare
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-1 text-[#004b8f]">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#dc2626] border-2 border-white rounded-full"></div>
          </button>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-1 text-[#004b8f]"
            title="Sign Out"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <HotLeadsSection />
      <ProspectList />
      <StatsGrid />

      {/* Floating Action Button */}
      <button className="fixed bottom-[100px] right-6 w-14 h-14 bg-[#004b8f] rounded-full shadow-[0_4px_16px_rgba(0,75,143,0.3)] flex items-center justify-center text-white active:scale-95 transition-transform z-40">
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
