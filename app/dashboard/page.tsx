import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardContent from '@/components/dashboard/Dashboard';

export default function DashboardPage() {
  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      {/* Sidebar - fixed on left */}
      <div className="hidden lg:block w-64 shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-screen relative">
        <Header />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC]">
          <DashboardContent />
        </main>
      </div>
    </div>
  );
}
