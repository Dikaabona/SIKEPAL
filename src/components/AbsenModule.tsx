import React, { useState, useEffect } from 'react';
import { Employee, AttendanceRecord } from '../types';

interface AbsenModuleProps {
  employee: Employee | null;
  attendanceRecords: AttendanceRecord[];
  company: string;
  onSuccess: () => void;
  onClose: () => void;
}

const AbsenModule: React.FC<AbsenModuleProps> = ({ employee, attendanceRecords, onClose }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceRecords.find(r => r.employeeId === employee?.id && r.date === today);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen p-8 bg-stone-50/50 backdrop-blur-md flex flex-col items-center justify-center relative">
      <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-stone-200 rounded-full transition-colors">
        <span className="material-symbols-outlined">close</span>
      </button>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-5xl font-black tracking-tight text-stone-900">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</h2>
          <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-outline-variant/10 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
          
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-stone-100 overflow-hidden border-4 border-white shadow-lg">
              <img
                alt={employee?.nama}
                src={`https://picsum.photos/seed/${employee?.nama}/200/200`}
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-2xl font-black text-stone-900">{employee?.nama}</h3>
              <p className="text-sm text-stone-400 font-bold uppercase tracking-wider">{employee?.jabatan}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-50 p-4 rounded-3xl text-center">
              <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Clock In</p>
              <p className="text-lg font-black text-primary">{todayRecord?.clockIn || '--:--'}</p>
            </div>
            <div className="bg-stone-50 p-4 rounded-3xl text-center">
              <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Clock Out</p>
              <p className="text-lg font-black text-stone-400">{todayRecord?.clockOut || '--:--'}</p>
            </div>
          </div>

          <div className="space-y-4">
            {!todayRecord?.clockIn ? (
              <button
                className="w-full bg-primary text-on-primary font-black py-6 rounded-3xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-3xl">login</span>
                CLOCK IN NOW
              </button>
            ) : !todayRecord?.clockOut ? (
              <button
                className="w-full bg-stone-900 text-white font-black py-6 rounded-3xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-3xl">logout</span>
                CLOCK OUT NOW
              </button>
            ) : (
              <div className="bg-green-50 p-6 rounded-3xl text-center border border-green-100">
                <span className="material-symbols-outlined text-green-500 text-4xl mb-2">check_circle</span>
                <p className="text-green-700 font-bold">Attendance Completed</p>
                <p className="text-xs text-green-600/70">See you tomorrow!</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 justify-center text-stone-400">
          <span className="material-symbols-outlined text-sm">location_on</span>
          <p className="text-xs font-bold uppercase tracking-widest">Oishii Kitchen (Main Branch)</p>
        </div>
      </div>
    </div>
  );
};

export default AbsenModule;
