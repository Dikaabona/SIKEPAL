import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  onNavigate: (tab: any, prefill?: { location: string, type: 'delivery' | 'billing', courier?: string }) => void;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedStoreForDetail, setSelectedStoreForDetail] = useState<Store | null>(null);
  const [showPiutangList, setShowPiutangList] = useState(false);

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

  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(o => normalizeDateString(o.tanggal) === selectedSumDate);
    
    // Filter specifically for KURIR division if logged in as one
    const isKurir = currentUserEmployee?.division?.toUpperCase() === 'KURIR' || 
                    currentUserEmployee?.jabatan?.toUpperCase() === 'KURIR';
    
    if (isKurir && currentUserEmployee?.nama) {
      filtered = filtered.filter(o => o.namaKurir === currentUserEmployee.nama);
    }
    return filtered;
  }, [orders, selectedSumDate, currentUserEmployee]);

  const orderSummary = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
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
  }, [filteredOrders]);

  const percentageSisa = orderSummary.jumlahKirim > 0 ? (orderSummary.sisa / orderSummary.jumlahKirim) * 100 : 0;

  const attendanceStatus = useMemo(() => {
    if (!currentUserEmployee) return null;
    const record = attendanceRecords.find(r => 
      r.employeeId === currentUserEmployee.id && 
      normalizeDateString(r.date) === selectedSumDate
    );
    return record;
  }, [attendanceRecords, currentUserEmployee, normalizeDateString, selectedSumDate]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const assignedLocation = branchLocations.find(loc => loc.id === currentUserEmployee?.branchLocationId);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSumDate]);

  useEffect(() => {
    if (!selectedStoreForDetail) {
      setShowPiutangList(false);
    }
  }, [selectedStoreForDetail]);

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
      <div className="md:hidden -mx-4 -mt-6 h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden flex flex-col bg-stone-100">
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
              <button 
                onClick={() => onNavigate('delivery')}
                className="bg-white rounded-[16px] py-1.5 px-0.5 shadow-sm flex flex-col items-center gap-1 border border-stone-100 active:scale-95 transition-all text-left"
              >
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
              </button>

              {/* Delivery Total Qty */}
              <button 
                onClick={() => onNavigate('delivery')}
                className="bg-white rounded-[16px] py-1.5 px-0.5 shadow-sm flex flex-col items-center gap-1 border border-stone-100 active:scale-95 transition-all text-left"
              >
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
              </button>

              {/* Billing Locations */}
              <button 
                onClick={() => onNavigate('billing_report')}
                className="bg-white rounded-[16px] py-1.5 px-0.5 shadow-sm flex flex-col items-center gap-1 border border-stone-100 active:scale-95 transition-all text-left"
              >
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
              </button>

              {/* Billing Count */}
              <button 
                onClick={() => onNavigate('billing_report')}
                className="bg-white rounded-[16px] py-1.5 px-0.5 shadow-sm flex flex-col items-center gap-1 border border-stone-100 active:scale-95 transition-all text-left"
              >
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
              </button>

              {/* Absensi Metric (Mobile - NEW) */}
              <button 
                onClick={() => onNavigate('selfie_attendance')}
                className={`bg-white rounded-[16px] py-1.5 px-0.5 shadow-sm flex flex-col items-center gap-1 border active:scale-95 transition-all ${attendanceStatus ? 'border-emerald-100' : 'border-red-100'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${attendanceStatus ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  <span className="material-symbols-outlined text-[12px]">{attendanceStatus ? 'person_check' : 'person_cancel'}</span>
                </div>
                <div className="text-center">
                  <p className="text-[5.5px] font-black text-stone-400 uppercase leading-none mb-1">ABSENSI</p>
                  <div className="flex items-baseline justify-center gap-0.5 leading-none">
                    <span className={`text-[8px] font-black uppercase ${attendanceStatus ? 'text-emerald-700' : 'text-red-700'}`}>
                      {attendanceStatus ? 'MASUK' : 'BELUM'}
                    </span>
                  </div>
                </div>
              </button>

              {/* Sisa Metric (Mobile - NEW) */}
              <div className="bg-white rounded-[16px] py-1.5 px-0.5 shadow-sm flex flex-col items-center gap-1 border border-stone-100">
                <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                   <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                </div>
                <div className="text-center">
                  <p className="text-[5.5px] font-black text-stone-400 uppercase leading-none mb-1">SISA</p>
                  <div className="flex items-baseline justify-center gap-0.5 leading-none">
                    <span className="text-xs font-black text-stone-900">{orderSummary.sisa}</span>
                    <span className="text-[6px] font-bold text-stone-400 uppercase">PCS</span>
                  </div>
                </div>
              </div>

              {/* Kas Kurir Metric (Mobile - NEW) */}
              <button 
                onClick={() => onNavigate('courier_cash')}
                className="bg-white rounded-[16px] py-1.5 px-0.5 shadow-sm flex flex-col items-center gap-1 border border-stone-100 active:scale-95 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined text-[12px]">payments</span>
                </div>
                <div className="text-center">
                  <p className="text-[5.5px] font-black text-stone-400 uppercase leading-none mb-1">KAS KURIR</p>
                  <div className="flex items-baseline justify-center gap-0.5 leading-none">
                    <span className="text-[8px] font-black uppercase text-indigo-700">MODUL</span>
                  </div>
                </div>
              </button>
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

        {/* Data Orderan List (Mobile) */}
        <div className="px-4 py-4 space-y-4">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">Data Orderan Hari Ini</p>
          <div className="space-y-4">
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[24px] p-4 shadow-sm border border-stone-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{order.tanggal}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      order.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      order.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status || 'Approved'}
                    </span>
                  </div>
                  
                  <div 
                    onClick={() => {
                      const store = stores.find(s => s.namaToko === order.namaLokasi);
                      if (store) setSelectedStoreForDetail(store);
                    }}
                    className="mb-4 cursor-pointer active:scale-[0.98] transition-all group"
                  >
                    <h4 className="text-sm font-black text-stone-800 uppercase tracking-tight leading-short group-active:text-primary transition-colors">{order.namaLokasi}</h4>
                    <span className="text-[10px] font-bold text-primary uppercase block mt-0.5">{order.namaKurir}</span>
                    <span className="text-[8px] text-stone-400 italic block">Sikepal Delivery</span>
                  </div>

                  <div className="grid grid-cols-6 gap-1">
                    {[
                      { label: "TUNA PDS", val: order.tunaPedes, color: "text-pink-600" },
                      { label: "TUNA MYO", val: order.tunaMayo, color: "text-blue-600" },
                      { label: "AYAM MYO", val: order.ayamMayo, color: "text-orange-600" },
                      { label: "AYAM PDS", val: order.ayamPedes, color: "text-red-600" },
                      { label: "MENU BLN", val: order.menuBulanan, color: "text-emerald-700" },
                      { label: "TOTAL", val: order.jumlahKirim, color: "text-stone-900", isTotal: true },
                    ].map((item, idx) => (
                      <div key={idx} className={`flex flex-col items-center p-1 rounded-xl border border-stone-50 ${item.isTotal ? 'bg-orange-50/50 border-orange-100' : 'bg-stone-50/50'}`}>
                        <span className="text-[4.5px] font-black text-stone-400 uppercase leading-none mb-1 text-center scale-[0.8]">{item.label}</span>
                        <span className={`text-[10px] font-black ${item.color}`}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-30">
                <span className="material-symbols-outlined text-4xl mb-2 text-stone-400">inventory_2</span>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tidak Ada Data</p>
              </div>
            )}
          </div>

          {/* Rows Per Page & Pagination (Mobile) */}
          <div className="flex flex-col gap-6 pt-4">
            <div className="flex flex-col gap-2 px-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-stone-500">
                  Menampilkan {filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} sampai {Math.min(currentPage * itemsPerPage, filteredOrders.length)} dari {filteredOrders.length} data
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Tampilkan:</span>
                  <div className="relative">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="appearance-none bg-white border border-stone-200 rounded-xl px-4 py-1.5 pr-8 text-[11px] font-black text-stone-700 outline-none shadow-sm focus:ring-2 focus:ring-orange-100 transition-all"
                    >
                      {[10, 30, 50, 100].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 text-sm pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pb-4 px-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-stone-200 bg-white disabled:opacity-30 disabled:bg-stone-50 transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-stone-600 text-lg">chevron_left</span>
                </button>
                
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const pages = [];
                    if (totalPages <= 4) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      if (currentPage <= 2) {
                        pages.push(1, 2, '...', totalPages);
                      } else if (currentPage >= totalPages - 1) {
                        pages.push(1, '...', totalPages - 1, totalPages);
                      } else {
                        pages.push(1, '...', currentPage, '...', totalPages);
                      }
                    }
                    return pages.map((p, idx) => (
                      p === '...' ? (
                        <span key={`dots-${idx}`} className="text-stone-400 font-bold px-1">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(Number(p))}
                          className={`w-9 h-9 rounded-xl text-xs font-black transition-all active:scale-95 ${
                            currentPage === p 
                              ? 'bg-[#915F07] text-white shadow-md shadow-orange-200' 
                              : 'bg-white border border-stone-100 text-stone-600'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    ));
                  })()}
                </div>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-stone-200 bg-white disabled:opacity-30 disabled:bg-stone-50 transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-stone-600 text-lg">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom spacers for scrolling comfort */}
        <div className="h-24"></div>
      </div>

      {/* Store Detail Modal (Mobile) */}
      <AnimatePresence>
        {selectedStoreForDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStoreForDetail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg ${
                    selectedStoreForDetail.grade === 'A' ? 'bg-green-500' :
                    selectedStoreForDetail.grade === 'B' ? 'bg-blue-500' :
                    selectedStoreForDetail.grade === 'C' ? 'bg-yellow-500' :
                    selectedStoreForDetail.grade === 'D' ? 'bg-orange-500' :
                    'bg-[#FFC107]'
                  }`}>
                    {selectedStoreForDetail.namaToko.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-800 uppercase tracking-tight leading-none mb-1">
                      {selectedStoreForDetail.namaToko}
                    </h3>
                    <div className="flex gap-1">
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[8px] font-black uppercase tracking-widest leading-none">
                        {selectedStoreForDetail.kategori || '-'}
                      </span>
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[8px] font-black uppercase tracking-widest leading-none">
                        {selectedStoreForDetail.kurir || '-'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStoreForDetail(null)}
                  className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 active:scale-90 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-stone-50/50 p-4 rounded-[28px] border border-stone-100">
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1">PIC</span>
                  <div className="text-sm font-black text-stone-800 mb-0.5 leading-tight">{selectedStoreForDetail.namaPIC || '-'}</div>
                  <div className="text-[10px] text-stone-500 font-bold tracking-tight">{selectedStoreForDetail.nomorPIC || '-'}</div>
                </div>
                <div className="bg-stone-50/50 p-4 rounded-[28px] border border-stone-100">
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1">Harga & Bayar</span>
                  <div className="text-sm font-black text-stone-800 mb-0.5 leading-tight">{selectedStoreForDetail.harga || '-'}</div>
                  <div className="text-[10px] text-stone-500 font-bold uppercase tracking-tight">{selectedStoreForDetail.pembayaran || '-'}</div>
                </div>
              </div>

              <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-100 mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-stone-400">schedule</span>
                <span className="text-sm font-black text-stone-800 uppercase tracking-tight">{selectedStoreForDetail.operasional || '-'}</span>
              </div>

              {/* Piutang Section in Modal (Matching provided design) */}
              {!showPiutangList ? (
                <div 
                  onClick={() => setShowPiutangList(true)}
                  className="bg-orange-50/30 rounded-[32px] border border-orange-100/50 p-5 mb-4 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-orange-600 uppercase tracking-widest">PIUTANG</span>
                      <span className="material-symbols-outlined text-orange-500 text-lg">arrow_forward</span>
                    </div>
                    <span className="text-[10px] font-bold text-orange-400 tracking-wider">
                      {getLocalDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-[24px] border border-orange-100 shadow-sm">
                      <span className="text-[8px] font-black text-orange-500 uppercase tracking-tight block mb-1">TOTAL PIUTANG (QTY)</span>
                      <div className="text-lg font-black text-stone-800 leading-none">
                        {orders.filter(o => o.namaLokasi === selectedStoreForDetail.namaToko && o.pembayaran === 'FALSE').length}
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-[24px] border border-orange-100 shadow-sm">
                      <span className="text-[8px] font-black text-orange-500 uppercase tracking-tight block mb-1">JUMLAH PIUTANG (RP)</span>
                      <div className="text-lg font-black text-stone-800 leading-none">
                        {formatCurrency(orders.filter(o => o.namaLokasi === selectedStoreForDetail.namaToko && o.pembayaran === 'FALSE').reduce((sum, o) => sum + (o.jumlahUang || 0), 0))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[32px] border border-stone-100 p-5 mb-4 shadow-sm h-[320px] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <button 
                      onClick={() => setShowPiutangList(false)}
                      className="flex items-center gap-1 text-orange-600 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">arrow_back</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Kembali</span>
                    </button>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Detail Piutang</span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                    {orders
                      .filter(o => o.namaLokasi === selectedStoreForDetail.namaToko && o.pembayaran === 'FALSE')
                      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                      .map((p, idx) => (
                        <div key={idx} className="bg-stone-50/50 p-3 rounded-2xl border border-stone-100 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest leading-none mb-1">{p.tanggal}</span>
                            <span className="text-[10px] font-black text-stone-700 uppercase leading-none">{p.namaKurir}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] font-black text-orange-600 leading-none mb-0.5">{formatCurrency(p.jumlahUang || 0)}</div>
                            <div className="text-[8px] font-bold text-stone-400 uppercase tracking-tight">{p.jumlahKirim} PCS</div>
                          </div>
                        </div>
                      ))}
                    {orders.filter(o => o.namaLokasi === selectedStoreForDetail.namaToko && o.pembayaran === 'FALSE').length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full opacity-20">
                        <span className="material-symbols-outlined text-4xl mb-1 text-stone-400">payments</span>
                        <p className="text-[9px] font-black uppercase tracking-widest">Tidak ada piutang</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={() => {
                    onNavigate('delivery', { 
                      location: selectedStoreForDetail.namaToko, 
                      type: 'delivery',
                      courier: currentUserEmployee?.nama || undefined 
                    });
                    setSelectedStoreForDetail(null);
                  }}
                  className="bg-orange-50/50 py-4 rounded-2xl flex flex-col items-center gap-2 border border-stone-100 group active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FFC107]/10 flex items-center justify-center text-[#FFC107]">
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <span className="text-[9px] font-black text-[#A66000] uppercase tracking-widest">Delivery Report</span>
                </button>
                <button 
                  onClick={() => {
                    onNavigate('billing_report', { 
                      location: selectedStoreForDetail.namaToko, 
                      type: 'billing',
                      courier: currentUserEmployee?.nama || undefined 
                    });
                    setSelectedStoreForDetail(null);
                  }}
                  className="bg-blue-50/50 py-4 rounded-2xl flex flex-col items-center gap-2 border border-stone-100 group active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>
                  <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Billing Report</span>
                </button>
              </div>

              {selectedStoreForDetail.linkGmaps && (
                <a 
                  href={selectedStoreForDetail.linkGmaps} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 bg-[#1A1A1A] text-white rounded-[24px] text-sm font-black uppercase tracking-widest shadow-xl shadow-stone-900/20 active:scale-95 transition-all mb-2"
                >
                  <span className="material-symbols-outlined">location_on</span>
                  Buka di Google Maps
                </a>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
