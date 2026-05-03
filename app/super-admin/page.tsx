"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface OrgSummary {
  summary: {
    total: number;
    active: number;
    failing: number;
    totalLeads: number;
  };
  organizations: Array<{
    id: string;
    name: string;
    disabled: boolean;
    onboardingComplete: boolean;
    createdAt: string;
    _count: { leads: number; staff: number };
    whatsappCredential: { failureCount: number; lastSuccessAt: string | null } | null;
  }>;
}

function WaStatus({ cred, disabled }: { cred: any; disabled: boolean }) {
  if (disabled) return <span className="text-[10px] font-black text-white/30 uppercase">DISABLED</span>;
  if (!cred) return <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-[10px] font-black text-red-400">NO CREDS</span></span>;
  if (cred.failureCount >= 5) return <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span><span className="text-[10px] font-black text-red-400">DISCONNECTED</span></span>;
  if (cred.failureCount > 0) return <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span><span className="text-[10px] font-black text-amber-300">ISSUES</span></span>;
  return <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span className="text-[10px] font-black text-emerald-300">ACTIVE</span></span>;
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<OrgSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/super-admin/organizations")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load platform health");
        return r.json();
      })
      .then(setData)
      .catch((err) => {
        console.error("Super admin fetch error", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] flex-col gap-4">
        <p className="text-red-400 font-bold">{error || "No data available"}</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-white/50 hover:text-white text-xs underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, organizations } = data;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Platform Health</h1>
        <p className="text-sm text-white/40 mt-1">Global overview of all hospital organizations</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orgs", value: summary.total, color: "text-white" },
          { label: "Active", value: summary.active, color: "text-emerald-400" },
          { label: "Failing WA", value: summary.failing, color: "text-red-400" },
          { label: "Total Leads", value: summary.totalLeads, color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Top Issues */}
      {organizations.filter(o => (o.whatsappCredential?.failureCount ?? 0) >= 1 && !o.disabled).length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">⚠️ Organizations With Issues</p>
          <div className="space-y-2">
            {organizations
              .filter(o => (o.whatsappCredential?.failureCount ?? 0) >= 1 && !o.disabled)
              .map(o => (
                <div key={o.id} className="flex items-center justify-between">
                  <Link href={`/super-admin/organizations/${o.id}`} className="text-white font-bold text-sm hover:text-primary transition-colors">
                    {o.name}
                  </Link>
                  <WaStatus cred={o.whatsappCredential} disabled={o.disabled} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* All Orgs Table */}
      <div className="bg-[#1A1D27] border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <p className="font-black text-white">All Organizations</p>
          <Link href="/super-admin/organizations" className="text-primary text-xs font-bold hover:underline">
            View all + Add →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Organization", "Leads", "Staff", "WhatsApp", "Status"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {organizations.map(org => (
                <tr key={org.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/super-admin/organizations/${org.id}`} className="font-bold text-white hover:text-primary transition-colors text-sm">
                      {org.name}
                    </Link>
                    {!org.onboardingComplete && <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded uppercase">Setup</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60 font-bold">{org._count.leads}</td>
                  <td className="px-6 py-4 text-sm text-white/60 font-bold">{org._count.staff}</td>
                  <td className="px-6 py-4"><WaStatus cred={org.whatsappCredential} disabled={org.disabled} /></td>
                  <td className="px-6 py-4">
                    {org.disabled
                      ? <span className="text-[10px] font-black bg-red-500/10 text-red-400 px-2 py-1 rounded uppercase">Disabled</span>
                      : <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded uppercase">Active</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
