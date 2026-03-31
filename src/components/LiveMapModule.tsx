import React from 'react';
import { Employee, UserRole } from '../types';

interface LiveMapModuleProps {
  employees: Employee[];
  userRole: UserRole;
  company: string;
  onClose: () => void;
}

const LiveMapModule: React.FC<LiveMapModuleProps> = ({ onClose }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">Live Tracking</h2>
      <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-xl">Kembali</button>
    </div>
  );
};

export default LiveMapModule;
