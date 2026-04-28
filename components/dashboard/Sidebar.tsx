import React from 'react';
import Link from 'next/link';

export default function Sidebar({ activePath = '/dashboard' }: { activePath?: string }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-[#E2E8F0] flex flex-col justify-between py-6 px-4 z-10 transition-all duration-300">
      <div>
        {/* Logo Section */}
        <div className="mb-10 px-2">
          <h1 className="text-xl font-bold text-primary tracking-tight">The Clinical</h1>
          <h1 className="text-xl font-bold text-primary tracking-tight leading-tight">Concierge</h1>
          <p className="text-[10px] font-bold text-outline mt-1 uppercase tracking-widest">
            Precision Fluidity CRM
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          <Link href="/dashboard">
            <NavItem icon="dashboard" label="Dashboard" active={activePath === '/dashboard'} />
          </Link>
          <Link href="/dashboard/chats">
            <NavItem icon="chat" label="Chats" active={activePath === '/dashboard/chats'} />
          </Link>
          <Link href="/dashboard/leads">
            <NavItem icon="assignment_ind" label="Leads" active={activePath === '/dashboard/leads'} />
          </Link>
          <Link href="/dashboard/staff">
            <NavItem icon="group" label="Staff" active={activePath === '/dashboard/staff'} />
          </Link>
          <Link href="/dashboard/analytics">
            <NavItem icon="bar_chart" label="Analytics" active={activePath === '/dashboard/analytics'} />
          </Link>
          <Link href="/dashboard/settings">
            <NavItem icon="settings" label="Settings" active={activePath === '/dashboard/settings'} />
          </Link>
        </nav>
      </div>

      {/* Bottom Button */}
      <div className="px-2">
        <button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-colors shadow-sm">
          <span className="material-symbols-outlined font-medium">add_circle</span>
          <span className="font-semibold text-sm">New Lead</span>
        </button>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
        active
          ? 'bg-primary text-white shadow-sm'
          : 'text-on-surface-variant hover:bg-surface-hover hover:text-content'
      }`}
    >
      <span
        className="material-symbols-outlined text-[20px]"
        style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
      >
        {icon}
      </span>
      <span className={`text-sm ${active ? 'font-medium' : 'font-medium'}`}>{label}</span>
    </div>
  );
}
