import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Employee, Submission, Broadcast, AttendanceRecord, ShiftAssignment, UserRole, Shift, BranchLocation, Order, Store, DeliveryRecord, BillingRecord } from '../types';
import { parseIndoDate, formatCurrency, getLocalDateString } from '../lib/utils';

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
  deliveries: DeliveryRecord[];
  billingReports: BillingRecord[];
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
  stores,
  deliveries,
  billingReports
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [selectedSumDate, setSelectedSumDate] = useState(getLocalDateString());

  // Date normalization helper for robust comparisons
  const normalizeDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const d = parseIndoDate(dateStr);
    return d ? getLocalDateString(d) : dateStr;
  };

  // Summary Calculations
  const deliverySummary = useMemo(() => {
    let filtered = deliveries.filter(d => normalizeDateString(d.tanggal) === selectedSumDate);
    
    // Filter specifically for KURIR division if logged in as one
    const isKurir = currentUserEmployee?.division?.toUpperCase() === 'KURIR' || 
                    currentUserEmployee?.jabatan?.toUpperCase() === 'KURIR';
    
    if (isKurir && currentUserEmployee?.nama) {
      filtered = filtered.filter(d => d.namaKurir === currentUserEmployee.nama);
    }

    const uniqueLocations = new Set(filtered.map(d => d.namaLokasi)).size;
    const totalQty = filtered.reduce((acc, d) => acc + (Number(d.qtyPengiriman) || 0), 0);
    return { uniqueLocations, totalQty };
  }, [deliveries, selectedSumDate, currentUserEmployee]);

  const billingSummary = useMemo(() => {
    let filtered = billingReports.filter(b => normalizeDateString(b.tanggal) === selectedSumDate);

    // Filter specifically for KURIR division if logged in as one
    const isKurir = currentUserEmployee?.division?.toUpperCase() === 'KURIR' || 
                    currentUserEmployee?.jabatan?.toUpperCase() === 'KURIR';
    
    if (isKurir && currentUserEmployee?.nama) {
      filtered = filtered.filter(b => b.namaKurir === currentUserEmployee.nama);
    }

    const penagihanRecords = filtered.filter(b => !b.metodePembayaran || b.metodePembayaran === 'Cash' || b.metodePembayaran === 'Transfer');
    const uniqueLocations = new Set(filtered.map(b => b.namaLokasi)).size;
    
    let cash = 0, transfer = 0, piutang = 0;
    filtered.forEach(b => {
      const amount = Number(b.qtyPengiriman) || 0;
      if (!b.metodePembayaran || b.metodePembayaran === 'Cash') cash += amount;
      else if (b.metodePembayaran === 'Transfer') transfer += amount;
      else if (b.metodePembayaran === 'Piutang') piutang += amount;
    });

    return { 
      uniqueLocations, 
      count: penagihanRecords.length,
      cash,
      transfer,
      piutang,
      total: cash + transfer + piutang
    };
  }, [billingReports, selectedSumDate, currentUserEmployee]);

  const orderSummary = useMemo(() => {
    let filtered = orders.filter(o => normalizeDateString(o.tanggal) === selectedSumDate);
    
    // Filter specifically for KURIR division if logged in as one
    const isKurir = currentUserEmployee?.division?.toUpperCase() === 'KURIR' || 
                    currentUserEmployee?.jabatan?.toUpperCase() === 'KURIR';
    
    if (isKurir && currentUserEmployee?.nama) {
      filtered = filtered.filter(o => o.namaKurir === currentUserEmployee.nama);
    }

    return filtered.reduce((acc, order) => {
      acc.tunaPedes += (Number(order.tunaPedes) || 0);
      acc.tunaMayo += (Number(order.tunaMayo) || 0);
      acc.ayamMayo += (Number(order.ayamMayo) || 0);
      acc.ayamPedes += (Number(order.ayamPedes) || 0);
      acc.menuBulanan += (Number(order.menuBulanan) || 0);
      acc.jumlahKirim += (Number(order.jumlahKirim) || 0);
      acc.sisa += (Number(order.sisa) || 0);
      return acc;
    }, {
      tunaPedes: 0,
      tunaMayo: 0,
      ayamMayo: 0,
      ayamPedes: 0,
      menuBulanan: 0,
      jumlahKirim: 0,
      sisa: 0
    });
  }, [orders, selectedSumDate, currentUserEmployee]);

  const percentageSisa = orderSummary.jumlahKirim > 0 ? (orderSummary.sisa / orderSummary.jumlahKirim) * 100 : 0;

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
      <div className="md:hidden -mx-4 -mt-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
        {/* Yellow Header Section */}
        <div className="bg-[#FFC107] pt-3 pb-6 px-4 rounded-b-[40px] flex-shrink-0">
          {/* Employee Name & Role (Below Logo Header) */}
          <motion.div 
            variants={item}
            className="mb-3"
          >
            <h1 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {currentUserEmployee?.nama || 'MUHAMMAD MAHARDHIKA'}
            </h1>
            <p className="text-[10px] font-bold text-stone-700 uppercase tracking-[0.2em] mt-0.5">
              {currentUserEmployee?.jabatan || 'STAFF'} • {currentUserEmployee?.division || 'ADMIN'}
            </p>
          </motion.div>

          <motion.div 
            variants={item}
            className="bg-white rounded-[28px] p-4 shadow-xl relative flex flex-col items-center text-center"
          >
            {/* Interactive Date Selection (Mobile) */}
            <div className="text-center mb-3 w-full px-2 relative group">
              <label className="cursor-pointer block">
                <h2 className="text-lg font-black text-stone-900 uppercase tracking-tight whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-center gap-2">
                  {new Date(selectedSumDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  <span className="material-symbols-outlined text-orange-500 text-sm">calendar_month</span>
                </h2>
                <input 
                  type="date" 
                  value={selectedSumDate}
                  onChange={(e) => setSelectedSumDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
              <p className="text-[7px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-0.5">Klik untuk ganti tanggal</p>
            </div>

            {/* Announcements Section (Mobile - Moved up) */}
            <motion.div 
              variants={item}
              className="mt-2 w-full text-left"
            >
              <div className="flex items-center justify-between mb-1.5 px-1">
                <h3 className="text-[9px] font-black text-stone-800 flex items-center gap-1.5 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-orange-600 text-xs">notifications</span>
                  Pengumuman
                </h3>
                <button className="text-[8px] font-bold text-orange-600 hover:underline uppercase tracking-wider">View All</button>
              </div>
              <div className="space-y-1">
                {broadcasts && broadcasts.length > 0 && broadcasts.slice(0, 1).map((b, i) => (
                  <div key={i} className={`p-2 rounded-xl border ${b.type === 'info' ? 'bg-orange-50/50 border-orange-100' : 'bg-stone-50 border-stone-100'}`}>
                    <p className={`text-[10px] font-black leading-tight ${b.type === 'info' ? 'text-orange-900' : 'text-stone-800'}`}>{b.title}</p>
                    <p className={`text-[8px] mt-0.5 line-clamp-1 ${b.type === 'info' ? 'text-orange-700/70' : 'text-stone-500'}`}>{b.message}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Summaries */}
          <motion.div variants={item} className="mt-6 space-y-3 px-0">
            {/* Top Metrics Grid (One Row - Mobile) */}
            <div className="grid grid-cols-4 gap-1.5">
              {/* Delivery Locations */}
              <div className="bg-white rounded-[16px] py-1.5 px-0.5 shadow-sm flex flex-col items-center gap-1 border border-stone-100">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined text-[12px]">storefront</span>
                </div>
                <div className="text-center">
                  <p className="text-[5.5px] font-black text-stone-400 uppercase leading-none mb-1">LOKASI (D)</p>
                  <div className="flex items-baseline justify-center gap-0.5 leading-none">
                    <span className="text-xs font-black text-stone-900">{deliverySummary.uniqueLocations}</span>
                    <span className="text-[6px] font-bold text-stone-400 uppercase">TITIK</span>
                  </div>
                </div>
              </div>

              {/* Delivery Total Qty */}
              <div className="bg-white rounded-[16px] py-1.5 px-0.5 shadow-sm flex flex-col items-center gap-1 border border-stone-100">
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined text-[12px]">package_2</span>
                </div>
                <div className="text-center">
                  <p className="text-[5.5px] font-black text-stone-400 uppercase leading-none mb-1">TOTAL QTY</p>
                  <div className="flex items-baseline justify-center gap-0.5 leading-none">
                    <span className="text-xs font-black text-stone-900">{deliverySummary.totalQty}</span>
                    <span className="text-[6px] font-bold text-stone-400 uppercase">PCS</span>
                  </div>
                </div>
              </div>

              {/* Billing Locations */}
              <div className="bg-white rounded-[16px] py-1.5 px-0.5 shadow-sm flex flex-col items-center gap-1 border border-stone-100">
                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined text-[12px]">storefront</span>
                </div>
                <div className="text-center">
                  <p className="text-[5.5px] font-black text-stone-400 uppercase leading-none mb-1">LOKASI (B)</p>
                  <div className="flex items-baseline justify-center gap-0.5 leading-none">
                    <span className="text-xs font-black text-stone-900">{billingSummary.uniqueLocations}</span>
                    <span className="text-[6px] font-bold text-stone-400 uppercase">TITIK</span>
                  </div>
                </div>
              </div>

              {/* Billing Count */}
              <div className="bg-white rounded-[16px] py-1.5 px-0.5 shadow-sm flex flex-col items-center gap-1 border border-stone-100">
                <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <span className="material-symbols-outlined text-[12px]">receipt_long</span>
                </div>
                <div className="text-center">
                  <p className="text-[5.5px] font-black text-stone-400 uppercase leading-none mb-1">JUMLAH DATA</p>
                  <div className="flex items-baseline justify-center gap-0.5 leading-none">
                    <span className="text-xs font-black text-stone-900">{billingSummary.count}</span>
                    <span className="text-[6px] font-bold text-stone-400 uppercase">DATA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods Full Width (Mobile) */}
            <div className="bg-white rounded-[20px] p-3 shadow-md border border-stone-50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                </div>
                <div>
                  <p className="text-[7px] font-black text-stone-400 uppercase tracking-[0.2em] leading-none mb-0.5">METODE BAYAR</p>
                  <p className="text-[6px] font-bold text-stone-300 uppercase tracking-widest leading-none">TOTAL HARI INI</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex justify-between items-center py-0.5 border-b border-stone-50">
                  <span className="text-[7px] font-bold text-stone-400 uppercase">CASH:</span>
                  <span className="text-[9px] font-black text-stone-800">{formatCurrency(billingSummary.cash).replace('Rp ', '')}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-stone-50">
                  <span className="text-[7px] font-bold text-stone-400 uppercase">TRANSFER:</span>
                  <span className="text-[9px] font-black text-blue-600">{formatCurrency(billingSummary.transfer).replace('Rp ', '')}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-stone-50">
                  <span className="text-[7px] font-bold text-stone-400 uppercase">TOTAL:</span>
                  <span className="text-[9px] font-black text-stone-800">{formatCurrency(billingSummary.total).replace('Rp ', '')}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-stone-50">
                  <span className="text-[7px] font-bold text-stone-400 uppercase">PIUTANG:</span>
                  <span className="text-[9px] font-black text-orange-600">{formatCurrency(billingSummary.piutang).replace('Rp ', '')}</span>
                </div>
              </div>
            </div>
            {/* Order Statistics Summary (Mobile) */}
            <div className="bg-white rounded-[20px] p-2 shadow-md border border-stone-50">
              <p className="text-[6px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1.5 px-1">INFORMASI RINGKASAN</p>
              <div className="grid grid-cols-5 gap-1 mb-1.5">
                {[
                  { label: "TUNA\nPEDES", color: "text-pink-500", val: orderSummary.tunaPedes },
                  { label: "TUNA\nMAYO", color: "text-blue-500", val: orderSummary.tunaMayo },
                  { label: "AYAM\nMAYO", color: "text-orange-500", val: orderSummary.ayamMayo },
                  { label: "AYAM\nPEDES", color: "text-red-500", val: orderSummary.ayamPedes },
                  { label: "MENU\nBULANAN", color: "text-emerald-600", val: orderSummary.menuBulanan },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <span className={`text-[4.5px] font-black ${item.color} uppercase text-center leading-[1.1] h-[10px] flex items-center`}>
                      {item.label.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
                    </span>
                    <div className="mt-0.5 bg-stone-50 rounded-full w-full py-0.5 text-center border border-stone-100 flex items-center justify-center h-4">
                      <span className="text-[8px] font-black text-stone-800">{item.val}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-stone-100">
                {[
                  { label: "JUMLAH", val: orderSummary.jumlahKirim },
                  { label: "SISA", val: orderSummary.sisa },
                  { label: "%", val: percentageSisa.toFixed(2) + "%" },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-[5px] font-black text-stone-800 uppercase tracking-wider leading-none mb-0.5">{item.label}</span>
                    <div className="bg-stone-50 rounded-full w-full py-0.5 text-center border border-stone-100 flex items-center justify-center h-4">
                      <span className="text-[8px] font-black text-stone-900">{item.val}</span>
                    </div>
                  </div>
                ))}
              </div>
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
