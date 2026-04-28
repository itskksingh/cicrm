import React from 'react';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 w-full h-20 bg-surface/80 backdrop-blur-md flex items-center justify-between px-8">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-primary">Dashboard Overview</h2>
      </div>

      {/* Search Bar - Center */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative flex items-center w-full max-w-md mx-auto">
          <span className="material-symbols-outlined absolute left-3 text-outline text-xl">search</span>
          <input
            type="text"
            placeholder="Search patient, doctor, or lead..."
            className="w-full bg-surface-hover text-sm border-none rounded-full py-2.5 pl-10 pr-4 text-content focus:outline-none focus:ring-1 focus:ring-primary/30 transition-shadow"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        <button className="relative text-outline hover:text-content transition-colors mt-1">
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-hot rounded-full border border-surface"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 border-l border-[#E2E8F0] pl-6">
          <div className="text-right flex flex-col justify-center">
            <span className="text-sm font-semibold text-content leading-tight">Dr. Sarah Chen</span>
            <span className="text-[11px] text-outline font-medium">Chief Registrar</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
             <span className="material-symbols-outlined text-primary text-xl">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
