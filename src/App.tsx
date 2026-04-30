import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import StoreDatabase from './components/StoreDatabase';
import OrderDatabase from './components/OrderDatabase';
import PiutangModule from './components/PiutangModule';
import { ActiveTab, Employee, AttendanceRecord, Submission, Broadcast, LiveSchedule, Shift, ShiftAssignment, Store, Order, UserRole, DeliveryRecord, BillingRecord, CourierCashRecord, COAAccount, AccountingJournal, Division, Position, BranchLocation, SalesReportEntry } from './types';
import { Icons, DEFAULT_SHIFTS } from './constants';
import { getLocalDateString } from './lib/utils';
import Dashboard from './components/Dashboard';
import AttendanceModule from './components/AttendanceModule';
import EmployeeForm from './components/EmployeeForm';
import Inbox from './components/Inbox';
import AbsenModule from './components/AbsenModule';
import SettingsModule from './components/SettingsModule';
import ScheduleModule from './components/ScheduleModule';
import EmployeeDatabase from './components/EmployeeDatabase';
import MinVisModule from './components/MinVisModule';
import CalendarModule from './components/CalendarModule';
import InventoryModule from './components/InventoryModule';
import LiveMapModule from './components/LiveMapModule';
import FinancialModule from './components/FinancialModule';
import RecruitmentModule from './components/RecruitmentModule';
import { InvoiceModule } from './components/InvoiceModule';
import { AdvertisingModule } from './components/AdvertisingModule';
import SalesReport from './components/SalesReport';
import PrintAdmin from './components/PrintAdmin';
import OrderReport from './components/OrderReport';
import CourierBilling from './components/CourierBilling';
import DeliveryModule from './components/DeliveryModule';
import DailyReportModule from './components/DailyReportModule';
import CourierCashModule from './components/CourierCashModule';
import COAModule from './components/COAModule';
import AccountingModule from './components/AccountingModule';
import ClientMonitor from './components/ClientMonitor';
import Login from './components/Login';
import { Session } from '@supabase/supabase-js';

import SubmissionForm from './components/SubmissionForm';

// Mock Data
const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    idKaryawan: 'EMP001',
    nama: 'Elena Rodriguez',
    email: 'elena@sikepal.com',
    company: 'Sikepal',
    role: 'owner',
    jabatan: 'Head Chef',
    division: 'Kitchen',
    tanggalMasuk: '2023-01-15',
    hutang: 0,
  },
  {
    id: '4',
    idKaryawan: 'EMP004',
    nama: 'Muhammad Mahardhika',
    email: 'muhammadmahardhikadib@gmail.com',
    company: 'Sikepal',
    role: 'owner',
    jabatan: 'Owner',
    division: 'Management',
    tanggalMasuk: '2023-01-01',
    hutang: 0,
  },
  {
    id: '2',
    idKaryawan: 'EMP002',
    nama: 'Marcus Chen',
    email: 'marcus@sikepal.com',
    company: 'Sikepal',
    role: 'admin',
    jabatan: 'Delivery Lead',
    division: 'Logistics',
    tanggalMasuk: '2023-03-10',
    hutang: 0,
  },
  {
    id: '3',
    idKaryawan: 'EMP003',
    nama: 'Sarah Miller',
    email: 'sarah@sikepal.com',
    company: 'Sikepal',
    role: 'employee',
    jabatan: 'Cashier',
    division: 'Front Desk',
    tanggalMasuk: '2023-05-20',
    hutang: 0,
  }
];

const MOCK_DELIVERIES: DeliveryRecord[] = [
  {
    id: '1',
    namaKurir: 'Budi Santoso',
    tanggal: '2024-03-20',
    namaLokasi: 'Toko Berkah Jaya',
    fotoBukti: 'https://picsum.photos/seed/delivery1/200/200',
    lokasiBukti: '-6.2088, 106.8456',
    jamBukti: '10:30',
    qtyPengiriman: 25,
    keterangan: 'Diterima oleh Pak Ahmad',
    company: 'Sikepal',
    status: 'Completed',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    namaKurir: 'Siti Aminah',
    tanggal: '2024-03-20',
    namaLokasi: 'Warung Pojok',
    fotoBukti: 'https://picsum.photos/seed/delivery2/200/200',
    lokasiBukti: '-6.2100, 106.8500',
    jamBukti: '11:15',
    qtyPengiriman: 15,
    keterangan: 'Toko tutup, ditaruh di depan',
    company: 'Sikepal',
    status: 'Completed',
    createdAt: new Date().toISOString()
  }
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'a1',
    employeeId: '1',
    company: 'Sikepal',
    date: new Date().toISOString().split('T')[0],
    status: 'Hadir',
    clockIn: '07:45 AM',
    submittedAt: new Date().toISOString(),
  },
  {
    id: 'a2',
    employeeId: '2',
    company: 'Sikepal',
    date: new Date().toISOString().split('T')[0],
    status: 'Hadir',
    clockIn: '08:15 AM',
    notes: 'Late',
    submittedAt: new Date().toISOString(),
  }
];

const MOCK_STORES: Store[] = [
  {
    id: 's1',
    namaToko: 'Alfamart Gading Serpong',
    alamat: 'Dusun III, Gading Serpong',
    company: 'Sikepal',
    grade: 'A',
    namaPIC: 'Ahmad',
    linkGmaps: 'https://maps.google.com',
    kategori: 'Alfamart',
    harga: '10000',
    pembayaran: 'CASH',
    operasional: '24 Jam',
    note: '',
    updatedAt: new Date().toISOString()
  },
  {
    id: 's2',
    namaToko: 'Indomaret Karawaci',
    alamat: 'Jl. Boulevard Palem Raya',
    company: 'Sikepal',
    grade: 'B',
    namaPIC: 'Budi',
    linkGmaps: 'https://maps.google.com',
    kategori: 'Indomaret',
    harga: '10000',
    pembayaran: 'CASH',
    operasional: '07:00 - 22:00',
    note: '',
    updatedAt: new Date().toISOString()
  }
];

const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    tanggal: '22/04/2026',
    namaKurir: 'Budi Santoso',
    namaLokasi: 'Alfamart Gading Serpong',
    tunaPedes: 50,
    tunaMayo: 25,
    ayamMayo: 25,
    ayamPedes: 50,
    menuBulanan: 0,
    jumlahKirim: 150,
    hargaSikepal: 10000,
    periodeBayar: 'Harian',
    sisa: 0,
    jumlahPiutang: 0,
    jumlahUang: 1500000,
    pembayaran: 'TRUE',
    tanggalBayar: '22/04/2026',
    diskon: 0,
    company: 'Sikepal',
    status: 'Approved',
    updatedAt: new Date().toISOString()
  }
];

const MOCK_BILLING_REPORTS: BillingRecord[] = [
  {
    id: 'b1',
    namaKurir: 'Budi Santoso',
    tanggal: getLocalDateString(), // Use today's date so it shows up by default
    namaLokasi: 'Alfamart Gading Serpong',
    qtyPengiriman: 150000, // Use a value that looks like currency
    metodePembayaran: 'CASH',
    company: 'Sikepal',
    status: 'Completed',
    createdAt: new Date().toISOString()
  },
  {
    id: 'b2',
    namaKurir: 'ARDI',
    tanggal: '2026-04-10', // Match user screenshot date
    namaLokasi: 'Indomaret Point',
    qtyPengiriman: 250000,
    metodePembayaran: 'Transfer',
    company: 'Sikepal',
    status: 'Completed',
    createdAt: new Date().toISOString()
  }
];

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 's1',
    employeeId: '1',
    company: 'Sikepal',
    type: 'Leave',
    reason: 'Family emergency',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    submittedAt: new Date().toISOString(),
  },
  {
    id: 's2',
    employeeId: '2',
    company: 'Sikepal',
    type: 'Overtime',
    reason: 'Extra prep for event',
    status: 'Pending',
    submittedAt: new Date().toISOString(),
  }
];

