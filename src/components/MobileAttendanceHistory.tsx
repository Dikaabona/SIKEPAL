import React from 'react';
import { Employee, AttendanceRecord, Shift } from '../types';

interface MobileAttendanceHistoryProps {
  employee: Employee;
  records: AttendanceRecord[];
  shiftAssignments: any[];
  shifts: Shift[];
  onClose: () => void;
}

const MobileAttendanceHistory: React.FC<MobileAttendanceHistoryProps> = ({ onClose }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">Riwayat Absensi</h2>
      <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-xl">Kembali</button>
    </div>
  );
};

export default MobileAttendanceHistory;
