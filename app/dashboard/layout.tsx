import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Check onboarding status for admins
  if (session.user.role === "admin" && session.user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { onboardingComplete: true, disabled: true }
    });

    if (org?.disabled) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-red-500 block mb-4">block</span>
            <h1 className="text-xl font-bold text-gray-900">Account Disabled</h1>
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">Your organization account has been suspended. Please contact platform support.</p>
          </div>
        </div>
      );
    }

    if (org && !org.onboardingComplete) {
      redirect("/onboarding");
    }
  }

  return <>{children}</>;
}
