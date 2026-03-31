import React from 'react';
import { Employee, LiveSchedule, LiveReport, UserRole, Shift } from '../types';

interface LiveScheduleModuleProps {
  employees: Employee[];
  schedules: LiveSchedule[];
  setSchedules: any;
  reports: LiveReport[];
  setReports: any;
  userRole: UserRole;
  company: string;
  onClose: () => void;
  attendanceRecords: any[];
  shiftAssignments: any[];
  shifts: Shift[];
  onRefreshData: () => void;
}

const LiveScheduleModule: React.FC<LiveScheduleModuleProps> = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase tracking-tight">Jadwal Live</h2>
      <p>Stub for LiveScheduleModule</p>
    </div>
  );
};

export default LiveScheduleModule;
