import React from 'react';
import { Employee, Submission, Broadcast, AttendanceRecord, ShiftAssignment, UserRole, Shift } from '../types';

interface DashboardProps {
  employees: Employee[];
  submissions: Submission[];
  broadcasts: Broadcast[];
  userRole: UserRole;
  currentUserEmployee: Employee | null;
  attendanceRecords: AttendanceRecord[];
  shiftAssignments: ShiftAssignment[];
  onNavigate: (tab: any) => void;
  userCompany: string;
  onOpenBroadcast: () => void;
  onOpenDrive: () => void;
  onViewProfile: (emp: Employee) => void;
  shifts: Shift[];
  onRefreshData: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ employees, attendanceRecords, userCompany }) => {
  const presentToday = attendanceRecords.filter(r => r.status === 'Hadir').length;
  const totalEmployees = employees.length;
  const lateToday = attendanceRecords.filter(r => r.notes?.toLowerCase().includes('late') || (r.clockIn && r.clockIn > '08:00')).length;
  const absentToday = totalEmployees - presentToday;

  return (
    <div className="space-y-8">
      {/* Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Main Summary Card */}
        <div className="md:col-span-2 bg-surface-container-low rounded-xl p-6 relative overflow-hidden group border border-outline-variant/10 shadow-sm">
          <div className="relative z-10">
            <p className="text-on-surface-variant font-label font-medium mb-1">Staff Present Today</p>
            <h3 className="text-4xl font-headline font-extrabold text-primary mb-4">{presentToday} / {totalEmployees}</h3>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {employees.slice(0, 3).map((emp, i) => (
                  <div key={emp.id} className="w-10 h-10 rounded-full border-2 border-surface-container-low bg-stone-200 overflow-hidden">
                     <img
                      className="w-full h-full object-cover"
                      src={`https://picsum.photos/seed/${emp.nama}/100/100`}
                      alt={emp.nama}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
                {totalEmployees > 3 && (
                  <div className="w-10 h-10 rounded-full border-2 border-surface-container-low bg-tertiary-container flex items-center justify-center text-xs font-bold text-on-tertiary-container">
                    +{totalEmployees - 3}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-stone-600">
                {totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0}% attendance rate
              </span>
            </div>
          </div>
          {/* Decorative Element */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors"></div>
          <span className="material-symbols-outlined absolute top-6 right-6 text-primary/20 text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>

        {/* Secondary Metric Cards */}
        <div className="bg-surface-container rounded-xl p-6 flex flex-col justify-between border border-outline-variant/10 shadow-sm">
          <div>
            <span className="material-symbols-outlined text-tertiary mb-2">schedule</span>
            <p className="text-sm font-label font-medium text-on-surface-variant">Late Arrivals</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-headline font-bold text-tertiary">{lateToday.toString().padStart(2, '0')}</h4>
            <span className="text-xs text-error font-medium">+1 from yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 flex flex-col justify-between border border-outline-variant/10 shadow-sm">
          <div>
            <span className="material-symbols-outlined text-stone-400 mb-2">person_off</span>
            <p className="text-sm font-label font-medium text-on-surface-variant">Absence Today</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-headline font-bold text-stone-800">{absentToday.toString().padStart(2, '0')}</h4>
            <span className="text-xs text-stone-400 font-medium">Scheduled leave</span>
          </div>
        </div>
      </div>

      {/* Quick Actions or Recent Activity could go here */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-outline-variant/10 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications</span>
            Recent Announcements
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-stone-50 rounded-lg border-l-4 border-primary">
              <p className="text-sm font-bold">New Shift Schedule Released</p>
              <p className="text-xs text-stone-500 mt-1">Please check your schedule for next week in the Shift module.</p>
            </div>
            <div className="p-4 bg-stone-50 rounded-lg border-l-4 border-tertiary">
              <p className="text-sm font-bold">Monthly KPI Review</p>
              <p className="text-xs text-stone-500 mt-1">KPI reviews will be held on Friday, Oct 27th.</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-outline-variant/10 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">pending_actions</span>
            Pending Approvals
          </h3>
          <div className="flex flex-col items-center justify-center py-8 text-stone-400">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">task_alt</span>
            <p className="text-sm font-medium">All caught up! No pending requests.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
