import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  growth: string;
  growthPositive: boolean;
  icon: string;
  colorType: 'primary' | 'hot';
}

export default function StatCard({ title, value, growth, growthPositive, icon, colorType }: StatCardProps) {
  const borderColor = colorType === 'primary' ? 'border-primary' : 'border-hot';
  const iconBg = colorType === 'primary' ? 'bg-primary-container' : 'bg-[#FEE2E2]'; // Light red for hot
  const iconColor = colorType === 'primary' ? 'text-primary' : 'text-hot';
  const trendColor = growthPositive ? 'text-[#10B981]' : 'text-hot'; // Emerald for positive, red for negative
  const trendIcon = growthPositive ? 'trending_up' : 'trending_down';

  return (
    <div className={`bg-card rounded-xl shadow-sm border-l-[4px] py-5 px-6 flex flex-col justify-between h-32 relative ${borderColor} overflow-hidden`}>
      <div className="flex justify-between items-start w-full">
        <h3 className="text-[10px] font-bold text-outline tracking-wider uppercase">
          {title}
        </h3>
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${iconBg} shrink-0`}>
          <span className={`material-symbols-outlined text-[18px] ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
      </div>
      
      <div className="flex items-end gap-3 mt-1">
        <span className="text-4xl font-extrabold text-content tracking-tight">{value}</span>
        <div className={`flex items-center text-[11px] font-bold pb-1 ${trendColor}`}>
          <span className="material-symbols-outlined text-[14px] mr-0.5">{trendIcon}</span>
          <span>{growth}</span>
        </div>
      </div>
    </div>
  );
}
