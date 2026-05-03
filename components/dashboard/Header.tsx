"use client";

import React from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-10 w-full h-20 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 border-b border-[#E2E8F0]">
      {/* Page Title */}
      <div className="hidden sm:block">
        <h2 className="text-lg font-black text-primary tracking-tight">Dashboard</h2>
      </div>

      {/* Search Bar - Center */}
      <div className="flex-1 max-w-md mx-4 sm:mx-8">
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-3 text-outline text-xl">search</span>
          <input
            type="text"
            placeholder="Search leads..."
            className="w-full bg-[#F1F5F9] text-sm border-none rounded-2xl py-2.5 pl-10 pr-4 text-content focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 sm:gap-6">
        <button className="relative text-outline hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Profile & Logout */}
        <div className="flex items-center gap-3 border-l border-[#E2E8F0] pl-4 sm:pl-6">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-black text-content leading-tight">
              {session?.user?.name || "User"}
            </span>
            <span className="text-[10px] text-outline font-bold uppercase tracking-widest">
              {session?.user?.role || "Staff"}
            </span>
          </div>
          
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-outline hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all group"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
