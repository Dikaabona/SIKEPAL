import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { ActiveTab, Employee, AttendanceRecord, Submission, Broadcast, LiveSchedule, Shift, ShiftAssignment } from './types';
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
import LiveScheduleModule from './components/LiveScheduleModule';
import LiveMapModule from './components/LiveMapModule';
import FinancialModule from './components/FinancialModule';
import RecruitmentModule from './components/RecruitmentModule';
import { InvoiceModule } from './components/InvoiceModule';
import { AdvertisingModule } from './components/AdvertisingModule';
import SalesReport from './components/SalesReport';

// Mock Data
const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    idKaryawan: 'EMP001',
    nama: 'Elena Rodriguez',
    email: 'elena@sikepal.com',
    company: 'Sikepal',
    role: 'super',
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
    role: 'super',
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
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['attendance']);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [liveSchedules, setLiveSchedules] = useState<LiveSchedule[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
  const [userRole, setUserRole] = useState<'super' | 'admin' | 'employee'>('super');
  const [userCompany, setUserCompany] = useState('Sikepal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const userEmail = 'muhammadmahardhikadib@gmail.com';
  const currentUserEmployee = employees.find(e => e.email === userEmail) || employees[0] || null;

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Employees
        const { data: empData, error: empError } = await supabase.from('employees').select('*');
        if (empError) throw empError;
        
        if (empData && empData.length > 0) {
          setEmployees(empData);
        } else {
          // Seed initial data if empty
          const { data: seededEmp, error: seedError } = await supabase.from('employees').insert(MOCK_EMPLOYEES).select();
          if (!seedError && seededEmp) setEmployees(seededEmp);
        }

        // Fetch Attendance
        const { data: attData, error: attError } = await supabase.from('attendance').select('*');
        if (attError) throw attError;
        if (attData && attData.length > 0) {
          setAttendanceRecords(attData);
        } else {
          const { data: seededAtt, error: seedAttError } = await supabase.from('attendance').insert(MOCK_ATTENDANCE).select();
          if (!seedAttError && seededAtt) setAttendanceRecords(seededAtt);
        }

        // Fetch Submissions
        const { data: subData, error: subError } = await supabase.from('submissions').select('*');
        if (subError) throw subError;
        if (subData && subData.length > 0) {
          setSubmissions(subData);
        } else {
          const { data: seededSub, error: seedSubError } = await supabase.from('submissions').insert(MOCK_SUBMISSIONS).select();
          if (!seedSubError && seededSub) setSubmissions(seededSub);
        }

        // Fetch Shifts
        const { data: shiftData, error: shiftError } = await supabase.from('shifts').select('*');
        if (shiftError) throw shiftError;
        if (shiftData && shiftData.length > 0) {
          setShifts(shiftData);
        } else {
          const { data: seededShifts, error: seedShiftError } = await supabase.from('shifts').insert(DEFAULT_SHIFTS).select();
          if (!seedShiftError && seededShifts) setShifts(seededShifts);
        }

        // Fetch Shift Assignments
        const { data: assignData, error: assignError } = await supabase.from('shift_assignments').select('*');
        if (assignError) throw assignError;
        setShiftAssignments(assignData || []);

      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const empSubscription = supabase.channel('employees_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, payload => {
      if (payload.eventType === 'INSERT') setEmployees(prev => [...prev, payload.new as Employee]);
      if (payload.eventType === 'UPDATE') setEmployees(prev => prev.map(e => e.id === payload.new.id ? payload.new as Employee : e));
      if (payload.eventType === 'DELETE') setEmployees(prev => prev.filter(e => e.id !== payload.old.id));
    }).subscribe();

    const attSubscription = supabase.channel('attendance_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, payload => {
      if (payload.eventType === 'INSERT') setAttendanceRecords(prev => [...prev, payload.new as AttendanceRecord]);
      if (payload.eventType === 'UPDATE') setAttendanceRecords(prev => prev.map(r => r.id === payload.new.id ? payload.new as AttendanceRecord : r));
      if (payload.eventType === 'DELETE') setAttendanceRecords(prev => prev.filter(r => r.id !== payload.old.id));
    }).subscribe();

    const subSubscription = supabase.channel('submissions_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, payload => {
      if (payload.eventType === 'INSERT') setSubmissions(prev => [...prev, payload.new as Submission]);
      if (payload.eventType === 'UPDATE') setSubmissions(prev => prev.map(s => s.id === payload.new.id ? payload.new as Submission : s));
      if (payload.eventType === 'DELETE') setSubmissions(prev => prev.filter(s => s.id !== payload.old.id));
    }).subscribe();

    return () => {
      supabase.removeChannel(empSubscription);
      supabase.removeChannel(attSubscription);
      supabase.removeChannel(subSubscription);
    };
  }, []);

  const refreshData = () => {
    // Re-fetch logic if needed
    console.log('Refreshing data from Supabase...');
  };

  const handleSaveEmployee = async (employee: Employee) => {
    try {
      const { error } = await supabase.from('employees').upsert(employee);
      if (error) throw error;
      // State will be updated via real-time subscription
    } catch (error) {
      console.error('Error saving employee:', error);
      // Fallback: update local state if subscription fails or is slow
      setEmployees(prev => {
        const exists = prev.find(e => e.id === employee.id);
        if (exists) return prev.map(e => e.id === employee.id ? employee : e);
        return [...prev, employee];
      });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting employee:', error);
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleSaveAttendanceRecord = async (record: AttendanceRecord) => {
    try {
      const { error } = await supabase.from('attendance').upsert(record);
      if (error) throw error;
    } catch (error) {
      console.error('Error saving attendance:', error);
      setAttendanceRecords(prev => {
        const exists = prev.find(r => r.id === record.id);
        if (exists) return prev.map(r => r.id === record.id ? record : r);
        return [...prev, record];
      });
    }
  };

  const handleSaveSubmission = async (submission: Submission) => {
    try {
      const { error } = await supabase.from('submissions').upsert(submission);
      if (error) throw error;
    } catch (error) {
      console.error('Error saving submission:', error);
      setSubmissions(prev => {
        const exists = prev.find(s => s.id === submission.id);
        if (exists) return prev.map(s => s.id === submission.id ? submission : s);
        return [...prev, submission];
      });
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
      subItems: [
        { id: 'attendance', label: 'List Attendance', icon: 'list_alt' },
        { id: 'selfie_attendance', label: 'Absen Selfie', icon: 'photo_camera' },
      ]
    },
    { id: 'database', label: 'Employee DB', icon: 'database' },
    { id: 'inbox', label: 'Inbox', icon: 'mail' },
    { id: 'schedule', label: 'Schedule', icon: 'calendar_month' },
    { id: 'finance', label: 'Finance', icon: 'payments' },
    { id: 'inventory', label: 'Inventory', icon: 'inventory_2' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

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
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            userRole={userRole}
            currentEmployee={currentUserEmployee}
            startDate={new Date().toISOString().split('T')[0]}
            endDate={new Date().toISOString().split('T')[0]}
            onStartDateChange={() => {}}
            onEndDateChange={() => {}}
            weeklyHolidays={[]}
            company={userCompany}
            positionRates={{}}
            shifts={shifts}
            shiftAssignments={shiftAssignments}
            initialSelfieMode={activeTab === 'selfie_attendance'}
          />
        );
      case 'database':
        return (
          <EmployeeDatabase
            employees={employees}
            onSaveEmployee={handleSaveEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            company={userCompany}
          />
        );
      case 'inbox':
        return (
          <Inbox
            submissions={submissions}
            onSaveSubmission={handleSaveSubmission}
            employees={employees}
            userRole={userRole}
            currentEmployeeId={currentUserEmployee?.id || ''}
          />
        );
      case 'settings':
        return <SettingsModule userCompany={userCompany} userEmail={userEmail} userRole={userRole} />;
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

  return (
    <div className="bg-background text-on-surface min-h-screen font-sans">
      {/* SideNavBar Component */}
      <aside className={`h-screen ${isSidebarCollapsed ? 'w-20' : 'w-64'} fixed left-0 top-0 z-50 bg-stone-50 border-r border-outline-variant/10 hidden md:block transition-all duration-300 ease-in-out`}>
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

      <main className={`${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} min-h-screen flex flex-col transition-all duration-300 ease-in-out`}>
        {isLoading && (
          <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-bold text-stone-600">Connecting to Supabase...</p>
            </div>
          </div>
        )}
        {/* TopNavBar Component */}
        <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-stone-100 h-16 px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
            >
              <span className="material-symbols-outlined">
                {isSidebarCollapsed ? 'menu' : 'menu_open'}
              </span>
            </button>
            <h2 className="font-headline text-xl font-bold tracking-tight text-stone-900 capitalize">
              {activeTab.replace('_', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-stone-100 rounded-full px-4 py-1.5 gap-2 border border-outline-variant/20 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-stone-400 text-sm">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-48 font-body"
                placeholder="Search..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-stone-500 hover:bg-orange-50 rounded-full transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
              </button>
              <div className="w-8 h-8 rounded-full overflow-hidden ml-2 border border-stone-200 bg-white shadow-sm flex items-center justify-center">
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

        <div className="flex-1 p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* FAB Action (Mobile) */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-90 transition-transform md:hidden z-50">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}
