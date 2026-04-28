import React from 'react';

export default function StatsGrid() {
  const stats = [
    { 
      label: 'CONVERSION', 
      value: '24%', 
      subtext: '↗ +2.4% vs last week', 
      bg: 'bg-[#004b8f]', 
      text: 'text-white', 
      subTextClass: 'text-white/80' 
    },
    { 
      label: 'AVG RESPONSE', 
      value: '12m', 
      subtext: 'Within KPI limits', 
      bg: 'bg-[#F1F5F9]', 
      text: 'text-content', 
      subTextClass: 'text-outline/70' 
    },
    { 
      label: 'TOTAL LEADS', 
      value: '142', 
      subtext: '+14 since morning', 
      bg: 'bg-[#F1F5F9]', 
      text: 'text-content', 
      subTextClass: 'text-outline/70' 
    },
    { 
      label: 'TASK SCORE', 
      value: '9.8', 
      subtext: 'Excellent efficiency', 
      bg: 'bg-[#F1F5F9]', 
      text: 'text-content', 
      subTextClass: 'text-outline/70' 
    },
  ];

  return (
    <div className="px-4 mt-8 pb-32">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, idx) => (
          <div key={idx} className={`${stat.bg} rounded-2xl p-5 shadow-sm`}>
            <p className={`text-[10px] font-bold tracking-widest uppercase mb-2 ${stat.bg === 'bg-[#004b8f]' ? 'text-white' : 'text-outline'}`}>
              {stat.label}
            </p>
            <h3 className={`text-3xl font-black ${stat.text} tracking-tight`}>
              {stat.value}
            </h3>
            <p className={`text-[10px] font-semibold mt-2 ${stat.subTextClass}`}>
              {stat.subtext}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
