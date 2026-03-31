import React from 'react';
import { Employee, UserRole } from '../types';

interface CalendarModuleProps {
  employees: Employee[];
  userRole: UserRole;
  company: string;
  onClose: () => void;
}

const CalendarModule: React.FC<CalendarModuleProps> = ({ onClose }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">Kalender</h2>
      <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-xl">Kembali</button>
    </div>
  );
};

export default CalendarModule;
