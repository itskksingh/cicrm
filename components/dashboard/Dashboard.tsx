import React from 'react';
import StatCard from './StatCard';

const stats = [
  { id: 1, title: 'TOTAL LEADS TODAY', value: '142', growth: '+12.5%', growthPositive: true, icon: 'group', colorType: 'primary' as const },
  { id: 2, title: 'HOT LEADS', value: '28', growth: '+4.2%', growthPositive: true, icon: 'local_fire_department', colorType: 'hot' as const },
  { id: 3, title: 'CONVERTED PATIENTS', value: '56', growth: '+18.1%', growthPositive: true, icon: 'how_to_reg', colorType: 'primary' as const },
  { id: 4, title: 'MISSED LEADS', value: '09', growth: '-2.4%', growthPositive: false, icon: 'trending_down', colorType: 'hot' as const },
];

const departments = [
  { name: 'Orthopedics', percentage: '40%', colorClass: 'bg-primary' },
  { name: 'Gynecology', percentage: '35%', colorClass: 'bg-blue-600' },
  { name: 'Piles/General', percentage: '15%', colorClass: 'bg-red-800' },
  { name: 'Others', percentage: '10%', colorClass: 'bg-gray-200' },
];

const urgentLeads = [
  { id: '1x021', name: 'Anita Rao', dept: 'GYNAE', leadId: '#lX021', status: 'Hot Lead', isHot: true },
  { id: '8843', name: 'Vikram Sethi', dept: 'ORTHO', leadId: '#8843', status: 'Following Up', isHot: false },
];

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 pb-24">
      {/* 1. Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* 2. Middle Row: General Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leads Per Day Chart (Placeholder) */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] flex flex-col min-h-[320px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-primary">Leads per Day</h3>
              <p className="text-xs text-outline font-medium mt-0.5">Lead inflow volume for the past 7 days</p>
            </div>
            <div className="flex bg-surface-hover rounded-full p-1 border border-[#E2E8F0]">
              <button className="px-4 py-1 text-xs font-semibold rounded-full bg-white shadow-sm text-content">Weekly</button>
              <button className="px-4 py-1 text-xs font-semibold rounded-full text-outline hover:text-content transition">Monthly</button>
            </div>
          </div>
          
          <div className="flex-1 flex items-end justify-between px-4 pb-4">
            {/* Fake Bars representing graph */}
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
               <div key={day} className="flex flex-col items-center gap-2 w-full mt-auto">
                 <div className="text-[9px] font-bold text-outline">{day}</div>
               </div>
            ))}
          </div>
        </div>

        {/* Leads by Department Donut Placeholder */}
        <div className="bg-card rounded-2xl p-6 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] flex flex-col items-center min-h-[320px]">
          <div className="w-full text-left mb-6">
             <h3 className="text-lg font-bold text-primary">Leads by Department</h3>
             <p className="text-xs text-outline font-medium mt-0.5">Active inquiry distribution</p>
          </div>
          
          {/* Fake Donut Chart UI */}
          <div className="relative w-40 h-40 rounded-full border-[16px] border-surface-hover flex items-center justify-center mb-8 shrink-0">
             <div className="absolute top-[-16px] right-[-16px] w-[50%] h-[50%] border-t-[16px] border-r-[16px] border-red-800 rounded-tr-full" />
             <div className="absolute top-[-16px] right-[-16px] w-full h-[50%] border-t-[16px] border-r-[16px] border-primary rounded-tr-full rounded-tl-full opacity-90" />
             <div className="absolute bottom-[-16px] right-[-16px] w-[50%] h-full border-r-[16px] border-b-[16px] border-blue-600 rounded-br-full rounded-tr-full" />
             
             <div className="text-center flex flex-col items-center justify-center bg-white rounded-full w-full h-full">
               <span className="text-2xl font-extrabold text-content mt-1">142</span>
               <span className="text-[8px] font-bold tracking-widest text-outline uppercase">Total</span>
             </div>
          </div>

          <div className="w-full space-y-3 px-2">
            {departments.map((dept) => (
              <div key={dept.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${dept.colorClass}`} />
                  <span className="font-semibold text-content">{dept.name}</span>
                </div>
                <span className="font-bold">{dept.percentage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Conversion & Specific Actions */}
      <div className="bg-card rounded-2xl p-6 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] w-full overflow-hidden relative">
        <div className="flex justify-between items-start mb-6">
           <div>
             <h3 className="text-lg font-bold text-primary">Conversion Rate Trend</h3>
             <p className="text-xs text-outline font-medium mt-0.5">Lead-to-Patient conversion efficiency over time</p>
           </div>
           <div className="flex items-end gap-2">
             <span className="text-3xl font-extrabold text-primary pt-1">38.4%</span>
             <span className="text-[10px] bg-[#E1FCEF] text-[#059669] px-2 py-0.5 rounded font-bold mb-1.5">+1.2% this week</span>
           </div>
        </div>
        {/* Soft squiggly line placeholder area */}
        <div className="h-40 w-full mt-4 flex items-end">
             {/* Graph Line placeholder using simple svg path */}
             <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 100" className="opacity-90">
                <path d="M0,80 Q100,80 200,90 T400,60 T600,40 T800,80 T1000,50" fill="none" stroke="var(--color-primary)" strokeWidth="4" />
                <circle cx="200" cy="90" r="6" fill="white" stroke="var(--color-primary)" strokeWidth="3" />
                <circle cx="400" cy="60" r="6" fill="white" stroke="var(--color-primary)" strokeWidth="3" />
                <circle cx="800" cy="80" r="6" fill="white" stroke="var(--color-primary)" strokeWidth="3" />
             </svg>
        </div>
        <div className="flex justify-between text-[9px] font-bold text-outline uppercase mt-4 px-2">
           {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
             <span key={m}>{m}</span>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Urgent Patient Outreach */}
        <div className="bg-surface-hover rounded-2xl p-6 border border-[#E2E8F0] relative">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
            <h3 className="text-md font-bold text-primary">Urgent Patient Outreach</h3>
          </div>

          <div className="space-y-3">
            {urgentLeads.map((lead) => (
              <div key={lead.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-surface-hover">
                 <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${lead.isHot ? 'bg-[#FEE2E2] text-hot' : 'bg-primary-container text-primary'}`}>
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                   </div>
                   <div>
                     <h4 className="font-bold text-sm text-content">{lead.name}</h4>
                     <p className="text-[10px] text-outline font-semibold uppercase tracking-wider mt-0.5">{lead.dept} • LEAD ID: {lead.leadId}</p>
                   </div>
                 </div>
                 
                 <div className={`px-3 py-1.5 rounded text-[10px] font-bold ${lead.isHot ? 'bg-[#FEE2E2] text-hot' : 'bg-[#EFF6FF] text-[#1E40AF]'}`}>
                   {lead.status}
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="rounded-2xl p-8 relative overflow-hidden flex flex-col justify-center" style={{ background: 'linear-gradient(135deg, #00488d 0%, #005fb8 100%)' }}>
          {/* Faint background elements */}
          <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-white opacity-5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-[#93C5FD] tracking-widest uppercase mb-1 block">Campaign Performance</span>
            <h3 className="text-2xl font-extrabold text-white mb-3">PrecisionFluidity v2.0</h3>
            <p className="text-sm text-[#BFDBFE] font-medium leading-relaxed max-w-[85%] mb-6">
              Your lead conversion rate is up 12% compared to last month. Keep up the high-touch follow-ups!
            </p>
            <button className="bg-white text-primary font-bold text-sm px-6 py-2.5 rounded-lg shadow-md hover:bg-surface-hover transition-colors inline-block">
              View Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
