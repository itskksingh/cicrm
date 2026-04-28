import React from 'react';
import Filters from './Filters';
import LeadsTable from './LeadsTable';
import AnalyticsCards from './AnalyticsCards';

export default function LeadsPage() {
  return (
    <div className="flex flex-col gap-6 p-8 pb-32 max-w-[1600px] mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-content tracking-tight">
            Leads Management
          </h1>
          <p className="text-sm font-medium text-outline mt-2">
            Monitor and manage patient inquiries with precision.
          </p>
        </div>
        
        <Filters />
      </div>

      {/* Main Leads Table */}
      <LeadsTable />

      {/* Analytics Cards */}
      <AnalyticsCards />

    </div>
  );
}
