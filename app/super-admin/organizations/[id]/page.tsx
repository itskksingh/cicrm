"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface OrgDetail {
  id: string;
  name: string;
  disabled: boolean;
  onboardingComplete: boolean;
  createdAt: string;
  _count: { leads: number; staff: number; users: number; doctors: number };
  whatsappCredential: {
    failureCount: number;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
    phoneNumberId: string;
  } | null;
}

function StatBox({ label, value, color = "text-white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const router = useRouter();

  const fetchOrg = () =>
    fetch(`/api/super-admin/organizations/${id}`)
      .then((r) => r.json())
      .then(setOrg)
      .finally(() => setLoading(false));

  useEffect(() => { fetchOrg(); }, [id]);

  const toggleDisable = async () => {
    if (!org) return;
    if (!confirm(`Are you sure you want to ${org.disabled ? "enable" : "disable"} ${org.name}?`)) return;
    setToggling(true);
    await fetch(`/api/super-admin/organizations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: !org.disabled }),
    });
    await fetchOrg();
    setToggling(false);
  };

  const impersonate = async () => {
    setImpersonating(true);
    try {
      const res = await fetch("/api/super-admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: id }),
      });
      if (res.ok) {
        // Open org dashboard in a new tab (super admin remains logged in)
        alert("Impersonation token generated. In production, this would open a sandboxed admin session.");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to impersonate");
      }
    } finally {
      setImpersonating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }
  if (!org) return <div className="text-center text-white/40 mt-20">Organization not found</div>;

  const waCred = org.whatsappCredential;
  const waStatus = !waCred ? "no_creds" : waCred.failureCount >= 5 ? "disconnected" : waCred.failureCount > 0 ? "issues" : "active";

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/30 font-bold">
        <a href="/super-admin/organizations" className="hover:text-white transition-colors">Organizations</a>
        <span>/</span>
        <span className="text-white/60">{org.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">{org.name}</h1>
          <p className="text-xs text-white/30 font-mono mt-1">{org.id}</p>
          <div className="flex items-center gap-2 mt-2">
            {org.disabled && <span className="text-[10px] bg-red-500/20 text-red-400 font-black px-2 py-1 rounded uppercase">DISABLED</span>}
            {!org.onboardingComplete && <span className="text-[10px] bg-amber-500/20 text-amber-300 font-black px-2 py-1 rounded uppercase">SETUP PENDING</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={impersonate}
            disabled={impersonating || org.disabled}
            className="bg-white/10 hover:bg-white/20 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
            {impersonating ? "Loading..." : "Login as Admin"}
          </button>
          <button
            onClick={toggleDisable}
            disabled={toggling}
            className={`font-black text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-40 ${
              org.disabled
                ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{org.disabled ? "lock_open" : "block"}</span>
            {toggling ? "..." : org.disabled ? "Enable Org" : "Disable Org"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Total Leads" value={org._count.leads} color="text-blue-300" />
        <StatBox label="Staff" value={org._count.staff} />
        <StatBox label="Users" value={org._count.users} />
        <StatBox label="Doctors" value={org._count.doctors} color="text-emerald-300" />
      </div>

      {/* WhatsApp Status */}
      <div className={`rounded-2xl p-6 border ${
        waStatus === "active" ? "bg-emerald-500/10 border-emerald-500/20" :
        waStatus === "issues" ? "bg-amber-500/10 border-amber-500/20" :
        "bg-red-500/10 border-red-500/20"
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <span className={`material-symbols-outlined text-[24px] ${
            waStatus === "active" ? "text-emerald-400" :
            waStatus === "issues" ? "text-amber-300" : "text-red-400"
          }`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {waStatus === "active" ? "check_circle" : "warning"}
          </span>
          <div>
            <p className="font-black text-white text-sm">WhatsApp Integration</p>
            <p className={`text-[10px] font-black uppercase tracking-widest ${
              waStatus === "active" ? "text-emerald-400" :
              waStatus === "issues" ? "text-amber-300" :
              waStatus === "disconnected" ? "text-red-400" : "text-white/30"
            }`}>
              {waStatus === "active" ? "Connected & Healthy" :
               waStatus === "issues" ? "Intermittent Issues" :
               waStatus === "disconnected" ? "Disconnected" : "No Credentials"}
            </p>
          </div>
        </div>

        {waCred && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Phone Number ID</p>
              <p className="text-sm font-mono text-white/70 mt-1 truncate">{waCred.phoneNumberId}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Failure Count</p>
              <p className={`text-2xl font-black mt-1 ${waCred.failureCount > 0 ? "text-red-400" : "text-emerald-400"}`}>{waCred.failureCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Last Success</p>
              <p className="text-sm font-bold text-white/60 mt-1">
                {waCred.lastSuccessAt ? new Date(waCred.lastSuccessAt).toLocaleString() : "Never"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
