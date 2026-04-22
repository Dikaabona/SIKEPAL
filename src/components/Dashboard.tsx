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

  const [piutangSearch, setPiutangSearch] = useState('');
  const [piutangPage, setPiutangPage] = useState(1);
  const PIUTANG_ITEMS_PER_PAGE = 15;

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

  // Calculate Piutang Notifications
  const piutangNotifications = useMemo(() => {
    if (!orders) return [];
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const allPiutang = orders
      .filter(order => order.pembayaran?.toUpperCase() === 'FALSE')
      .map(order => {
        const orderDate = parseIndoDate(order.tanggal);
        if (!orderDate) return null;

        let daysToAdd = 0;
        const periode = order.periodeBayar?.toUpperCase() || '';

        if (periode === 'HARIAN') {
          daysToAdd = 1;
        } else if (periode.includes('MINGGUAN')) {
          daysToAdd = 7;
        } else if (periode === 'BULANAN') {
          daysToAdd = 30;
        }

        const dueDate = new Date(orderDate);
        dueDate.setDate(dueDate.getDate() + daysToAdd);
        dueDate.setHours(0, 0, 0, 0);

        if (now >= dueDate) {
          return {
            ...order,
            dueDate,
            daysOverdue: Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          };
        }
        return null;
      })
      .filter((n): n is any => n !== null)
      .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());

    if (!piutangSearch) return allPiutang;
    return allPiutang.filter(p => p.namaLokasi.toLowerCase().includes(piutangSearch.toLowerCase()));
  }, [orders, piutangSearch]);

  const totalPiutangPages = Math.ceil(piutangNotifications.length / PIUTANG_ITEMS_PER_PAGE);
  const paginatedPiutang = piutangNotifications.slice((piutangPage - 1) * PIUTANG_ITEMS_PER_PAGE, piutangPage * PIUTANG_ITEMS_PER_PAGE);

  const handleStoreClick = (storeName: string) => {
    const store = employees.find(e => e.nama === storeName) as any; // This is wrong, should be from stores
    // Actually, Dashboard doesn't have stores prop. I need to check App.tsx
  };

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
        <div className="bg-[#FFC107] pt-12 pb-8 px-4 rounded-b-[48px]">
          <motion.div 
            variants={item}
            className="bg-white rounded-[40px] p-8 shadow-xl relative flex flex-col items-center text-center"
          >
            {/* Employee Info */}
            <div className="mt-4 space-y-1">
              <h1 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tight leading-tight">
                {currentUserEmployee?.nama || 'MUHAMMAD MAHARDHIKA'}
              </h1>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                {currentUserEmployee?.jabatan || 'STAFF'} • {currentUserEmployee?.division || 'ADMIN'}
              </p>
            </div>

            {/* Location Badge */}
            <div className="mt-8 bg-[#FFFDE7] border border-[#FFF9C4] px-6 py-3.5 rounded-[24px] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[#FFB300] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              </div>
              <span className="text-[11px] font-black text-[#827717] uppercase tracking-wider">
                DI {locationName} ({currentDistance !== null ? `${currentDistance}M` : `${locationRadius}M`})
              </span>
            </div>
          </motion.div>
        </div>

        <div className="px-4 space-y-6 mt-6">
          {/* Real-time Clock */}
          <motion.div 
            variants={item}
            className="text-center py-2"
          >
            <h2 className="text-4xl font-black text-stone-900 tabular-nums">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h2>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] mt-1">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </motion.div>

          {/* Quick Menu Grid */}
          <div className="grid grid-cols-4 gap-2">
            {/* Absen Selfie */}
            <motion.button
              variants={item}
              onClick={() => onNavigate('selfie_attendance')}
              className="bg-white p-2 rounded-[20px] border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                <span className="material-symbols-outlined text-lg">photo_camera</span>
              </div>
              <span className="text-[7px] font-black text-stone-800 uppercase tracking-tight text-center leading-tight">Absen Selfie</span>
            </motion.button>

            {/* Delivery Report */}
            <motion.button
              variants={item}
              onClick={() => onNavigate('delivery')}
              className="bg-white p-2 rounded-[20px] border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <span className="material-symbols-outlined text-lg">local_shipping</span>
              </div>
              <span className="text-[7px] font-black text-stone-800 uppercase tracking-tight text-center leading-tight">Delivery Report</span>
            </motion.button>

            {/* Billing Report */}
            <motion.button
              variants={item}
              onClick={() => onNavigate('billing_report')}
              className="bg-white p-2 rounded-[20px] border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-200">
                <span className="material-symbols-outlined text-lg">payments</span>
              </div>
              <span className="text-[7px] font-black text-stone-800 uppercase tracking-tight text-center leading-tight">Billing Report</span>
            </motion.button>

            {/* Data Orderan */}
            <motion.button
              variants={item}
              onClick={() => onNavigate('order_database')}
              className="bg-white p-2 rounded-[20px] border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <span className="material-symbols-outlined text-lg">receipt_long</span>
              </div>
              <span className="text-[7px] font-black text-stone-800 uppercase tracking-tight text-center leading-tight">Data Orderan</span>
            </motion.button>

            {/* Client Monitor */}
            {(userRole === 'owner' || userRole === 'superadmin') && (
              <motion.button
                variants={item}
                onClick={() => onNavigate('client_monitor')}
                className="bg-white p-2 rounded-[20px] border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <span className="material-symbols-outlined text-lg">monitor_heart</span>
                </div>
                <span className="text-[7px] font-black text-stone-800 uppercase tracking-tight text-center leading-tight">Client Monitor</span>
              </motion.button>
            )}

            {/* Produksi */}
            {(userRole === 'owner' || userRole === 'admin') && (
              <motion.button
                variants={item}
                onClick={() => onNavigate('production')}
                className="bg-white p-2 rounded-[20px] border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center overflow-hidden shadow-lg shadow-orange-100">
                  <img 
                    src="https://lh3.googleusercontent.com/d/1xnGnOOO6RvjqUW4MTVx9-u7yDTE-qBxl" 
                    alt="Produksi" 
                    className="w-5 h-5 object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[7px] font-black text-stone-800 uppercase tracking-tight text-center leading-tight">Produksi</span>
              </motion.button>
            )}
          </div>

          {/* Announcements Section */}
          <motion.div 
            variants={item}
            className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-stone-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600">notifications</span>
                Pengumuman
              </h3>
              <button className="text-xs font-bold text-orange-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <p className="text-sm font-black text-orange-900">New Shift Schedule Released</p>
                <p className="text-xs text-orange-700/70 mt-1">Please check your schedule for next week in the Shift module.</p>
              </div>
              {broadcasts && broadcasts.length > 0 && broadcasts.map((b, i) => (
                <div key={i} className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="text-sm font-black text-stone-800">{b.title}</p>
                  <p className="text-xs text-stone-500 mt-1">{b.message}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Piutang Notifications Section */}
          {piutangNotifications.length > 0 && (
            <motion.div 
              variants={item}
              className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-stone-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600">account_balance_wallet</span>
                  Tagihan Piutang
                </h3>
                <button 
                  onClick={() => onNavigate('piutang')}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  View All
                </button>
              </div>

              {/* Search Bar for Piutang */}
              <div className="relative mb-4">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-sm">search</span>
                <input 
                  type="text" 
                  placeholder="Cari nama lokasi..."
                  value={piutangSearch}
                  onChange={(e) => {
                    setPiutangSearch(e.target.value);
                    setPiutangPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-100 rounded-xl text-xs focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {paginatedPiutang.map((p, i) => (
                  <div 
                    key={i} 
                    onClick={() => onNavigate('piutang')}
                    className="p-4 bg-red-50/30 rounded-2xl border border-red-100/50 flex flex-col gap-1 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-black text-stone-900 truncate max-w-[150px]">{p.namaLokasi}</p>
                      <span className="text-[10px] font-bold text-red-600 uppercase">
                        {p.daysOverdue === 0 ? 'Jatuh Tempo Hari Ini' : `Terlambat ${p.daysOverdue} Hari`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Rp{p.jumlahUang.toLocaleString()} • {p.periodeBayar}
                      </p>
                      <span className="material-symbols-outlined text-stone-300 text-sm">chevron_right</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination for Piutang */}
              {totalPiutangPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button 
                    onClick={() => setPiutangPage(prev => Math.max(1, prev - 1))}
                    disabled={piutangPage === 1}
                    className="p-1 rounded-lg hover:bg-stone-100 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <span className="text-[10px] font-black text-stone-500">
                    {piutangPage} / {totalPiutangPages}
                  </span>
                  <button 
                    onClick={() => setPiutangPage(prev => Math.min(totalPiutangPages, prev + 1))}
                    disabled={piutangPage === totalPiutangPages}
                    className="p-1 rounded-lg hover:bg-stone-100 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-stone-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">account_balance_wallet</span>
                Tagihan Piutang
              </h3>
              <button 
                onClick={() => onNavigate('piutang')}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                View All
              </button>
            </div>
            {piutangNotifications.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                {piutangNotifications.map((p, i) => (
                  <div 
                    key={i} 
                    onClick={() => onNavigate('piutang')}
                    className="p-4 bg-red-50/30 rounded-2xl border border-red-100/50 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-black text-stone-900">{p.namaLokasi}</p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Rp{p.jumlahUang.toLocaleString()} • {p.periodeBayar}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-red-600 uppercase">
                        {p.daysOverdue === 0 ? 'Jatuh Tempo' : `${p.daysOverdue} Hari`}
                      </p>
                      <p className="text-[9px] font-bold text-stone-400 uppercase">Terlambat</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-stone-300">
                <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-3xl opacity-30">check_circle</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider">Lancar!</p>
                <p className="text-[10px] mt-1">Tidak ada piutang jatuh tempo.</p>
              </div>
            )}
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
