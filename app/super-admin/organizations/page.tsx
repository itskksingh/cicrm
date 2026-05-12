"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Org {
  id: string;
  name: string;
  disabled: boolean;
  onboardingComplete: boolean;
  createdAt: string;
  _count: { leads: number; staff: number };
  whatsappCredential: { failureCount: number; lastSuccessAt: string | null } | null;
}

function WaStatus({ cred, disabled }: { cred: any; disabled: boolean }) {
  if (disabled) return <span className="text-[10px] font-black text-white/30 uppercase">DISABLED</span>;
  if (!cred) return <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-[10px] font-black text-red-400">NO CREDS</span></span>;
  if (cred.failureCount >= 5) return <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span><span className="text-[10px] font-black text-red-400">DISCONNECTED</span></span>;
  if (cred.failureCount > 0) return <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span><span className="text-[10px] font-black text-amber-300">ISSUES</span></span>;
  return <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span className="text-[10px] font-black text-emerald-300">ACTIVE</span></span>;
}

export default function SuperAdminOrganizations() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ orgId: string; password: string } | null>(null);
  const [form, setForm] = useState({ hospitalName: "", adminName: "", adminEmail: "", adminPhone: "" });
  const [error, setError] = useState("");

  const fetchOrgs = () =>
    fetch("/api/super-admin/organizations")
      .then((r) => r.json())
      .then((d) => setOrgs(d.organizations || []))
      .finally(() => setLoading(false));

  useEffect(() => { fetchOrgs(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/super-admin/organizations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedCreds({ orgId: data.organizationId, password: data.tempPassword });
        setShowCreate(false);
        setForm({ hospitalName: "", adminName: "", adminEmail: "", adminPhone: "" });
        fetchOrgs();
      } else {
        setError(data.error || "Failed to create org");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Organizations</h1>
          <p className="text-sm text-white/40 mt-1">{orgs.length} total registered hospitals</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary hover:bg-primary/90 text-white font-black text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Hospital
        </button>
      </div>

      {/* Temp credentials display */}
      {createdCreds && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
          <p className="text-emerald-300 font-black text-sm mb-2">✅ Hospital Created!</p>
          <p className="text-white/60 text-xs font-mono">Temp Password: <span className="text-white font-black">{createdCreds.password}</span></p>
          <p className="text-white/40 text-[10px] mt-1">Share these credentials with the hospital admin securely.</p>
          <button onClick={() => setCreatedCreds(null)} className="text-white/30 text-[10px] mt-2 hover:text-white/60">Dismiss</button>
        </div>
      )}

      {/* Org List */}
      <div className="bg-[#1A1D27] border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {orgs.map((org) => (
              <div key={org.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-white text-sm">{org.name}</p>
                    {!org.onboardingComplete && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded uppercase tracking-wider">Setup Pending</span>
                    )}
                    {org.disabled && (
                      <span className="text-[9px] bg-red-500/20 text-red-400 font-black px-2 py-0.5 rounded uppercase tracking-wider">Disabled</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-[11px] text-white/40 font-bold">{org._count.leads} leads</span>
                    <span className="text-[11px] text-white/40 font-bold">{org._count.staff} staff</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <WaStatus cred={org.whatsappCredential} disabled={org.disabled} />
                  <Link
                    href={`/super-admin/organizations/${org.id}`}
                    className="text-white/30 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Org Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-100 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1A1D27] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <p className="font-black text-white">Add New Hospital</p>
              <button onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="bg-red-500/10 text-red-400 text-xs font-bold p-3 rounded-xl border border-red-500/20">{error}</div>}
              {[
                { field: "hospitalName", label: "Hospital Name", placeholder: "City Life Hospital" },
                { field: "adminName", label: "Admin Full Name", placeholder: "Dr. Admin" },
                { field: "adminEmail", label: "Admin Email", placeholder: "admin@hospital.com" },
                { field: "adminPhone", label: "Admin Phone (optional)", placeholder: "+91..." },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">{label}</label>
                  <input
                    type="text"
                    required={field !== "adminPhone"}
                    value={(form as any)[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-medium placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-white/5 text-white/50 font-black py-3 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={creating} className="flex-2 bg-primary text-white font-black py-3 rounded-xl text-sm shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {creating ? "Creating..." : "Create Hospital"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
