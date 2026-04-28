import React from 'react';

export default function BottomNav() {
  const navItems = [
    { icon: 'home', label: 'HOME', active: false },
    { icon: 'chat', label: 'CHATS', active: false },
    { icon: 'group', label: 'LEADS', active: true },
    { icon: 'insights', label: 'ANALYTICS', active: false },
    { icon: 'settings', label: 'SETTINGS', active: false },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-6 py-3 pb-8 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center">
      {navItems.map((item, idx) => (
        <button key={idx} className="flex flex-col items-center gap-1 min-w-[50px]">
          <span 
            className={`material-symbols-outlined text-[24px] ${item.active ? 'text-primary' : 'text-[#94A3B8]'}`}
            style={{ fontVariationSettings: item.active ? "'FILL' 1" : "'FILL' 0" }}
          >
            {item.icon}
          </span>
          <span className={`text-[10px] font-bold tracking-widest ${item.active ? 'text-primary' : 'text-[#94A3B8]'}`}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
