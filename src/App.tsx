import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import StoreDatabase from './components/StoreDatabase';
import OrderDatabase from './components/OrderDatabase';
import { ActiveTab, Employee, AttendanceRecord, Submission, Broadcast, LiveSchedule, Shift, ShiftAssignment, Store, Order, UserRole, DeliveryRecord, BillingRecord } from './types';
import { Icons, DEFAULT_SHIFTS } from './constants';
import Dashboard from './components/Dashboard';
import AttendanceModule from './components/AttendanceModule';
import EmployeeForm from './components/EmployeeForm';
import Inbox from './components/Inbox';
import AbsenModule from './components/AbsenModule';
import SettingsModule from './components/SettingsModule';
import ShiftModule from './components/ShiftModule';
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
import DeliveryModule from './components/DeliveryModule';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['attendance', 'database', 'report']);
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [liveSchedules, setLiveSchedules] = useState<LiveSchedule[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [billingReports, setBillingReports] = useState<BillingRecord[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('owner');
  const [userCompany, setUserCompany] = useState('Sikepal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState<Session | null>(null);
  const [prefillData, setPrefillData] = useState<{ location: string; type: 'delivery' | 'billing' } | null>(null);

  const userEmail = session?.user?.email || 'muhammadmahardhikadib@gmail.com';
  const currentUserEmployee = employees.find(e => e.email === userEmail) || employees[0] || null;

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

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Employees
        const { data: empData, error: empError } = await supabase.from('employees').select('*');
        if (empError) throw empError;
        if (empData && empData.length === 0) {
          await supabase.from('employees').upsert(MOCK_EMPLOYEES);
          setEmployees(MOCK_EMPLOYEES);
        } else if (empData) {
          setEmployees(empData);
        }

        // Attendance
        const { data: attData, error: attError } = await supabase.from('attendance').select('*');
        if (attError) throw attError;
        if (attData && attData.length === 0) {
          // Only upsert mock if employees table has the IDs 1 and 2 to avoid FK error
          const { data: validEmps } = await supabase.from('employees').select('id').in('id', ['1', '2']);
          if (validEmps && validEmps.length >= 2) {
            await supabase.from('attendance').upsert(MOCK_ATTENDANCE);
            setAttendanceRecords(MOCK_ATTENDANCE);
          }
        } else if (attData) {
          setAttendanceRecords(attData);
        }

        // Submissions
        const { data: subData, error: subError } = await supabase.from('submissions').select('*');
        if (subError) throw subError;
        if (subData && subData.length === 0) {
          // Only upsert mock if employees table has the IDs 1 and 2 to avoid FK error
          const { data: validEmps } = await supabase.from('employees').select('id').in('id', ['1', '2']);
          if (validEmps && validEmps.length >= 2) {
            await supabase.from('submissions').upsert(MOCK_SUBMISSIONS);
            setSubmissions(MOCK_SUBMISSIONS);
          }
        } else if (subData) {
          setSubmissions(subData);
        }

        // Shifts
        const { data: shiftData, error: shiftError } = await supabase.from('shifts').select('*');
        if (shiftError) throw shiftError;
        if (shiftData && shiftData.length === 0) {
          await supabase.from('shifts').upsert(DEFAULT_SHIFTS);
          setShifts(DEFAULT_SHIFTS);
        } else if (shiftData) {
          setShifts(shiftData);
        }

        // Shift Assignments
        const { data: assignData, error: assignError } = await supabase.from('shift_assignments').select('*');
        if (assignError) throw assignError;
        if (assignData) setShiftAssignments(assignData);

        // Stores
        const { data: storeData, error: storeError } = await supabase.from('stores').select('*');
        if (storeError) throw storeError;
        if (storeData) setStores(storeData);

        // Orders
        const { data: orderData, error: orderError } = await supabase.from('orders').select('*');
        if (orderError) throw orderError;
        if (orderData) setOrders(orderData);

        // Deliveries
        const { data: deliveryData, error: deliveryError } = await supabase.from('deliveries').select('*').order('createdAt', { ascending: false });
        if (deliveryError) throw deliveryError;
        if (deliveryData) {
          setDeliveries(deliveryData);
        }

        // Billing Reports
        const { data: billingData, error: billingError } = await supabase.from('billing_reports').select('*').order('createdAt', { ascending: false });
        if (billingError) {
          // If table doesn't exist yet, we'll just set an empty array
          console.warn('Billing reports table might not exist yet:', billingError.message);
          setBillingReports([]);
        } else if (billingData) {
          setBillingReports(billingData);
        }

      } catch (err) {
        handleSupabaseError(err, 'fetch', 'all');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const channels = [
      supabase.channel('employees').on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchData).subscribe(),
      supabase.channel('attendance').on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchData).subscribe(),
      supabase.channel('submissions').on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, fetchData).subscribe(),
      supabase.channel('shifts').on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, fetchData).subscribe(),
      supabase.channel('shift_assignments').on('postgres_changes', { event: '*', schema: 'public', table: 'shift_assignments' }, fetchData).subscribe(),
      supabase.channel('stores').on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, fetchData).subscribe(),
      supabase.channel('orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData).subscribe(),
      supabase.channel('deliveries').on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, fetchData).subscribe(),
      supabase.channel('billing_reports').on('postgres_changes', { event: '*', schema: 'public', table: 'billing_reports' }, fetchData).subscribe(),
    ];

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

  const handleSaveAttendanceRecord = async (record: AttendanceRecord) => {
    try {
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
      const { error } = await supabase.from('orders').upsert(order);
      if (error) throw error;
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Gagal menyimpan data orderan. Pastikan Supabase sudah dikonfigurasi.');
    }
  };

  const handleSaveDelivery = async (delivery: DeliveryRecord) => {
    try {
      console.log('Saving delivery to Supabase:', delivery);
      const { error } = await supabase.from('deliveries').upsert(delivery);
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

  const handleSaveBillingReport = async (report: BillingRecord) => {
    try {
      console.log('Saving billing report to Supabase:', report);
      const { error } = await supabase.from('billing_reports').upsert(report);
      if (error) throw error;
      
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
    } catch (error: any) {
      console.error('Error saving billing report:', error);
      alert('Gagal menyimpan billing report: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteBillingReport = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data billing report ini?')) return;
    
    try {
      console.log('Deleting billing report from Supabase:', id);
      const { error } = await supabase.from('billing_reports').delete().eq('id', id);
      if (error) throw error;
      
      setBillingReports(prev => prev.filter(r => r.id !== id));
      console.log('Billing report deleted successfully');
    } catch (error: any) {
      console.error('Error deleting billing report:', error);
      alert('Gagal menghapus billing report: ' + (error.message || 'Unknown error'));
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
    { id: 'home', label: 'Dashboard', icon: 'dashboard' },
    { 
      id: 'attendance', 
      label: 'Attendance', 
      icon: 'group',
      hidden: userRole === 'admin' || userRole === 'kurir',
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
    { id: 'employee_database', label: 'Employee DB', icon: 'badge', hidden: userRole === 'admin' || userRole === 'kurir' },
    { id: 'inbox', label: 'Inbox', icon: 'mail', hidden: userRole === 'admin' || userRole === 'kurir' },
    { id: 'schedule', label: 'Schedule', icon: 'calendar_month', hidden: userRole === 'admin' || userRole === 'kurir' },
    { id: 'finance', label: 'Finance', icon: 'payments', hidden: userRole === 'admin' || userRole === 'kurir' },
    { id: 'inventory', label: 'Inventory', icon: 'inventory_2', hidden: userRole === 'admin' || userRole === 'kurir' },
    { 
      id: 'delivery', 
      label: 'Delivery', 
      icon: 'local_shipping', 
      hidden: userRole === 'admin' || userRole === 'kurir',
      subItems: [
        { id: 'delivery', label: 'Delivery Report', icon: 'dashboard' },
        { id: 'order_database', label: 'Data Orderan', icon: 'receipt_long' },
        { id: 'print_admin', label: 'Print Admin', icon: 'print' },
        { id: 'billing_report', label: 'Billing report', icon: 'payments' },
      ]
    },
    { 
      id: 'report', 
      label: 'Sales Report', 
      icon: 'assessment',
      hidden: userRole === 'kurir',
      subItems: [
        { id: 'sales_report', label: 'Sales Report', icon: 'trending_up' },
        { id: 'report_order', label: 'Order', icon: 'receipt_long' },
      ]
    },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ].filter(item => !item.hidden);

  const handlePrefillRequest = (location: string, type: 'delivery' | 'billing') => {
    setPrefillData({ location, type });
    setActiveTab(type === 'delivery' ? 'delivery' : 'billing_report');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Dashboard
            employees={employees}
            submissions={submissions}
            broadcasts={broadcasts}
            userRole={userRole}
            currentUserEmployee={currentUserEmployee}
            attendanceRecords={attendanceRecords}
            shiftAssignments={shiftAssignments}
            onNavigate={setActiveTab}
            userCompany={userCompany}
            onOpenBroadcast={() => {}}
            onOpenDrive={() => {}}
            onViewProfile={() => {}}
            shifts={shifts}
            onRefreshData={refreshData}
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
            onSaveOrder={handleSaveOrder}
            onDeleteAllOrders={handleDeleteAllOrders}
            company={userCompany}
            userRole={userRole}
            onPrefillRequest={handlePrefillRequest}
          />
        );
      case 'employee_database':
        return (
          <EmployeeDatabase
            employees={employees}
            onSaveEmployee={handleSaveEmployee}
            company={userCompany}
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
          />
        );
      case 'report':
      case 'sales_report':
        return <SalesReport company={userCompany} />;
      case 'print_admin':
        return <PrintAdmin company={userCompany} orders={orders} />;
      case 'report_order':
        return <OrderReport company={userCompany} />;
      case 'delivery':
        return (
          <DeliveryModule 
            title="Delivery Report"
            addButtonLabel="Add New Delivery"
            company={userCompany} 
            orders={orders} 
            stores={stores} 
            deliveries={deliveries}
            userRole={userRole}
            onSaveDelivery={handleSaveDelivery}
            onDeleteDelivery={handleDeleteDelivery}
            initialPrefillLocation={prefillData?.type === 'delivery' ? prefillData.location : undefined}
            onPrefillHandled={() => setPrefillData(null)}
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
            onSaveDelivery={handleSaveBillingReport as any}
            onDeleteDelivery={handleDeleteBillingReport}
            initialPrefillLocation={prefillData?.type === 'billing' ? prefillData.location : undefined}
            onPrefillHandled={() => setPrefillData(null)}
          />
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-stone-200 bg-white shadow-sm">
                    <img 
                      src="https://lh3.googleusercontent.com/d/1b-hkPOsHZ8_rW1f9aqABu7R5bw_ZJM0y" 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-orange-700 leading-tight">Sikepal</h1>
                    <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">Premium Nasi Kepal</p>
                  </div>
                </div>
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
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }}>
                          {item.icon}
                        </span>
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
            <div className="flex items-center gap-3 overflow-hidden">
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
                  className="whitespace-nowrap"
                >
                  <h1 className="text-lg font-black text-orange-700 leading-tight">Sikepal</h1>
                  <p className="text-xs text-stone-500 font-medium">Premium Nasi Kepal</p>
                </motion.div>
              )}
            </div>
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
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }}>
                      {item.icon}
                    </span>
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
              <p className="font-bold text-stone-600">Connecting to Supabase...</p>
            </div>
          </div>
        )}
        {/* TopNavBar Component */}
        <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-stone-100 h-16 px-4 md:px-6 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 md:gap-4">
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
            <h2 className="font-headline text-lg md:text-xl font-black tracking-tight text-stone-900 capitalize">
              {activeTab.replace('_', ' ')}
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
            <div className="flex items-center gap-2">
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
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'attendance', icon: 'how_to_reg', label: 'Absen' },
          { id: 'inbox', icon: 'inbox', label: 'Inbox' }
        ].map((item) => {
          const isActive = activeTab === item.id || (item.id === 'attendance' && activeTab === 'list_attendance');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
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

    </div>
  );
}
