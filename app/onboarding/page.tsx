"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    hospitalName: "",
    whatsappPhoneNumberId: "",
    whatsappAccessToken: "",
    doctorName: "",
    doctorDepartment: "General",
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E2E8F0] overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-[#F1F5F9] flex">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-primary">Welcome to CrestCare</h1>
            <p className="text-sm text-outline mt-1">Let&apos;s set up your hospital in 3 simple steps</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold border border-red-100 mb-6">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2">Hospital Name</label>
                <input
                  type="text"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  placeholder="e.g. City Life Hospital"
                  className="w-full px-4 py-3.5 rounded-2xl border border-[#E2E8F0] focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                />
              </div>
              <button 
                onClick={nextStep} 
                disabled={!formData.hospitalName}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
              >
                CONTINUE
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2">WhatsApp Phone Number ID</label>
                  <input
                    type="text"
                    value={formData.whatsappPhoneNumberId}
                    onChange={(e) => setFormData({ ...formData, whatsappPhoneNumberId: e.target.value })}
                    placeholder="1234567890..."
                    className="w-full px-4 py-3.5 rounded-2xl border border-[#E2E8F0] focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2">System Access Token</label>
                  <input
                    type="password"
                    value={formData.whatsappAccessToken}
                    onChange={(e) => setFormData({ ...formData, whatsappAccessToken: e.target.value })}
                    placeholder="EAAG..."
                    className="w-full px-4 py-3.5 rounded-2xl border border-[#E2E8F0] focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={prevStep} className="flex-1 bg-[#F1F5F9] text-outline font-black py-4 rounded-2xl">BACK</button>
                <button 
                  onClick={nextStep} 
                  disabled={!formData.whatsappPhoneNumberId || !formData.whatsappAccessToken}
                  className="flex-2 bg-primary text-white font-black py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  CONTINUE
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2">Primary Doctor Name</label>
                  <input
                    type="text"
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                    placeholder="e.g. Dr. Sarah Connor"
                    className="w-full px-4 py-3.5 rounded-2xl border border-[#E2E8F0] focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2">Department</label>
                  <select
                    value={formData.doctorDepartment}
                    onChange={(e) => setFormData({ ...formData, doctorDepartment: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-2xl border border-[#E2E8F0] focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={prevStep} className="flex-1 bg-[#F1F5F9] text-outline font-black py-4 rounded-2xl">BACK</button>
                <button 
                  onClick={handleSubmit} 
                  disabled={!formData.doctorName || loading}
                  className="flex-2 bg-primary text-white font-black py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "FINISHING..." : "FINISH SETUP"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <button 
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="mt-8 text-outline text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
        Sign Out
      </button>
    </div>
  );
}
