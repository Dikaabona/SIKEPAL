import React from 'react';
import { Employee, AttendanceRecord, UserRole } from '../types';

interface FinancialModuleProps {
  company: string;
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onClose: () => void;
  onRefresh: () => void;
  weeklyHolidays: any;
  positionRates: any;
}

const FinancialModule: React.FC<FinancialModuleProps> = ({ onClose }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">Finance</h2>
      <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-xl">Kembali</button>
    </div>
  );
};

export default FinancialModule;
