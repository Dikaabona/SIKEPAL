import React from 'react';

interface OrderReportProps {
  company: string;
}

const OrderReport: React.FC<OrderReportProps> = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">Order Report</h2>
      <div className="p-12 border-2 border-dashed border-stone-200 rounded-3xl text-center text-stone-400">
        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">receipt_long</span>
        <p className="text-lg font-medium">Order Report Module is under development</p>
      </div>
    </div>
  );
};

export default OrderReport;
