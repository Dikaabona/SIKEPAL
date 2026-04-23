import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Employee, Submission, Broadcast, AttendanceRecord, ShiftAssignment, UserRole, Shift, BranchLocation, Order, Store } from '../types';
import { parseIndoDate } from '../lib/utils';

interface DashboardProps {
  employees: Employee[];
  orders: Order[];
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
  branchLocations: BranchLocation[];
  stores: Store[];
}

const Dashboard: React.FC<DashboardProps> = ({ 
  employees, 
  orders,
  attendanceRecords, 
  onNavigate,
  broadcasts,
  currentUserEmployee,
  branchLocations,
  userRole,
  stores
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);

  const assignedLocation = branchLocations.find(loc => loc.id === currentUserEmployee?.branchLocationId);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator && assignedLocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const dist = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            assignedLocation.latitude,
            assignedLocation.longitude
          );
          setCurrentDistance(Math.round(dist));
        },
        (error) => console.error("Error watching position:", error),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [assignedLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const presentToday = attendanceRecords.filter(r => r.status === 'Hadir').length;
  const totalEmployees = employees.length;
  const lateToday = attendanceRecords.filter(r => r.notes?.toLowerCase().includes('late') || (r.clockIn && r.clockIn > '08:00')).length;
  const absentToday = totalEmployees - presentToday;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const calculateLeaveBalance = (joinDate: string | undefined) => {
    if (!joinDate) return 0;
    const join = new Date(joinDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - join.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    
    if (diffYears < 1) return 0;
    // Assuming 12 days per year as default if not specified in employee data
    return 12; 
  };

  const leaveBalance = calculateLeaveBalance(currentUserEmployee?.tanggalMasuk);
  const today = new Date().toISOString().split('T')[0];
  const locationRadius = assignedLocation?.radius || 10;
  const locationName = assignedLocation?.namaCabang || 'AREA KANTOR';

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 md:space-y-8"
    >
      {/* Mobile View */}
      <div className="md:hidden -mx-4 -mt-6">
        {/* Yellow Header Section */}
        <div className="bg-[#FFC107] pt-4 pb-8 px-4 rounded-b-[48px]">
          {/* Employee Name & Role (Below Logo Header) */}
          <motion.div 
            variants={item}
            className="mb-4"
          >
            <h1 className="text-xl font-black text-[#1A1A1A] uppercase tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {currentUserEmployee?.nama || 'MUHAMMAD MAHARDHIKA'}
            </h1>
            <p className="text-[11px] font-bold text-stone-700 uppercase tracking-[0.2em] mt-1">
              {currentUserEmployee?.jabatan || 'STAFF'} • {currentUserEmployee?.division || 'ADMIN'}
            </p>
          </motion.div>

          <motion.div 
            variants={item}
            className="bg-white rounded-[40px] p-8 shadow-xl relative flex flex-col items-center text-center"
          >
            {/* Real-time Clock (Moved from bottom) */}
            <div className="text-center mb-6">
              <h2 className="text-4xl font-black text-stone-900 tabular-nums">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </h2>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-1">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Announcements Section (Mobile - Moved up) */}
            <motion.div 
              variants={item}
              className="mt-6 w-full text-left"
            >
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-xs font-black text-stone-800 flex items-center gap-2 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-orange-600 text-sm">notifications</span>
                  Pengumuman
                </h3>
                <button className="text-[10px] font-bold text-orange-600 hover:underline uppercase tracking-wider">View All</button>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-orange-50/50 rounded-2xl border border-orange-100">
                  <p className="text-xs font-black text-orange-900 leading-tight">New Shift Schedule Released</p>
                  <p className="text-[10px] text-orange-700/70 mt-0.5 line-clamp-1">Please check your schedule for next week in the Shift module.</p>
                </div>
                {broadcasts && broadcasts.length > 0 && broadcasts.slice(0, 1).map((b, i) => (
                  <div key={i} className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
                    <p className="text-xs font-black text-stone-800 leading-tight">{b.title}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{b.message}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="px-4 space-y-6 mt-6">
          {/* Location Badge (Moved to where Clock was) */}
          <motion.div 
            variants={item}
            className="bg-white px-6 py-5 rounded-[32px] border border-stone-100 shadow-sm flex flex-col items-center gap-3 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FFFDE7] border border-[#FFF9C4] flex items-center justify-center text-[#FFB300] shadow-sm">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1 text-center w-full">Current Location</p>
              <span className="text-sm font-black text-[#827717] uppercase tracking-wider block">
                DI {locationName} ({currentDistance !== null ? `${currentDistance}M` : `${locationRadius}M`})
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block space-y-8">
        {/* Summary Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {/* Main Summary Card */}
          <motion.div 
            variants={item}
            className="col-span-2 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-3xl p-6 relative overflow-hidden group border border-orange-200/50 shadow-sm"
          >
            <div className="relative z-10">
              <p className="text-orange-900/60 font-label font-bold text-xs uppercase tracking-wider mb-1">Staff Present Today</p>
              <h3 className="text-4xl md:text-5xl font-headline font-black text-orange-800 mb-4">
                {presentToday} <span className="text-orange-300 text-2xl md:text-3xl">/ {totalEmployees}</span>
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {employees.slice(0, 3).map((emp) => (
                    <div key={emp.id} className="w-10 h-10 rounded-full border-2 border-white bg-stone-200 overflow-hidden shadow-sm">
                       <img
                        className="w-full h-full object-cover"
                        src={`https://picsum.photos/seed/${emp.nama}/100/100`}
                        alt={emp.nama}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                  {totalEmployees > 3 && (
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-orange-200 flex items-center justify-center text-xs font-black text-orange-800 shadow-sm">
                      +{totalEmployees - 3}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-orange-900">
                    {totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0}%
                  </span>
                  <span className="text-[10px] font-bold text-orange-700/60 uppercase">Attendance Rate</span>
                </div>
              </div>
            </div>
            {/* Decorative Element */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl group-hover:bg-orange-400/20 transition-colors"></div>
            <span className="material-symbols-outlined absolute top-6 right-6 text-orange-800/10 text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </motion.div>

          {/* Secondary Metric Cards */}
          <motion.div 
            variants={item}
            className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600">schedule</span>
              </div>
              <span className="text-[10px] text-red-500 font-black bg-red-50 px-2 py-1 rounded-full">+1</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Late Arrivals</p>
              <h4 className="text-2xl font-headline font-black text-stone-800">{lateToday.toString().padStart(2, '0')}</h4>
            </div>
          </motion.div>

          <motion.div 
            variants={item}
            className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-stone-400">person_off</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Absence Today</p>
              <h4 className="text-2xl font-headline font-black text-stone-800">{absentToday.toString().padStart(2, '0')}</h4>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions or Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            variants={item}
            className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-stone-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600">notifications</span>
                Announcements
              </h3>
              <button className="text-xs font-bold text-orange-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <p className="text-sm font-black text-orange-900">New Shift Schedule Released</p>
                <p className="text-xs text-orange-700/70 mt-1">Please check your schedule for next week in the Shift module.</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <p className="text-sm font-black text-stone-800">Monthly KPI Review</p>
                <p className="text-xs text-stone-500 mt-1">KPI reviews will be held on Friday, Oct 27th.</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={item}
            className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm"
          >
            <h3 className="font-black text-stone-800 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600">pending_actions</span>
              Approvals
            </h3>
            <div className="flex flex-col items-center justify-center py-6 text-stone-300">
              <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-3xl opacity-30">task_alt</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider">All caught up!</p>
              <p className="text-[10px] mt-1">No pending requests.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
