import React from 'react';

interface PrintAdminProps {
  company: string;
}

const PrintAdmin: React.FC<PrintAdminProps> = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">Print Admin</h2>
      <div className="p-12 border-2 border-dashed border-stone-200 rounded-3xl text-center text-stone-400">
        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">print</span>
        <p className="text-lg font-medium">Print Admin Module is under development</p>
      </div>
    </div>
  );
};

export default PrintAdmin;
