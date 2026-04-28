"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { syncStaffRecord, getStaffProfile } from "@/app/actions/auth";

export default function AuthPage() {
  const router = useRouter();
  
  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (!email || !password || (!isLogin && (!name || !phone || !department))) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Handle Login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData?.user) {
          // Fetch the Prisma internal representation of this user
          const res = await getStaffProfile(authData.user.id);
          
          if (!res.success) {
            // Edge case: They have a Supabase account but no Prisma record
            throw new Error(res.error || "Staff record missing. Please contact an admin.");
          }

          // Successfully authenticated & linked to Prisma.
          // In a real app, you could store `res.staff.role` in a Zustand store or Context here.
          console.log("Logged in as:", res.staff);
        }

        // Redirect on success
        router.push("/dashboard");
      } else {
        // Handle Signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData?.user) {
          // Sync to Prisma exactly matching the user ID provided by Supabase
          const res = await syncStaffRecord(authData.user.id, email, name, phone, department);

          if (!res.success) {
            // Important: Handle failure if phone is duplicate or database crashes
            throw new Error(res.error || "Failed to create internal staff profile.");
          }

          console.log("Registered new staff member:", res.staff);
        }

        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    // Reset specific states
    setPassword("");
  };

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements (Precision Fluidity) */}
      <div className="bg-blob top-[-10%] left-[-10%]"></div>
      <div className="bg-blob bottom-[-10%] right-[-10%] opacity-60"></div>
      
      <main className="w-full max-w-[440px] z-10 my-8">
        {/* Brand Identity Container */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-fixed rounded-2xl mb-6 shadow-sm">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-primary mb-2">Clinical Concierge</h1>
          <p className="text-on-surface-variant text-sm font-medium tracking-wide">CREST CARE HOSPITAL CRM</p>
        </div>
        
        {/* Auth Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-10 ambient-shadow">
          <header className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-on-surface">
              {isLogin ? "Welcome back" : "Staff Registration"}
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              {isLogin ? "Please enter your clinical credentials" : "Set up your medical staff profile"}
            </p>
          </header>
          
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">error</span>
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Extended Signup Fields */}
            {!isLogin && (
              <div className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-1">FULL NAME</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl">badge</span>
                    <input 
                      className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium text-on-surface placeholder:text-outline/50 disabled:opacity-50" 
                      placeholder="Dr. Sarah Johnson" 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                      required={!isLogin}
                    />
                  </div>
                </div>

                {/* Phone & Department Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-1">PHONE NUMBER</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-lg">call</span>
                      <input 
                        className="w-full pl-10 pr-3 py-3.5 bg-transparent border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium text-on-surface placeholder:text-outline/50 disabled:opacity-50" 
                        placeholder="+1 234 567" 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading}
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-1">DEPARTMENT</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-lg">domain</span>
                      <input 
                        className="w-full pl-10 pr-3 py-3.5 bg-transparent border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium text-on-surface placeholder:text-outline/50 disabled:opacity-50" 
                        placeholder="Surgery" 
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        disabled={isLoading}
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Input Group */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-1">EMAIL</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl">alternate_email</span>
                <input 
                  className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium text-on-surface placeholder:text-outline/50 disabled:opacity-50" 
                  placeholder="staff.name@crestcare.org" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            {/* Password Input Group */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-1">PASSWORD</label>
                {isLogin && (
                  <a className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary-container transition-colors mb-1" href="#">Forgot?</a>
                )}
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl">lock</span>
                <input 
                  className="w-full pl-12 pr-12 py-3.5 bg-transparent border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium text-on-surface placeholder:text-outline/50 disabled:opacity-50" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            
            {/* Remember Me Toggle (Only on Login) */}
            {isLogin && (
              <div className="flex items-center space-x-3 py-1">
                <label className="relative inline-flex items-center cursor-pointer" htmlFor="remember">
                  <input 
                    className="sr-only peer" 
                    id="remember" 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                  <div className="w-10 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  <span className="ml-3 text-xs font-medium text-on-surface-variant">Remember this workstation</span>
                </label>
              </div>
            )}
            
            {/* Submit Button */}
            <button 
              className="w-full login-gradient text-on-primary py-4 px-6 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed" 
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? "Authenticating..." : (isLogin ? "Login" : "Create Account")}</span>
              {!isLoading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
              {isLoading && <span className="material-symbols-outlined text-lg animate-spin">refresh</span>}
            </button>
          </form>

          {/* Toggle Mode Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-xs font-medium text-on-surface-variant hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
        
        {/* Footer Help */}
        <footer className="mt-8 text-center space-y-4">
          <p className="text-xs text-on-surface-variant font-medium">
            Protected by Clinical Concierge Security.
          </p>
          <div className="flex items-center justify-center space-x-6">
            <a className="text-[10px] font-bold uppercase tracking-widest text-outline hover:text-primary transition-colors" href="#">Support Portal</a>
            <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
            <a className="text-[10px] font-bold uppercase tracking-widest text-outline hover:text-primary transition-colors" href="#">System Status</a>
          </div>
        </footer>
      </main>
      
      {/* Side Image Decorative (Responsive) */}
      <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 w-[300px] h-[600px] flex-col justify-center gap-6 z-10">
        <div className="bg-surface-container-low rounded-3xl p-6 ambient-shadow">
          <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
            <Image alt="Clean minimalist hospital corridor" className="object-cover" fill unoptimized src="https://lh3.googleusercontent.com/aida-public/AB6AXuCE8gG_KQoCtVYOr5wA0RBHdqzTAQRZfbvx6R8sergflwNSsyxovmn8fYkkTUgm_WMMsY5IGMDhd8lqaAH1yEWKH9NSmVVF8nv56FVx7l0SmWBYtrhXWvVjyYmjXfM8HfKFKhkgOnhREZ__P3zLGsP1jJeyflQhDPNzDoBf0n7d-51vLJWGP77EahUS_a-ufb5zA_yCmwiBJV_rm5AomfoEZb2TTObjT9YmrZSPWM7HAZ_PQJFejuz_D1IbB51mo4T6OtbH_wBFJnKA" />
          </div>
          <p className="text-sm font-bold text-primary mb-1">Precision Fluidity</p>
          <p className="text-[10px] leading-relaxed text-on-surface-variant font-medium">Empowering staff with high-end editorial experiences for patient care management.</p>
        </div>
        <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">security</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">HIPAA Compliant</p>
              <p className="text-[10px] text-on-surface-variant">256-bit AES Encryption active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
