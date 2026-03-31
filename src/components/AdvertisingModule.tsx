import React from 'react';
import { AdvertisingRecord, UserRole } from '../types';

interface AdvertisingModuleProps {
  records: AdvertisingRecord[];
  userRole: UserRole;
  company: string;
  onRefresh: () => void;
  onClose: () => void;
}

export const AdvertisingModule: React.FC<AdvertisingModuleProps> = ({ onClose }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">Advertising</h2>
      <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-xl">Kembali</button>
    </div>
  );
};
