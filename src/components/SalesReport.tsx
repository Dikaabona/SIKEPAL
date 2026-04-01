import React from 'react';

interface SalesReportProps {
  company: string;
}

const SalesReport: React.FC<SalesReportProps> = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">Sales Report</h2>
      <div className="p-12 border-2 border-dashed border-stone-200 rounded-3xl text-center text-stone-400">
        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">trending_up</span>
        <p className="text-lg font-medium">Sales Report Module is under development</p>
      </div>
    </div>
  );
};

export default SalesReport;
