import React from 'react';
import { UserRole } from '../types';

interface InventoryModuleProps {
  company: string;
  userRole: UserRole;
  onClose: () => void;
}

const InventoryModule: React.FC<InventoryModuleProps> = ({ onClose }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">Aset & Inventaris</h2>
      <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-xl">Kembali</button>
    </div>
  );
};

export default InventoryModule;
