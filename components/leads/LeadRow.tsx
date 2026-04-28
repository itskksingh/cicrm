import React from 'react';

interface LeadProps {
  name: string;
  phone: string;
  problem: string;
  department: string;
  priority: 'HOT' | 'WARM' | 'COLD';
  staff: {
    name: string;
    avatar?: string;
  };
  status: string;
}

export default function LeadRow({ name, phone, problem, department, priority, staff, status }: LeadProps) {
  // Badges color logic
  const priorityStyles = {
    HOT: 'bg-red-50 text-red-600 font-semibold border-red-100 shadow-[0_0_8px_rgba(220,38,38,0.1)]',
    WARM: 'bg-orange-50 text-orange-600 font-semibold border-orange-100 shadow-[0_0_8px_rgba(234,88,12,0.1)]',
    COLD: 'bg-blue-50 text-blue-600 font-semibold border-blue-100 shadow-[0_0_8px_rgba(37,99,235,0.1)]',
  };

  const priorityDot = {
    HOT: 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]',
    WARM: 'bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.6)]',
    COLD: 'bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.6)]',
  };

  return (
    <tr className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]/50 transition-colors group">
      {/* Name & Contact */}
      <td className="py-5 px-6">
        <p className="text-sm font-bold text-content">{name}</p>
        <p className="text-[12px] text-outline font-medium mt-0.5">{phone}</p>
      </td>

      {/* Problem Description */}
      <td className="py-5 px-6">
        <p className="text-sm text-content/80 line-clamp-2 max-w-[220px] leading-relaxed">
          {problem}
        </p>
      </td>

      {/* Department */}
      <td className="py-5 px-6">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-container/30 text-primary">
          {department}
        </span>
      </td>

      {/* Priority */}
      <td className="py-5 px-6">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] uppercase tracking-wider border ${priorityStyles[priority]}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${priorityDot[priority]}`}></div>
          {priority}
        </div>
      </td>

      {/* Assigned Staff */}
      <td className="py-5 px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-surface border border-[#E2E8F0] shadow-sm flex items-center justify-center overflow-hidden shrink-0">
            {staff.avatar ? (
              <img src={staff.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[16px] text-outline">person</span>
            )}
          </div>
          <span className={`text-sm ${staff.name === 'Unassigned' ? 'text-outline italic' : 'text-content font-semibold'}`}>
            {staff.name}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="py-5 px-6 text-right">
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest bg-[#F1F5F9] text-content/70">
          {status}
        </span>
      </td>
    </tr>
  );
}