const MOCK_BROADCASTS: Broadcast[] = [
  {
    id: '2',
    title: 'Monthly KPI Review',
    message: 'KPI reviews will be held on Friday, Oct 27th.',
    sentAt: new Date().toISOString(),
    type: 'announcement',
    company: 'Sikepal',
    targetEmployeeIds: []
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['attendance', 'database', 'report']);
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salesReports, setSalesReports] = useState<SalesReportEntry[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileQuickMenuOpen, setIsMobileQuickMenuOpen] = useState(false);
  const [autoOpenOrderModal, setAutoOpenOrderModal] = useState(false);
  const [autoOpenDeliveryForStore, setAutoOpenDeliveryForStore] = useState<string | null>(null);
  const [autoOpenBillingForStore, setAutoOpenBillingForStore] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(MOCK_BROADCASTS);
  const [liveSchedules, setLiveSchedules] = useState<LiveSchedule[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [billingReports, setBillingReports] = useState<BillingRecord[]>([]);
  const [courierCashRecords, setCourierCashRecords] = useState<CourierCashRecord[]>([]);
  const [coaAccounts, setCoaAccounts] = useState<COAAccount[]>([]);
  const [accountingJournals, setAccountingJournals] = useState<AccountingJournal[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [branchLocations, setBranchLocations] = useState<BranchLocation[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('owner');
  const [userCompany, setUserCompany] = useState('Sikepal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [session, setSession] = useState<Session | null>(null);
  const [prefillData, setPrefillData] = useState<{ location: string; type: 'delivery' | 'billing'; courier?: string } | null>(null);
  const [returnStoreId, setReturnStoreId] = useState<string | null>(null);
  const [preselectedStoreId, setPreselectedStoreId] = useState<string | null>(null);

  const [isDataMissing, setIsDataMissing] = useState(false);

  const userEmail = session?.user?.email?.toLowerCase().trim() || '';
  const currentUserEmployee = employees.find(e => e.email?.toLowerCase().trim() === userEmail) || null;

  // Check for missing employee data
  useEffect(() => {
    if (session && !isLoading && employees.length > 0) {
      const userEmail = session.user?.email?.toLowerCase().trim();
      const found = employees.find(e => e.email?.toLowerCase().trim() === userEmail);
      if (!found) {
        setIsDataMissing(true);
      } else {
        setIsDataMissing(false);
      }
    }
  }, [session, employees, isLoading]);

  // Handle Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSalesReports = async () => {
    try {
      const allData: any[] = [];
      let from = 0;
      let to = 999;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('sales_reports')
          .select('*')
          .range(from, to);
        
        if (error) throw error;
        if (data && data.length > 0) {
          allData.push(...data);
          if (data.length < 1000) hasMore = false;
          else { from += 1000; to += 1000; }
        } else {
          hasMore = false;
        }
      }
      setSalesReports(allData.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    } catch (e) {
      console.warn('Sales reports table might not exist yet, using mock data');
      setSalesReports([]); // We don't have mock sales reports yet, but at least warn correctly
    }
  };

  const handleSaveSalesReport = async (report: SalesReportEntry) => {
    try {
      const { error } = await supabase.from('sales_reports').upsert(report);
      if (error) throw error;
      await fetchSalesReports(); // Refresh local state
    } catch (error: any) {
      console.error('Error saving sales report:', error);
      alert('Gagal menyimpan sales report: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteSalesReport = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus sales report ini?')) return;
    try {
      const { error } = await supabase.from('sales_reports').delete().eq('id', id);
      if (error) throw error;
      await fetchSalesReports(); // Refresh local state
    } catch (error: any) {
      console.error('Error deleting sales report:', error);
      alert('Gagal menghapus sales report: ' + (error.message || 'Unknown error'));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Fetch data from Supabase
  useEffect(() => {
    const handleSupabaseError = (error: any, operation: string, table: string) => {
      const errInfo = {
        error: error.message || String(error),
        operationType: operation,
        table,
        authInfo: {
          userId: null, // Will be updated if needed
          email: null,
        }
      };
      console.error('Supabase Error:', JSON.stringify(errInfo));
    };

    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase.from('employees').select('*');
        if (error) throw error;
        if (data && data.length === 0) {
          await supabase.from('employees').upsert(MOCK_EMPLOYEES);
          setEmployees(MOCK_EMPLOYEES);
        } else if (data) {
          setEmployees(data);
        }
      } catch (e) {
        console.warn('Employees table might not exist yet, using mock data');
        setEmployees(MOCK_EMPLOYEES);
      }
    };

    const fetchAttendance = async () => {
      try {
        const { data, error } = await supabase.from('attendance').select('*');
        if (error) throw error;
        if (data) setAttendanceRecords(data);
      } catch (e) {
        console.warn('Attendance table might not exist yet');
        setAttendanceRecords([]);
      }
    };

    const fetchSubmissions = async () => {
      try {
        const { data, error } = await supabase.from('submissions').select('*');
        if (error) throw error;
        if (data) setSubmissions(data);
      } catch (e) {
        console.warn('Submissions table might not exist yet');
        setSubmissions([]);
      }
    };

    const fetchShifts = async () => {
      try {
        const { data, error } = await supabase.from('shifts').select('*');
        if (error) throw error;
        if (data) setShifts(data);
      } catch (e) {
        console.warn('Shifts table might not exist yet');
        setShifts([]);
      }
    };

    const fetchShiftAssignments = async () => {
      try {
        const { data, error } = await supabase.from('shift_assignments').select('*');
        if (error) throw error;
        if (data) setShiftAssignments(data);
      } catch (e) {
        console.warn('Shift assignments table might not exist yet');
        setShiftAssignments([]);
      }
    };

    const fetchStores = async () => {
      try {
        const { data, error } = await supabase.from('stores').select('*');
        if (error) throw error;
        if (data && data.length === 0) {
          await supabase.from('stores').upsert(MOCK_STORES);
          setStores(MOCK_STORES);
        } else if (data) {
          setStores(data);
        }
      } catch (e) {
        console.warn('Stores table might not exist yet, using mock data');
        setStores(MOCK_STORES);
      }
    };

    // Helper for fetching all data with pagination
    const fetchAllData = async (table: string, limit: number = 20000) => {
      let allData: any[] = [];
      let from = 0;
      let to = 999;
      let hasMore = true;

      while (hasMore && allData.length < limit) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .range(from, to);
        
        if (error) throw error;
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < 1000) {
            hasMore = false;
          } else {
            from += 1000;
            to += 1000;
          }
        } else {
          hasMore = false;
        }
      }
      return allData.slice(0, limit);
    };

    const fetchOrders = async () => {
      try {
        const data = await fetchAllData('orders');
        if (data && data.length === 0) {
          await supabase.from('orders').upsert(MOCK_ORDERS);
          setOrders(MOCK_ORDERS);
        } else {
          setOrders(data);
        }
      } catch (e) {
        console.warn('Orders table might not exist yet, using mock data');
        setOrders(MOCK_ORDERS);
      }
    };

    const fetchDeliveries = async () => {
      try {
        const data = await fetchAllData('deliveries');
        if (data && data.length === 0) {
          await supabase.from('deliveries').upsert(MOCK_DELIVERIES);
          setDeliveries(MOCK_DELIVERIES);
        } else {
          setDeliveries(data.sort((a, b) => {
            const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tB - tA;
          }));
        }
      } catch (e) {
        console.warn('Deliveries table might not exist yet, using mock data');
        setDeliveries(MOCK_DELIVERIES);
      }
    };

    const fetchBillingReports = async () => {
      try {
        const data = await fetchAllData('billing_reports');
        if (data && data.length === 0) {
          await supabase.from('billing_reports').upsert(MOCK_BILLING_REPORTS);
          setBillingReports(MOCK_BILLING_REPORTS);
        } else {
          setBillingReports(data.sort((a, b) => {
            const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tB - tA;
          }));
        }
      } catch (e) {
        console.warn('Billing reports table might not exist yet, using mock data');
        setBillingReports(MOCK_BILLING_REPORTS);
      }
    };

    const fetchCourierCash = async () => {
      try {
        const data = await fetchAllData('courier_cash_records');
        setCourierCashRecords(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (e) {
        console.warn('Courier cash table might not exist yet');
        setCourierCashRecords([]);
      }
    };

    const fetchCOA = async () => {
      try {
        const data = await fetchAllData('coa_accounts');
        setCoaAccounts(data.sort((a, b) => a.code.localeCompare(b.code)));
      } catch (e) {
        setCoaAccounts([]);
      }
    };

    const fetchJournals = async () => {
      try {
        const data = await fetchAllData('accounting_journals');
        setAccountingJournals(data.sort((a, b) => b.date.localeCompare(a.date)));
      } catch (e) {
        setAccountingJournals([]);
      }
    };

    const fetchSalesReportsInternal = async () => {
      await fetchSalesReports();
    };

    const fetchStaticData = async () => {
      try {
        const { data: divData } = await supabase.from('divisions').select('*');
        if (divData) setDivisions(divData);
        const { data: posData } = await supabase.from('positions').select('*');
        if (posData) setPositions(posData);
        const { data: branchData } = await supabase.from('branch_locations').select('*');
        if (branchData) setBranchLocations(branchData);
      } catch (e) {
        console.warn('Static data tables might not exist yet');
      }
    };

    const tableFetchers: Record<string, () => Promise<void>> = {
      employees: fetchEmployees,
      attendance: fetchAttendance,
      submissions: fetchSubmissions,
      shifts: fetchShifts,
      shift_assignments: fetchShiftAssignments,
      stores: fetchStores,
      orders: fetchOrders,
      deliveries: fetchDeliveries,
      billing_reports: fetchBillingReports,
      courier_cash: fetchCourierCash,
      sales_reports: fetchSalesReportsInternal,
      coa_accounts: fetchCOA,
      accounting_journals: fetchJournals,
      divisions: fetchStaticData,
      positions: fetchStaticData,
      branch_locations: fetchStaticData
    };

    const fetchData = async (tableName?: string) => {
      if (tableName && tableFetchers[tableName]) {
        try {
          await tableFetchers[tableName]();
        } catch (err) {
          console.error(`Error fetching ${tableName}:`, err);
        }
        return;
      }

      setIsLoading(true);
      try {
        // Step 1: Fetch Critical Data for Home Screen
        await Promise.all([
          fetchEmployees(),
          fetchAttendance(), // Currently fetches all, could be optimized further if needed
          fetchShifts(),
          fetchShiftAssignments(),
          fetchStores(),
          fetchStaticData()
        ]);
        
        // Hide loader as soon as home screen data is ready
        setIsLoading(false);

        // Step 2: Fetch Secondary Data in Background
        Promise.allSettled([
          fetchSubmissions(),
          fetchOrders(),
          fetchDeliveries(),
          fetchBillingReports(),
          fetchCourierCash(),
          fetchSalesReports(),
          fetchCOA(),
          fetchJournals()
        ]).then((results) => {
          const failures = results.filter(r => r.status === 'rejected');
          if (failures.length > 0) {
            console.warn(`${failures.length} secondary data tables failed to fetch, possibly due to missing tables or network issues.`);
          }
        });

      } catch (err) {
        handleSupabaseError(err, 'fetch', 'all');
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions with targeted fetching
    const createChannel = (table: string) => {
      return supabase
        .channel(table)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          console.log(`Real-time update for ${table}`);
          fetchData(table);
        })
        .subscribe();
    };

    const channels = Object.keys(tableFetchers).map(createChannel);

    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, []);

  const refreshData = () => {
    console.log('Refreshing data from Supabase...');
  };

  const handleSaveEmployee = async (employee: Employee) => {
    try {
      const { error } = await supabase.from('employees').upsert(employee);
      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving employee:', error);
      alert('Gagal menyimpan ke database: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      alert('Gagal menghapus karyawan: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSaveAttendanceRecord = async (record: AttendanceRecord) => {
    try {
      // Prevent duplicates: if this is a new record (not updating an existing ID),
      // check if a record for this employee and date already exists.
      const isNewRecord = !attendanceRecords.some(r => r.id === record.id);
      if (isNewRecord) {
        const existing = attendanceRecords.find(r => r.employeeId === record.employeeId && r.date === record.date);
        if (existing) {
          console.warn('Duplicate attendance detected. Merging with existing record.');
          // Merge the new data into the existing record
          record.id = existing.id;
          // If we are clocking in but already have a clockIn, keep the original one
          if (record.clockIn && existing.clockIn) {
            record.clockIn = existing.clockIn;
            record.photoIn = existing.photoIn;
          }
        }
      }

      const { error } = await supabase.from('attendance').upsert(record);
      if (error) throw error;
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  const handleDeleteAttendanceRecord = async (recordId: string) => {
    try {
      const { error } = await supabase.from('attendance').delete().eq('id', recordId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting attendance:', error);
    }
  };

  const handleSaveSubmission = async (submission: Submission) => {
    try {
      const { error } = await supabase.from('submissions').upsert(submission);
      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving submission:', error);
      alert('Gagal menyimpan pengajuan: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase.from('submissions').delete().eq('id', submissionId);
      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting submission:', error);
      alert('Gagal menghapus pengajuan: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSaveStore = async (store: Store) => {
    try {
      const { error } = await supabase.from('stores').upsert(store);
      if (error) throw error;
    } catch (error) {
      console.error('Error saving store:', error);
      alert('Gagal menyimpan data toko. Pastikan Supabase sudah dikonfigurasi.');
    }
  };

  const handleDeleteAllStores = async () => {
    try {
      const { error } = await supabase.from('stores').delete().neq('id', '0');
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting all stores:', error);
      alert('Gagal menghapus data toko.');
    }
  };

  const handleSaveOrder = async (order: Order) => {
    try {
      // Ensure status is present and valid for the database
      const orderToSave = {
        ...order,
        status: order.status || 'Approved'
      };
      const { error } = await supabase.from('orders').upsert(orderToSave);
      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving order:', error);
      alert('Gagal menyimpan data orderan: ' + (error.message || 'Unknown error'));
    }
  };

  const handleBulkSaveOrders = async (ordersToSave: Order[]) => {
    try {
      console.log(`Bulk saving ${ordersToSave.length} orders to Supabase...`);
      // Use chunks of 50 to avoid payload size limits
      const chunkSize = 50;
      for (let i = 0; i < ordersToSave.length; i += chunkSize) {
        const chunk = ordersToSave.slice(i, i + chunkSize).map(order => ({
          ...order,
          status: order.status || 'Approved'
        }));
        const { error } = await supabase.from('orders').upsert(chunk);
        if (error) throw error;
      }
      console.log('Bulk save completed successfully');
    } catch (error: any) {
      console.error('Error bulk saving orders:', error);
      throw error;
    }
  };

  const handleSaveDelivery = async (delivery: DeliveryRecord) => {
    try {
      console.log('Saving delivery to Supabase:', delivery);
      // Safeguard: Remove UI-only fields that don't exist in the database
      const { jumlahKirim, originalNilai, ...deliveryToSave } = delivery as any;

      const { error } = await supabase.from('deliveries').upsert(deliveryToSave);
      if (error) throw error;
      
      // Update local state immediately for better UX
      setDeliveries(prev => {
        const index = prev.findIndex(d => d.id === delivery.id);
        if (index >= 0) {
          const newDeliveries = [...prev];
          newDeliveries[index] = delivery;
          return newDeliveries;
        }
        return [delivery, ...prev];
      });
      
      console.log('Delivery saved successfully');
      
      if (returnStoreId) {
        setActiveTab('order_database');
      }
    } catch (error: any) {
      console.error('Error saving delivery:', error);
      alert('Gagal menyimpan delivery: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteDelivery = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data delivery ini?')) return;
    
    try {
      console.log('Deleting delivery from Supabase:', id);
      const { error } = await supabase.from('deliveries').delete().eq('id', id);
      if (error) throw error;
      
      // Update local state immediately
      setDeliveries(prev => prev.filter(d => d.id !== id));
      console.log('Delivery deleted successfully');
    } catch (error: any) {
      console.error('Error deleting delivery:', error);
      alert('Gagal menghapus delivery: ' + (error.message || 'Unknown error'));
    }
  };

  const handleBulkDeleteDelivery = async (ids: string[]) => {
    if (userRole !== 'owner' && userRole !== 'admin') {
      alert('Hanya Admin dan Owner yang dapat menghapus data Delivery Report.');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${ids.length} data delivery ini?`)) return;
    
    try {
      console.log('Bulk deleting deliveries from Supabase:', ids);
      const { error } = await supabase.from('deliveries').delete().in('id', ids);
      if (error) throw error;
      
      setDeliveries(prev => prev.filter(d => !ids.includes(d.id)));
      console.log('Deliveries bulk deleted successfully');
    } catch (error: any) {
      console.error('Error bulk deleting deliveries:', error);
      alert('Gagal menghapus deliveries: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSaveBillingReport = async (report: BillingRecord) => {
    // Check if it's an edit
    const oldReport = billingReports.find(r => r.id === report.id);
    const isEdit = !!oldReport;

    if (isEdit) {
      if (userRole !== 'owner' && userRole !== 'admin') {
        alert('Hanya Admin dan Owner yang dapat mengedit data Billing Report.');
        return;
      }
    } else {
      // For adding new report, allow owner and admin
      if (userRole !== 'owner' && userRole !== 'admin') {
        alert('Hanya Admin, Owner, dan Kurir yang dapat menambah data Billing Report.');
        return;
      }
    }

    try {

      // Requirement 1: Revert previous order if it was linked and changed or if it's an edit
      // We revert the old order first to ensure clean state
      if (oldReport && oldReport.orderId && oldReport.status === 'Completed') {
        console.log('Reverting old order status for order:', oldReport.orderId);
        await supabase
          .from('orders')
          .update({ 
            pembayaran: 'FALSE',
            tanggalBayar: '',
            sisa: 0,
            nilaiPembayaran: 0,
            waste: 0
          })
          .eq('id', oldReport.orderId);
        
        // Update local orders state for the old order
        setOrders(prev => prev.map(o => o.id === oldReport.orderId ? { ...o, pembayaran: 'FALSE', tanggalBayar: '', sisa: 0, nilaiPembayaran: 0, waste: 0 } : o));
      }

      // Safeguard: Remove UI-only fields that don't exist in the database
      const { jumlahKirim, originalNilai, ...reportToSave } = report as any;

      const { error } = await supabase.from('billing_reports').upsert(reportToSave);
      if (error) throw error;
      
      // If this report is linked to an order, update the order's payment status and date
      // ONLY if the status is 'Completed' (Approved)
      if (report.orderId && report.status === 'Completed') {
        console.log('Updating order payment status for order:', report.orderId, 'with payment date:', report.tanggal);
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            pembayaran: 'TRUE',
            tanggalBayar: report.tanggal,
            sisa: report.sisa || 0,
            nilaiPembayaran: report.qtyPengiriman || 0,
            waste: report.waste || 0
          })
          .eq('id', report.orderId);
        
        if (orderError) {
          console.error('Error updating order status:', orderError);
        } else {
          // Update local orders state
          setOrders(prev => prev.map(o => o.id === report.orderId ? { ...o, pembayaran: 'TRUE', tanggalBayar: report.tanggal, sisa: report.sisa || 0, nilaiPembayaran: report.qtyPengiriman || 0, waste: report.waste || 0 } : o));
          console.log('Order updated successfully in local state');
        }
      }

      // Requirement 3: Notification in inbox if it's an edit
      if (isEdit && currentUserEmployee) {
        const notification: Submission = {
          id: `notif_${Date.now()}`,
          employeeId: currentUserEmployee.id,
          company: userCompany,
          type: 'Notification',
          reason: `${currentUserEmployee.nama} telah mengedit data Billing Report untuk lokasi ${report.namaLokasi} pada tanggal ${report.tanggal}`,
          status: 'Approved',
          submittedAt: new Date().toISOString()
        };
        await handleSaveSubmission(notification);
      }

      setBillingReports(prev => {
        const index = prev.findIndex(r => r.id === report.id);
        if (index >= 0) {
          const newReports = [...prev];
          newReports[index] = report;
          return newReports;
        }
        return [report, ...prev];
      });
      
      console.log('Billing report saved successfully');
      
      if (returnStoreId) {
        setActiveTab('order_database');
      }
    } catch (error: any) {
      console.error('Error saving billing report:', error);
      alert('Gagal menyimpan billing report: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteBillingReport = async (id: string) => {
    if (userRole !== 'owner' && userRole !== 'admin') {
      alert('Hanya Admin dan Owner yang dapat menghapus data Billing Report.');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin menghapus data billing report ini?')) return;
    
    try {
      console.log('Deleting billing report from Supabase:', id);
      const reportToDelete = billingReports.find(r => r.id === id);
      
      // Revert order status if it was linked and approved
      if (reportToDelete && reportToDelete.orderId && reportToDelete.status === 'Completed') {
        console.log('Reverting order status for order:', reportToDelete.orderId);
        await supabase
          .from('orders')
          .update({ 
            pembayaran: 'FALSE',
            tanggalBayar: '',
            sisa: 0,
            nilaiPembayaran: 0,
            waste: 0
          })
          .eq('id', reportToDelete.orderId);
        
        setOrders(prev => prev.map(o => o.id === reportToDelete.orderId ? { ...o, pembayaran: 'FALSE', tanggalBayar: '', sisa: 0, nilaiPembayaran: 0, waste: 0 } : o));
      }

      const { error } = await supabase.from('billing_reports').delete().eq('id', id);
      if (error) throw error;
      
      setBillingReports(prev => prev.filter(r => r.id !== id));
      console.log('Billing report deleted successfully');
    } catch (error: any) {
      console.error('Error deleting billing report:', error);
      alert('Gagal menghapus billing report: ' + (error.message || 'Unknown error'));
    }
  };

  const handleBulkDeleteBillingReport = async (ids: string[]) => {
    if (userRole !== 'owner' && userRole !== 'admin') {
      alert('Hanya Admin dan Owner yang dapat menghapus data Billing Report.');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${ids.length} data billing report ini?`)) return;
    
    try {
      console.log('Bulk deleting billing reports from Supabase:', ids);
      
      // Find all reports to be deleted to check for linked orders
      const reportsToDelete = billingReports.filter(r => ids.includes(r.id));
      
      // Revert order status for all linked orders that were approved
      for (const report of reportsToDelete) {
        if (report.orderId && report.status === 'Completed') {
          console.log('Reverting order status for order:', report.orderId);
          await supabase
            .from('orders')
            .update({ 
              pembayaran: 'FALSE',
              tanggalBayar: '',
              sisa: 0,
              nilaiPembayaran: 0,
              waste: 0
            })
            .eq('id', report.orderId);
        }
      }

      // Update local orders state for approved reports
      const approvedLinkedOrderIds = reportsToDelete
        .filter(r => r.orderId && r.status === 'Completed')
        .map(r => r.orderId!);
      
      if (approvedLinkedOrderIds.length > 0) {
        setOrders(prev => prev.map(o => approvedLinkedOrderIds.includes(o.id) ? { ...o, pembayaran: 'FALSE', tanggalBayar: '', sisa: 0, nilaiPembayaran: 0, waste: 0 } : o));
      }

      // Delete from Supabase
      const { error } = await supabase.from('billing_reports').delete().in('id', ids);
      if (error) throw error;
      
      setBillingReports(prev => prev.filter(r => !ids.includes(r.id)));
      console.log('Billing reports bulk deleted successfully');
    } catch (error: any) {
      console.error('Error bulk deleting billing reports:', error);
      alert('Gagal menghapus billing reports: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSaveCourierCash = async (record: CourierCashRecord) => {
    try {
      const { error } = await supabase.from('courier_cash_records').upsert(record);
      if (error) throw error;
      
      setCourierCashRecords(prev => {
        const index = prev.findIndex(r => r.id === record.id);
        if (index >= 0) {
          const newRecords = [...prev];
          newRecords[index] = record;
          return newRecords;
        }
        return [record, ...prev];
      });

      // Automatically create/update accounting journal entry
      const kasKurirAcc = coaAccounts.find(a => a.name.toLowerCase().includes('kas kurir'));
      const balancingAcc = coaAccounts.find(a => 
        record.tipe === 'Masuk' 
          ? a.category === 'Revenue' || a.name.toLowerCase().includes('pendapatan')
          : a.category === 'Expense' || a.name.toLowerCase().includes('biaya') || a.name.toLowerCase().includes('beban')
      );

      if (record.status === 'Approved' && kasKurirAcc && balancingAcc) {
        const journal: AccountingJournal = {
          id: `journal_cc_${record.id}`,
          date: record.tanggal,
          description: `Kas Kurir (${record.tipe}) - ${record.nama_kurir}: ${record.keterangan}`,
          reference: `CC-${record.id.substring(0, 4)}`,
          company: record.company,
          createdAt: new Date().toISOString(),
          entries: [
            {
              accountId: kasKurirAcc.id,
              debit: record.tipe === 'Masuk' ? record.jumlah : 0,
              credit: record.tipe === 'Keluar' ? record.jumlah : 0
            },
            {
              accountId: balancingAcc.id,
              debit: record.tipe === 'Keluar' ? record.jumlah : 0,
              credit: record.tipe === 'Masuk' ? record.jumlah : 0
            }
          ]
        };
        await handleSaveAccountingJournal(journal);
      } else if (record.status !== 'Approved') {
        // Delete linked journal entry if it was previously approved but now retracted/rejected
        const journalId = `journal_cc_${record.id}`;
        await handleDeleteAccountingJournal(journalId);
      }
    } catch (error: any) {
      console.error('Error saving courier cash:', error);
      throw error;
    }
  };

  const handleDeleteCourierCash = async (id: string) => {
    try {
      // Delete from courier_cash_records
      const { error } = await supabase.from('courier_cash_records').delete().eq('id', id);
      if (error) throw error;
      
      setCourierCashRecords(prev => prev.filter(r => r.id !== id));

      // Also delete linked journal entry if exists
      const journalId = `journal_cc_${id}`;
      await handleDeleteAccountingJournal(journalId);
    } catch (error: any) {
      console.error('Error deleting courier cash:', error);
      alert('Gagal menghapus kas kurir: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSaveCOA = async (account: COAAccount) => {
    try {
      const { error } = await supabase.from('coa_accounts').upsert(account);
      if (error) throw error;
      setCoaAccounts(prev => {
        const index = prev.findIndex(a => a.id === account.id);
        if (index >= 0) {
          const newAccounts = [...prev];
          newAccounts[index] = account;
          return newAccounts.sort((a, b) => a.code.localeCompare(b.code));
        }
        return [account, ...prev].sort((a, b) => a.code.localeCompare(b.code));
      });
    } catch (error: any) {
      console.error('Error saving COA:', error);
      alert('Gagal menyimpan akun CoA: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteCOA = async (id: string) => {
    try {
      const { error } = await supabase.from('coa_accounts').delete().eq('id', id);
      if (error) throw error;
      setCoaAccounts(prev => prev.filter(a => a.id !== id));
    } catch (error: any) {
      console.error('Error deleting COA:', error);
      alert('Gagal menghapus akun CoA: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSaveAccountingJournal = async (journal: AccountingJournal) => {
    try {
      const { error } = await supabase.from('accounting_journals').upsert(journal);
      if (error) throw error;
      setAccountingJournals(prev => {
        const index = prev.findIndex(j => j.id === journal.id);
        if (index >= 0) {
          const newJournals = [...prev];
          newJournals[index] = journal;
          return newJournals.sort((a, b) => b.date.localeCompare(a.date));
        }
        return [journal, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      });
    } catch (error: any) {
      console.error('Error saving journal:', error);
      alert('Gagal menyimpan jurnal: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteAccountingJournal = async (id: string) => {
    try {
      const { error } = await supabase.from('accounting_journals').delete().eq('id', id);
      if (error) throw error;
      setAccountingJournals(prev => prev.filter(j => j.id !== id));
    } catch (error: any) {
      console.error('Error deleting journal:', error);
      alert('Gagal menghapus jurnal: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSaveDivision = async (division: Division) => {
    try {
      const { error } = await supabase.from('divisions').upsert(division);
      if (error) throw error;
      setDivisions(prev => {
        const index = prev.findIndex(d => d.id === division.id);
        if (index >= 0) {
          const newDivs = [...prev];
          newDivs[index] = division;
          return newDivs;
        }
        return [...prev, division];
      });
    } catch (error: any) {
      console.error('Error saving division:', error);
    }
  };

  const handleDeleteDivision = async (id: string) => {
    try {
      const { error } = await supabase.from('divisions').delete().eq('id', id);
      if (error) throw error;
      setDivisions(prev => prev.filter(d => d.id !== id));
    } catch (error: any) {
      console.error('Error deleting division:', error);
    }
  };

  const handleSavePosition = async (position: Position) => {
    try {
      const { error } = await supabase.from('positions').upsert(position);
      if (error) throw error;
      setPositions(prev => {
        const index = prev.findIndex(p => p.id === position.id);
        if (index >= 0) {
          const newPos = [...prev];
          newPos[index] = position;
          return newPos;
        }
        return [...prev, position];
      });
    } catch (error: any) {
      console.error('Error saving position:', error);
    }
  };

  const handleDeletePosition = async (id: string) => {
    try {
      const { error } = await supabase.from('positions').delete().eq('id', id);
      if (error) throw error;
      setPositions(prev => prev.filter(p => p.id !== id));
    } catch (error: any) {
      console.error('Error deleting position:', error);
    }
  };

  const handleSaveShift = async (shift: Shift) => {
    try {
      const { error } = await supabase.from('shifts').upsert(shift);
      if (error) throw error;
      setShifts(prev => {
        const index = prev.findIndex(s => s.id === shift.id);
        if (index >= 0) {
          const newShifts = [...prev];
          newShifts[index] = shift;
          return newShifts;
        }
        return [...prev, shift];
      });
    } catch (error: any) {
      console.error('Error saving shift:', error);
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!window.confirm('Hapus tipe shift ini?')) return;
    try {
      const { error } = await supabase.from('shifts').delete().eq('id', id);
      if (error) throw error;
      setShifts(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
      console.error('Error deleting shift:', error);
    }
  };

  const handleSaveShiftAssignment = async (assignment: ShiftAssignment) => {
    try {
      const { error } = await supabase.from('shift_assignments').upsert(assignment);
      if (error) throw error;
      setShiftAssignments(prev => {
        const index = prev.findIndex(a => a.id === assignment.id);
        if (index >= 0) {
          const newAssigns = [...prev];
          newAssigns[index] = assignment;
          return newAssigns;
        }
        return [...prev, assignment];
      });
    } catch (error: any) {
      console.error('Error saving shift assignment:', error);
    }
  };

  const handleDeleteShiftAssignment = async (id: string) => {
    try {
      const { error } = await supabase.from('shift_assignments').delete().eq('id', id);
      if (error) throw error;
      setShiftAssignments(prev => prev.filter(a => a.id !== id));
    } catch (error: any) {
      console.error('Error deleting shift assignment:', error);
    }
  };

  const handleSaveBranchLocation = async (location: BranchLocation) => {
    try {
      const { error } = await supabase.from('branch_locations').upsert(location);
      if (error) throw error;
      setBranchLocations(prev => {
        const index = prev.findIndex(l => l.id === location.id);
        if (index >= 0) {
          const newLocs = [...prev];
          newLocs[index] = location;
          return newLocs;
        }
        return [...prev, location];
      });
    } catch (error: any) {
      console.error('Error saving branch location:', error);
      alert('Gagal menyimpan lokasi cabang: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteBranchLocation = async (id: string) => {
    try {
      const { error } = await supabase.from('branch_locations').delete().eq('id', id);
      if (error) throw error;
      setBranchLocations(prev => prev.filter(l => l.id !== id));
    } catch (error: any) {
      console.error('Error deleting branch location:', error);
      alert('Gagal menghapus lokasi cabang: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting order:', error);
      alert('Gagal menghapus data orderan: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteAllOrders = async () => {
    try {
      const { error } = await supabase.from('orders').delete().neq('id', '0');
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting all orders:', error);
      alert('Gagal menghapus data orderan.');
    }
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const navItems = [
    { id: 'home', label: currentUserEmployee?.nama ? `Hi ${currentUserEmployee.nama.split(' ')[0]}` : 'Dashboard', icon: 'dashboard' },
    { 
      id: 'attendance', 
      label: 'Attendance', 
      icon: 'group',
      hidden: userRole === 'admin',
      subItems: [
        { id: 'attendance', label: 'List Attendance', icon: 'list_alt' },
        { id: 'selfie_attendance', label: 'Absen Selfie', icon: 'photo_camera' },
      ]
    },
    { 
      id: 'database', 
      label: 'Database', 
      icon: 'database',
      subItems: [
        { id: 'store_database', label: 'Data Toko', icon: 'storefront' },
      ]
    },
    { id: 'employee_database', label: 'Employee DB', icon: 'badge', hidden: userRole === 'admin' },
    { id: 'inbox', label: 'Inbox', icon: 'mail', hidden: userRole === 'admin' },
    { id: 'schedule', label: 'Schedule', icon: 'calendar_month', hidden: userRole === 'admin' },
    { 
      id: 'finance', 
      label: 'Finance', 
      icon: 'payments', 
      hidden: userRole === 'admin',
      subItems: [
        { id: 'finance', label: 'Summary', icon: 'dashboard' },
        { id: 'coa', label: 'Chart of Account', icon: 'account_tree' },
        { id: 'accounting', label: 'Accounting', icon: 'menu_book' },
      ]
    },
    { id: 'inventory', label: 'Inventory', icon: 'inventory_2', hidden: userRole === 'admin' },
    { id: 'production', label: 'Produksi', icon: 'https://lh3.googleusercontent.com/d/1xnGnOOO6RvjqUW4MTVx9-u7yDTE-qBxl', hidden: userRole === 'admin' },
    { id: 'client_monitor', label: 'Client Monitor', icon: 'monitor_heart', hidden: userRole === 'admin' },
    { 
      id: 'delivery', 
      label: 'Delivery', 
      icon: 'local_shipping', 
      hidden: userRole === 'admin',
      subItems: [
        { id: 'delivery', label: 'Delivery Report', icon: 'dashboard' },
        { id: 'order_database', label: 'Data Orderan', icon: 'receipt_long' },
        { id: 'print_admin', label: 'Print Admin', icon: 'print' },
        { id: 'billing_report', label: 'Billing report', icon: 'payments' },
        { id: 'piutang', label: 'Tagihan Piutang', icon: 'account_balance_wallet' },
        { id: 'penagihan_kurir', label: 'Penagihan Kurir', icon: 'account_balance_wallet' },
        { id: 'courier_cash', label: 'Kas Kurir', icon: 'payments' },
        { id: 'daily_report', label: 'Daily Report', icon: 'summarize' },
      ]
    },
    { 
      id: 'report', 
      label: 'Sales Report', 
      icon: 'assessment',
      hidden: false,
      subItems: [
        { id: 'sales_report', label: 'Sales Report', icon: 'trending_up' },
        { id: 'report_order', label: 'Order', icon: 'receipt_long' },
      ]
    },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ].filter(item => !item.hidden);

  const handlePrefillRequest = (location: string, type: 'delivery' | 'billing', courier?: string, storeId?: string) => {
    setPrefillData({ location, type, courier });
    // If we have a storeId, use it for return navigation
    if (storeId) {
      setReturnStoreId(storeId);
    } else {
      // Find store ID for the location if storeId wasn't provided
      const store = stores.find(s => s.namaToko === location);
      if (store) {
        setReturnStoreId(store.id);
      }
    }
    setActiveTab(type === 'delivery' ? 'delivery' : 'billing_report');
  };

  const handleNavigate = (tab: any, prefill?: { location: string, type: 'delivery' | 'billing', courier?: string }) => {
    if (prefill) {
      handlePrefillRequest(prefill.location, prefill.type, prefill.courier);
      return;
    }
    setReturnStoreId(null);
    if (typeof tab === 'object' && tab.tab === 'order_database' && tab.storeId) {
      setReturnStoreId(tab.storeId);
      setActiveTab('order_database');
    } else {
      setActiveTab(tab as ActiveTab);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Dashboard
            employees={employees}
            orders={orders}
            submissions={submissions}
            broadcasts={broadcasts}
            userRole={userRole}
            currentUserEmployee={currentUserEmployee}
            attendanceRecords={attendanceRecords}
            shiftAssignments={shiftAssignments}
            onNavigate={handleNavigate}
            userCompany={userCompany}
            onOpenBroadcast={() => {}}
            onOpenDrive={() => {}}
            onViewProfile={() => {}}
            shifts={shifts}
            onRefreshData={refreshData}
            branchLocations={branchLocations}
            stores={stores}
            deliveries={deliveries}
            billingReports={billingReports}
            preselectedStoreId={preselectedStoreId}
            onPreselectionHandled={() => setPreselectedStoreId(null)}
          />
        );
      case 'attendance':
      case 'selfie_attendance':
        return (
          <AttendanceModule
            employees={employees}
            records={attendanceRecords}
            onSaveRecord={handleSaveAttendanceRecord}
            onDeleteRecord={handleDeleteAttendanceRecord}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            userRole={userRole}
            currentEmployee={currentUserEmployee}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            weeklyHolidays={[]}
            company={userCompany}
            positionRates={{}}
            shifts={shifts}
            shiftAssignments={shiftAssignments}
            branchLocations={branchLocations}
            initialSelfieMode={activeTab === 'selfie_attendance'}
            onClose={() => setActiveTab('home')}
            onFinish={() => setActiveTab('attendance')}
          />
        );
      case 'store_database':
        return (
          <StoreDatabase
            stores={stores}
            onSaveStore={handleSaveStore}
            onDeleteAllStores={handleDeleteAllStores}
            company={userCompany}
            userRole={userRole}
          />
        );
      case 'order_database':
        return (
          <OrderDatabase
            orders={orders}
            stores={stores}
            employees={employees}
            onSaveOrder={handleSaveOrder}
            onDeleteOrder={handleDeleteOrder}
            onBulkSaveOrders={handleBulkSaveOrders}
            onDeleteAllOrders={handleDeleteAllOrders}
            company={userCompany}
            userRole={userRole}
            currentUserEmployee={currentUserEmployee}
            onPrefillRequest={handlePrefillRequest}
            initialSelectedStoreId={returnStoreId || undefined}
            onStoreOpened={() => setReturnStoreId(null)}
            autoOpenAddModal={autoOpenOrderModal}
          />
        );
      case 'piutang':
        return (
          <PiutangModule 
            orders={orders}
            onNavigate={handleNavigate}
            company={userCompany}
            stores={stores}
          />
        );
      case 'employee_database':
        return (
          <EmployeeDatabase
            employees={employees}
            onSaveEmployee={handleSaveEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            company={userCompany}
            divisions={divisions}
            positions={positions}
            branchLocations={branchLocations}
          />
        );
      case 'inbox':
        return (
          <Inbox
            submissions={submissions}
            onSaveSubmission={handleSaveSubmission}
            onDeleteSubmission={handleDeleteSubmission}
            employees={employees}
            userRole={userRole}
            currentEmployeeId={currentUserEmployee?.id || ''}
          />
        );
      case 'submissions':
        return (
          <SubmissionForm
            employee={currentUserEmployee}
            company={userCompany}
            onSaveSubmission={handleSaveSubmission}
            onClose={() => setActiveTab('home')}
            onSuccess={() => {
              setActiveTab('inbox');
              refreshData();
            }}
          />
        );
      case 'settings':
        return (
          <SettingsModule 
            userCompany={userCompany} 
            userEmail={userEmail} 
            userRole={userRole} 
            onRefresh={refreshData}
            onLogout={handleLogout}
            divisions={divisions}
            positions={positions}
            branchLocations={branchLocations}
            onSaveDivision={handleSaveDivision}
            onDeleteDivision={handleDeleteDivision}
            onSavePosition={handleSavePosition}
            onDeletePosition={handleDeletePosition}
            onSaveBranchLocation={handleSaveBranchLocation}
            onDeleteBranchLocation={handleDeleteBranchLocation}
          />
        );
      case 'report':
      case 'sales_report':
        return (
          <SalesReport 
            company={userCompany} 
            reports={salesReports}
            onSave={handleSaveSalesReport}
            onDelete={handleDeleteSalesReport}
            employees={employees}
            stores={stores}
            currentUser={currentUserEmployee}
            authUserId={session?.user?.id}
          />
        );
      case 'print_admin':
        return <PrintAdmin company={userCompany} orders={orders} />;
      case 'report_order':
        return <OrderReport company={userCompany} />;
      case 'client_monitor':
        return <ClientMonitor stores={stores} orders={orders} company={userCompany} />;
      case 'finance':
        return (
          <FinancialModule
            company={userCompany}
            employees={employees}
            attendanceRecords={attendanceRecords}
            onClose={() => setActiveTab('home')}
            onRefresh={refreshData}
            weeklyHolidays={[]}
            positionRates={{}}
          />
        );
      case 'coa':
        return (
          <COAModule
            accounts={coaAccounts}
            company={userCompany}
            userRole={userRole}
            onSave={handleSaveCOA}
            onDelete={handleDeleteCOA}
          />
        );
      case 'accounting':
        return (
          <AccountingModule
            journals={accountingJournals}
            accounts={coaAccounts}
            company={userCompany}
            userRole={userRole}
            onSave={handleSaveAccountingJournal}
            onDelete={handleDeleteAccountingJournal}
          />
        );
      case 'delivery':
        return (
          <DeliveryModule 
            title="Delivery Report"
            addButtonLabel="Add New Delivery"
            company={userCompany} 
            orders={orders} 
            stores={stores} 
            deliveries={deliveries}
            employees={employees}
            userRole={userRole}
            currentUserName={currentUserEmployee?.nama}
            currentUserDivision={currentUserEmployee?.division}
            onSaveDelivery={handleSaveDelivery}
            onDeleteDelivery={handleDeleteDelivery}
            onBulkDelete={handleBulkDeleteDelivery}
            onSaveOrder={handleSaveOrder}
            initialPrefillLocation={prefillData?.type === 'delivery' ? prefillData.location : undefined}
            initialPrefillCourier={prefillData?.type === 'delivery' ? prefillData.courier : undefined}
            onPrefillHandled={() => setPrefillData(null)}
            onCancel={() => {
              if (returnStoreId) {
                setPreselectedStoreId(returnStoreId);
                setActiveTab('home');
              } else {
                setActiveTab('home');
              }
            }}
          />
        );
      case 'schedule':
        return (
          <ScheduleModule
            employees={employees}
            shifts={shifts}
            shiftAssignments={shiftAssignments}
            onSaveShift={handleSaveShift}
            onDeleteShift={handleDeleteShift}
            onSaveAssignment={handleSaveShiftAssignment}
            onDeleteAssignment={handleDeleteShiftAssignment}
            userRole={userRole}
            company={userCompany}
          />
        );
      case 'daily_report':
        return (
          <DailyReportModule 
            orders={orders}
            deliveries={deliveries}
            billingReports={billingReports}
            courierCash={courierCashRecords}
            company={userCompany}
            searchQuery={searchQuery}
          />
        );
      case 'billing_report':
        return (
          <DeliveryModule 
            title="Billing Report"
            addButtonLabel="Add New Report"
            company={userCompany} 
            orders={orders} 
            stores={stores} 
            deliveries={billingReports as any}
            userRole={userRole}
            employees={employees}
            currentUserName={currentUserEmployee?.nama}
            currentUserDivision={currentUserEmployee?.division}
            onSaveDelivery={handleSaveBillingReport as any}
            onDeleteDelivery={handleDeleteBillingReport}
            onBulkDelete={handleBulkDeleteBillingReport}
            initialPrefillLocation={prefillData?.type === 'billing' ? prefillData.location : undefined}
            initialPrefillCourier={prefillData?.type === 'billing' ? prefillData.courier : undefined}
            onPrefillHandled={() => setPrefillData(null)}
            onCancel={() => {
              if (returnStoreId) {
                setPreselectedStoreId(returnStoreId);
                setActiveTab('home');
              } else {
                setActiveTab('home');
              }
            }}
          />
        );
      case 'penagihan_kurir':
        return (
          <CourierBilling 
            orders={orders}
            employees={employees}
            billingReports={billingReports}
            company={userCompany}
          />
        );
      case 'courier_cash':
        return (
          <CourierCashModule
            records={courierCashRecords}
            employees={employees}
            coaAccounts={coaAccounts}
            company={userCompany}
            userRole={userRole}
            currentUserName={currentUserEmployee?.nama}
            currentUserDivision={currentUserEmployee?.division}
            onSave={handleSaveCourierCash}
            onDelete={handleDeleteCourierCash}
          />
        );
      case 'production':
        return (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Produksi</h2>
                <p className="text-xs md:text-sm text-stone-500 font-medium">
                  Manajemen data produksi harian untuk {userCompany}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6 overflow-hidden">
                <img 
                  src="https://lh3.googleusercontent.com/d/1xnGnOOO6RvjqUW4MTVx9-u7yDTE-qBxl" 
                  alt="Produksi" 
                  className="w-12 h-12 object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-xl font-black text-stone-800 mb-2">Modul Produksi</h3>
              <p className="text-stone-500 font-medium max-w-md mx-auto">
                Modul ini sedang dalam tahap pengembangan. Segera hadir untuk membantu Anda mengelola proses produksi nasi kepal dengan lebih efisien.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-stone-400">
            <div className="text-center">
              <Icons.Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Module "{activeTab}" is under development</p>
            </div>
          </div>
        );
    }
  };

  if (!session) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <div className="bg-background text-on-surface min-h-screen font-sans overflow-x-hidden">
      {/* Missing Data Alert Modal */}
      <AnimatePresence>
        {isDataMissing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border-4 border-red-100 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-red-500">warning</span>
              </div>
              <h3 className="text-2xl font-black text-stone-800 mb-2">Data belum ada!</h3>
              <p className="text-stone-500 font-bold mb-8">Segera info ke PIC untuk pendaftaran data karyawan Anda.</p>
              <button
                onClick={async () => {
                  setIsDataMissing(false);
                  await handleLogout();
                }}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-95"
              >
                MENGERTI
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-[70] md:hidden shadow-2xl flex flex-col print:hidden"
            >
              <div className="p-6 flex items-center justify-between border-b border-stone-100">
                <button 
                  onClick={() => {
                    setActiveTab('home');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-stone-200 bg-white shadow-sm">
                    <img 
                      src="https://lh3.googleusercontent.com/d/1b-hkPOsHZ8_rW1f9aqABu7R5bw_ZJM0y" 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-left">
                    <h1 className="text-lg font-black text-orange-700 leading-tight">Sikepal</h1>
                    <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">Premium Nasi Kepal</p>
                  </div>
                </button>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-stone-400 hover:bg-stone-100 rounded-full"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {navItems.map((item) => {
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isExpanded = expandedMenus.includes(item.id);
                  const isActive = activeTab === item.id || (item.subItems?.some(sub => sub.id === activeTab));

                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        onClick={() => {
                          if (hasSubItems) {
                            toggleMenu(item.id);
                          } else {
                            setActiveTab(item.id as ActiveTab);
                            setIsMobileMenuOpen(false);
                          }
                        }}
                        className={`w-full px-4 py-3 flex items-center gap-3 rounded-2xl transition-all font-label text-sm font-medium ${
                          isActive && !hasSubItems
                            ? 'bg-orange-100 text-orange-800 font-bold shadow-sm'
                            : 'text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {item.icon.startsWith('http') ? (
                          <img 
                            src={item.icon} 
                            alt={item.label} 
                            className="w-6 h-6 object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }}>
                            {item.icon}
                          </span>
                        )}
                        <span className="flex-1 text-left">{item.label}</span>
                        {hasSubItems && (
                          <span className={`material-symbols-outlined text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        )}
                      </button>

                      {hasSubItems && isExpanded && (
                        <div className="ml-6 pl-4 border-l-2 border-orange-100 space-y-1 py-1">
                          {item.subItems.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setActiveTab(sub.id as ActiveTab);
                                setIsMobileMenuOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 flex items-center gap-3 rounded-xl transition-all text-xs font-medium ${
                                activeTab === sub.id
                                  ? 'bg-orange-50 text-orange-700 font-bold'
                                  : 'text-stone-500 hover:bg-stone-50'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {sub.icon}
                              </span>
                              <span>{sub.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-stone-100">
                <div className="bg-orange-50 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-orange-900 truncate">{userEmail}</p>
                    <p className="text-[10px] text-orange-600 font-medium uppercase">{userRole}</p>
                  </div>
                  <button onClick={handleLogout} className="text-orange-400 hover:text-orange-600">
                    <span className="material-symbols-outlined text-xl">logout</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* SideNavBar Component (Desktop) */}
      <aside className={`h-screen ${isSidebarCollapsed ? 'w-20' : 'w-64'} fixed left-0 top-0 z-50 bg-stone-50 border-r border-outline-variant/10 hidden md:block transition-all duration-300 ease-in-out print:hidden`}>
        <div className="flex flex-col gap-y-2 py-8 h-full">
          <div className={`px-6 mb-8 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <button 
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-3 overflow-hidden active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-stone-200 bg-white shadow-sm">
                <img 
                  src="https://lh3.googleusercontent.com/d/1b-hkPOsHZ8_rW1f9aqABu7R5bw_ZJM0y" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              {!isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="whitespace-nowrap text-left"
                >
                  <h1 className="text-lg font-black text-orange-700 leading-tight">Sikepal</h1>
                  <p className="text-xs text-stone-500 font-medium">Premium Nasi Kepal</p>
                </motion.div>
              )}
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-2">
            {navItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus.includes(item.id);
              const isActive = activeTab === item.id || (item.subItems?.some(sub => sub.id === activeTab));

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (hasSubItems && !isSidebarCollapsed) {
                        toggleMenu(item.id);
                      } else {
                        setActiveTab(item.id as ActiveTab);
                      }
                    }}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full px-4 py-3 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} rounded-xl transition-all font-label text-sm font-medium ${
                      isActive && !hasSubItems
                        ? 'bg-orange-100 text-orange-800 font-semibold'
                        : 'text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {item.icon.startsWith('http') ? (
                      <img 
                        src={item.icon} 
                        alt={item.label} 
                        className="w-6 h-6 object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }}>
                        {item.icon}
                      </span>
                    )}
                    {!isSidebarCollapsed && (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="whitespace-nowrap">{item.label}</span>
                        {hasSubItems && (
                          <span className={`material-symbols-outlined text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        )}
                      </div>
                    )}
                  </button>

                  {hasSubItems && isExpanded && !isSidebarCollapsed && (
                    <div className="ml-4 pl-4 border-l border-stone-200 space-y-1">
                      {item.subItems.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setActiveTab(sub.id as ActiveTab)}
                          className={`w-full px-4 py-2 flex items-center gap-3 rounded-lg transition-all text-xs font-medium ${
                            activeTab === sub.id
                              ? 'bg-orange-50 text-orange-700 font-bold'
                              : 'text-stone-500 hover:bg-stone-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {sub.icon}
                          </span>
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className={`${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} min-h-screen flex flex-col transition-all duration-300 ease-in-out print:m-0 print:p-0 print:block`}>
        {isLoading && (
          <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-bold text-stone-600">Sebentar ya</p>
            </div>
          </div>
        )}
        {/* TopNavBar Component */}
        <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-stone-100 h-16 px-4 md:px-6 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Logo */}
            <button 
              onClick={() => setActiveTab('home')}
              className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-stone-200 bg-white shadow-sm md:hidden active:scale-95 transition-transform"
            >
              <img 
                src="https://lh3.googleusercontent.com/d/1b-hkPOsHZ8_rW1f9aqABu7R5bw_ZJM0y" 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </button>
            <button 
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileMenuOpen(true);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              className="p-2 text-stone-500 hover:bg-stone-100 rounded-xl transition-colors hidden md:block"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
            >
              <span className="material-symbols-outlined">
                {window.innerWidth < 768 ? 'menu' : (isSidebarCollapsed ? 'menu' : 'menu_open')}
              </span>
            </button>
            <h2 className={`font-headline text-lg md:text-xl font-black tracking-tight text-stone-900 capitalize ${activeTab === 'home' ? 'hidden md:block' : ''}`}>
              {activeTab === 'home' ? `Hi ${currentUserEmployee?.nama || 'User'}` : activeTab.replace('_', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden sm:flex items-center bg-stone-100 rounded-full px-4 py-1.5 gap-2 border border-outline-variant/20 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-stone-400 text-sm">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-32 lg:w-48 font-body"
                placeholder="Search..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border-2 border-orange-100 bg-white shadow-sm flex items-center justify-center">
                <img
                  alt="User Profile"
                  src="https://lh3.googleusercontent.com/d/1b-hkPOsHZ8_rW1f9aqABu7R5bw_ZJM0y"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-stone-100 px-2 py-2 flex justify-around items-center md:hidden z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {[
          { id: 'home', icon: 'home', label: currentUserEmployee?.nama ? `Hi ${currentUserEmployee.nama.split(' ')[0]}` : 'Home' },
          { id: 'quick_menu', icon: 'apps', label: 'Menu' },
          { id: 'inbox', icon: 'inbox', label: 'Inbox' }
        ].map((item) => {
          const isActive = item.id === 'quick_menu' ? isMobileQuickMenuOpen : (activeTab === item.id || (item.id === 'attendance' && activeTab === 'list_attendance'));
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'quick_menu') {
                  setIsMobileQuickMenuOpen(!isMobileQuickMenuOpen);
                } else {
                  setActiveTab(item.id as ActiveTab);
                  setIsMobileQuickMenuOpen(false);
                }
              }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                isActive ? 'text-orange-700' : 'text-stone-400'
              }`}
            >
              <div className={`w-12 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-orange-100' : 'bg-transparent'}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }}>
                  {item.icon}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Menu Popup (Mobile) */}
      <AnimatePresence>
        {isMobileQuickMenuOpen && (
          <div className="fixed inset-0 z-[49] md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileQuickMenuOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-[72px] left-4 right-4 bg-white rounded-[32px] p-6 shadow-2xl border border-stone-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-stone-800 uppercase tracking-widest text-sm">Quick Menu</h3>
                <button 
                  onClick={() => setIsMobileQuickMenuOpen(false)}
                  className="p-2 text-stone-400 hover:bg-stone-100 rounded-full"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'selfie_attendance', label: 'Absen Selfie', icon: 'photo_camera', color: 'bg-orange-500' },
                  { id: 'order_database', label: 'Data Orderan', icon: 'receipt_long', color: 'bg-emerald-500' },
                  { id: 'delivery', label: 'Delivery Report', icon: 'local_shipping', color: 'bg-blue-500' },
                  { id: 'billing_report', label: 'Billing Report', icon: 'payments', color: 'bg-purple-500' },
                  { id: 'sales_report', label: 'Sales Report', icon: 'trending_up', color: 'bg-stone-500' },
                  { id: 'production', label: 'Produksi', icon: 'inventory', color: 'bg-orange-100', isImage: true, imageUrl: 'https://lh3.googleusercontent.com/d/1xnGnOOO6RvjqUW4MTVx9-u7yDTE-qBxl' }
                ].filter(menu => {
                  if (currentUserEmployee?.division?.toLowerCase() === 'kurir') {
                    return !['sales_report', 'production'].includes(menu.id);
                  }
                  return true;
                }).map((menu) => (
                  <button
                    key={menu.id}
                    onClick={() => {
                      setActiveTab(menu.id as ActiveTab);
                      setIsMobileQuickMenuOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${menu.color} flex items-center justify-center text-white shadow-lg`}>
                      {menu.isImage ? (
                        <img 
                          src={menu.imageUrl} 
                          alt={menu.label} 
                          className="w-8 h-8 object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-2xl">{menu.icon}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-black text-stone-700 uppercase tracking-tight text-center leading-tight">
                      {menu.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
