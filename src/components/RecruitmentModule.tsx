import React from 'react';
import { UserRole } from '../types';

interface RecruitmentModuleProps {
  company: string;
  userRole: UserRole;
  onClose: () => void;
}

const RecruitmentModule: React.FC<RecruitmentModuleProps> = ({ onClose }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">Rekrutmen</h2>
      <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-xl">Kembali</button>
    </div>
  );
};

export default RecruitmentModule;
