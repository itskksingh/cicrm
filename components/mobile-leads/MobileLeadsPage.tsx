import React from 'react';
import HotLeadsSection from './HotLeadsSection';
import ProspectList from './ProspectList';
import StatsGrid from './StatsGrid';
import BottomNav from './BottomNav';

export default function MobileLeadsPage() {
  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24 font-sans relative max-w-md mx-auto shadow-2xl">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-40 flex items-center justify-between border-b border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary border-opacity-20 shadow-sm shrink-0">
            <img src="https://i.pravatar.cc/150?u=dr_sarah" alt="avatar" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[#004b8f] font-black text-[18px] tracking-tight leading-none">
            Clinical Concierge
          </h1>
        </div>
        <button className="relative p-1">
          <span className="material-symbols-outlined text-[#004b8f]" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
          <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#dc2626] border-2 border-white rounded-full"></div>
        </button>
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
