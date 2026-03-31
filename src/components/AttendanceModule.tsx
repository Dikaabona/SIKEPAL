import React, { useState, useRef, useEffect } from 'react';
import { Employee, AttendanceRecord, UserRole, Shift } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AttendanceModuleProps {
  employees: Employee[];
  records: AttendanceRecord[];
  onSaveRecord: (record: AttendanceRecord) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userRole: UserRole;
  currentEmployee: Employee | null;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  weeklyHolidays: any;
  company: string;
  positionRates: any;
  shifts: Shift[];
  shiftAssignments: any[];
  initialSelfieMode?: boolean;
}

const AttendanceModule: React.FC<AttendanceModuleProps> = ({ employees, records, onSaveRecord, searchQuery, setSearchQuery, currentEmployee, company, initialSelfieMode }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const filteredEmployees = employees.filter(emp => 
    emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.jabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.division.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-container-highest/30 p-4 rounded-xl">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select className="appearance-none bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-2 pr-10 text-sm font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer">
              <option>Today, Oct 24</option>
              <option>Yesterday</option>
              <option>Last 7 Days</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-stone-400 pointer-events-none text-sm">calendar_today</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center bg-white rounded-lg px-3 py-1.5 gap-2 border border-outline-variant/20 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <span className="material-symbols-outlined text-stone-400 text-sm">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm w-48 font-body" 
              placeholder="Search staff..." 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 text-primary font-bold text-sm px-4 py-2 hover:bg-primary/5 rounded-lg transition-colors border border-primary/20">
            <span className="material-symbols-outlined text-lg">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider font-label">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider font-label">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider font-label">Clock In</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider font-label">Clock Out</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider font-label text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider font-label text-center">Selfie</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredEmployees.map((emp) => {
                const record = records.find(r => r.employeeId === emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-stone-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-200 overflow-hidden">
                          <img
                            alt={emp.nama}
                            src={`https://picsum.photos/seed/${emp.nama}/100/100`}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-on-surface">{emp.nama}</p>
                          <p className="text-xs text-stone-400 font-medium">{emp.jabatan}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        emp.division === 'Kitchen' ? 'bg-tertiary-container/30 text-on-tertiary-fixed-variant' :
                        emp.division === 'Logistics' ? 'bg-secondary-container text-on-secondary-container' :
                        'bg-stone-100 text-stone-500'
                      }`}>
                        {emp.division}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-primary">login</span>
                        <span className="text-sm font-medium">{record?.clockIn || '--:--'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-orange-500">logout</span>
                        <span className="text-sm font-medium text-stone-400">{record?.clockOut || '--:--'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                          record?.status === 'Hadir' ? 'bg-green-100 text-green-700' :
                          record?.status === 'Alpa' ? 'bg-red-50 text-error' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {record?.status || 'Not Checked In'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {record?.photoIn ? (
                          <button 
                            onClick={() => setSelectedPhoto(record.photoIn!)}
                            className="w-10 h-10 rounded-lg overflow-hidden border-2 border-primary/20 hover:border-primary transition-all shadow-sm"
                            title="View Clock In Photo"
                          >
                            <img src={record.photoIn} alt="In" className="w-full h-full object-cover scale-x-[-1]" />
                          </button>
                        ) : null}
                        {record?.photoOut ? (
                          <button 
                            onClick={() => setSelectedPhoto(record.photoOut!)}
                            className="w-10 h-10 rounded-lg overflow-hidden border-2 border-orange-200 hover:border-orange-500 transition-all shadow-sm"
                            title="View Clock Out Photo"
                          >
                            <img src={record.photoOut} alt="Out" className="w-full h-full object-cover scale-x-[-1]" />
                          </button>
                        ) : null}
                        {!record?.photoIn && !record?.photoOut && (
                          <div className="w-10 h-10 rounded-lg bg-stone-50 border border-dashed border-stone-200 flex items-center justify-center text-stone-300">
                            <span className="material-symbols-outlined text-sm">no_photography</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-stone-300 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-stone-50/30 flex justify-between items-center">
          <p className="text-xs text-stone-500 font-medium font-body">Showing {filteredEmployees.length} of {employees.length} staff members</p>
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-stone-400 hover:bg-white hover:text-primary transition-all">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold text-xs">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-stone-600 font-medium text-xs hover:bg-white transition-all">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 text-stone-400 hover:bg-white hover:text-primary transition-all">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Photo Preview Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-lg w-full aspect-square rounded-3xl overflow-hidden border-8 border-white/10 shadow-2xl"
            >
              <img src={selectedPhoto} alt="Attendance Selfie" className="w-full h-full object-cover scale-x-[-1]" />
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors backdrop-blur-sm"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceModule;
