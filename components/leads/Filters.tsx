import React from 'react';

const filters = [
  { label: 'Priority', default: 'All Priorities' },
  { label: 'Department', default: 'All Departments' },
  { label: 'Date Range', default: 'Last 30 Days', icon: 'calendar_today' },
];

export default function Filters() {
  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
      {filters.map((filter, idx) => (
        <div key={idx} className="flex flex-col gap-1 w-full sm:w-auto">
          <label className="text-[10px] uppercase font-bold text-outline tracking-wider">
            {filter.label}
          </label>
          <div className="relative group">
            {filter.icon && (
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">
                {filter.icon}
              </span>
            )}
            <select
              className={`appearance-none bg-surface border border-[#E2E8F0] text-content text-sm font-semibold rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:bg-surface-hover cursor-pointer pr-10 py-2.5 ${
                filter.icon ? 'pl-9' : 'pl-4'
              }`}
            >
              <option>{filter.default}</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none group-hove:text-content transition-colors">
              expand_more
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
