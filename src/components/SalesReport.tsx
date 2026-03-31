import React from 'react';

interface SalesReportProps {
  company: string;
  onClose: () => void;
}

const SalesReport: React.FC<SalesReportProps> = ({ onClose }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">Sales Report</h2>
      <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-xl">Kembali</button>
    </div>
  );
};

export default SalesReport;
