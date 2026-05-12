import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "super_admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0F1117]">
      {/* Top Navigation */}
      <nav className="bg-[#1A1D27] border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-tight leading-none">CrestCare Platform</p>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Super Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/super-admin" className="text-white/50 hover:text-white text-xs font-bold transition-colors">Dashboard</a>
          <a href="/super-admin/organizations" className="text-white/50 hover:text-white text-xs font-bold transition-colors">Organizations</a>
          <a href="/api/auth/signout" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Sign Out</a>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
