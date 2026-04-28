import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DesktopLeadsPage from '@/components/leads/LeadsPage';
import MobileLeadsPage from '@/components/mobile-leads/MobileLeadsPage';

export default function LeadsDashboard() {
  return (
    <>
      {/* Desktop View (visible on lg and up) */}
      <div className="hidden lg:flex bg-[#F8FAFC] min-h-screen">
        {/* Sidebar - fixed on left */}
        <div className="w-64 shrink-0">
          <Sidebar activePath="/dashboard/leads" />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-h-screen relative">
          <Header />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC]">
            <DesktopLeadsPage />
          </main>
        </div>
      </div>

      {/* Mobile View (visible below lg) */}
      <div className="block lg:hidden min-h-screen bg-[#f8fafc]">
        <MobileLeadsPage />
      </div>
    </>
  );
}
