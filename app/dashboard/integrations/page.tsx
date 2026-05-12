import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import IntegrationsManager from "./IntegrationsManager";

export default async function IntegrationsPage() {
  // 1. Role Protection Logic
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role?.toLowerCase() !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <div className="hidden lg:block w-64 shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-screen relative">
        <Header />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                WhatsApp Integration
              </h1>
              <p className="text-slate-500 mt-1">
                Manage your organization's WhatsApp Business API credentials.
              </p>
            </div>

            {/* Client Component handles fetching and mutations */}
            <IntegrationsManager />
          </div>
        </main>
      </div>
    </div>
  );
}
