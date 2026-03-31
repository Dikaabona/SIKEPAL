import React from 'react';

interface MinVisModuleProps {
  company: string;
  onClose: () => void;
}

const MinVisModule: React.FC<MinVisModuleProps> = ({ onClose }) => {
  return (
    <div className="min-h-screen p-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">MinVis AI</h2>
      <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl">Tutup</button>
    </div>
  );
};

export default MinVisModule;
