import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { prisma } from '@/lib/prisma';
import { getDefaultOrganizationId } from '@/lib/db/organization';
import { getSessionWithRole, ROLES } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  // Defense-in-depth: server-side role check (middleware is primary guard)
  const session = await getSessionWithRole([ROLES.ADMIN]);
  if (!session) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>403 – Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const orgId = session.user.organizationId as string;
  const settings = await prisma.settings.findMany({
    where: { organizationId: orgId },
    orderBy: { key: 'asc' }
  });

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <div className="hidden lg:block w-64 shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-screen relative">
        <Header />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settings.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                        No custom settings found. Using defaults.
                      </td>
                    </tr>
                  ) : (
                    settings.map((set) => (
                      <tr key={set.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{set.key}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{set.value}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
