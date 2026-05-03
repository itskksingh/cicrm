"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: string;
  createdAt: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "staff",
  });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (Array.isArray(data)) {
        setStaff(data);
      }
    } catch (err) {
      console.error("Failed to fetch staff", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError("");

    try {
      const res = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setShowInviteModal(false);
        setFormData({ name: "", email: "", phone: "", role: "staff" });
        fetchStaff();
      } else {
        setError(data.error || "Failed to invite staff");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    try {
      const res = await fetch("/api/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchStaff();
      } else {
        alert("Failed to remove staff member");
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <div className="hidden lg:block w-64 shrink-0">
        <Sidebar activePath="/dashboard/staff" />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-screen relative">
        <Header />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-primary">Staff Management</h1>
                <p className="text-sm text-outline mt-1">Manage your hospital team and roles</p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                Invite Staff
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-hover border-b border-[#E2E8F0]">
                        <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Dept</th>
                        <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {staff.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-outline">
                            No staff members found.
                          </td>
                        </tr>
                      ) : (
                        staff.map((member) => (
                          <tr key={member.id} className="hover:bg-surface-hover transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold text-sm">
                                  {member.name[0]}
                                </div>
                                <span className="font-bold text-content">{member.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{member.email || "No Email"}</span>
                                <span className="text-[10px] text-outline font-bold">{member.phone || "No Phone"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-outline">{member.department}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleDelete(member.id)}
                                className="text-red-600 hover:text-red-800 transition-colors p-2"
                                title="Remove Staff"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center">
              <h3 className="font-bold text-lg text-primary">Invite New Staff</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-outline hover:text-content">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="john@hospital.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="+919876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                >
                  <option value="staff">Staff / Caller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-outline hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {inviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
