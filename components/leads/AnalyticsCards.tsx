import React from 'react';

export default function AnalyticsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {/* Left Card: Conversion */}
      <div className="bg-primary rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
           <span className="material-symbols-outlined text-white text-[80px]">trending_up</span>
        </div>
        
        <div className="flex items-center justify-between z-10">
          <span className="material-symbols-outlined text-white/80">trending_up</span>
          <span className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase backdrop-blur-sm">
            Conversion
          </span>
        </div>
        <div className="mt-8 z-10">
          <h3 className="text-5xl font-black text-white tracking-tight">24%</h3>
          <p className="text-white/80 text-sm font-medium mt-2 leading-relaxed max-w-[200px]">
            Lead-to-Patient conversion rate this month.
          </p>
        </div>
      </div>

      {/* Middle Card: Hot Leads Volume */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-[#E2E8F0] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-content uppercase tracking-widest">
            Hot Leads Volume
          </h3>
          <span className="text-red-500 font-black text-sm bg-red-50 px-2 py-1 rounded-md">
            +12%
          </span>
        </div>
        
        {/* Placeholder Bar Graph */}
        <div className="flex items-end gap-2 h-20 w-full mb-4">
          <div className="w-1/6 bg-red-100 rounded-t-sm h-[20%]"></div>
          <div className="w-1/6 bg-red-200 rounded-t-sm h-[40%]"></div>
          <div className="w-1/6 bg-red-300 rounded-t-sm h-[35%]"></div>
          <div className="w-1/6 bg-red-400 rounded-t-sm h-[60%]"></div>
          <div className="w-1/6 bg-red-500 rounded-t-sm h-[50%]"></div>
          <div className="w-1/6 bg-red-700 rounded-t-sm h-[80%]"></div>
        </div>

        <p className="text-[11px] font-bold text-outline">
          Projected peak in 3 days.
        </p>
      </div>

      {/* Right Card: Department Spotlight */}
      <div className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-[#E2E8F0] relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop")' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/40 to-transparent"></div>
        
        <div className="relative h-full p-6 flex flex-col justify-end">
          <span className="text-white/80 text-[10px] font-bold tracking-widest uppercase mb-1 drop-shadow-md">
            Department Spotlight
          </span>
          <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md">
            Cardiology expansion scheduled for Q4.
          </h3>
        </div>
      </div>
    </div>
  );
}
