import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-orange-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />

      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 p-3 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full transition-all shadow-sm z-10 active:scale-90"
      >
        <span className="material-symbols-outlined text-stone-500">close</span>
      </button>

      <div className="max-w-md w-full space-y-6 md:space-y-8 relative z-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-1"
        >
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-stone-900 tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </h2>
          <p className="text-orange-600 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 md:p-10 rounded-[40px] border border-orange-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] space-y-6 md:space-y-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-amber-400"></div>
          
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-[32px] bg-stone-100 overflow-hidden border-4 border-white shadow-xl rotate-3 transform transition-transform hover:rotate-0">
              <img
                alt={employee?.nama}
                src={`https://picsum.photos/seed/${employee?.nama}/200/200`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-2xl font-black text-stone-900 leading-tight">{employee?.nama}</h3>
              <div className="inline-block px-3 py-1 bg-orange-50 rounded-full mt-1">
                <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest">{employee?.jabatan}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-stone-50/50 p-4 rounded-3xl text-center border border-stone-100">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Clock In</p>
              <p className="text-xl font-black text-orange-600">{todayRecord?.clockIn || '--:--'}</p>
            </div>
            <div className="bg-stone-50/50 p-4 rounded-3xl text-center border border-stone-100">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Clock Out</p>
              <p className="text-xl font-black text-stone-300">{todayRecord?.clockOut || '--:--'}</p>
            </div>
          </div>

          <div className="space-y-4">
            {!todayRecord?.clockIn ? (
              <button
                className="w-full bg-orange-600 text-white font-black py-5 md:py-6 rounded-3xl shadow-xl shadow-orange-200 hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl">login</span>
                  <span className="tracking-widest">CLOCK IN NOW</span>
                </div>
                <span className="text-[10px] opacity-70 font-bold uppercase tracking-wider">Start your shift</span>
              </button>
            ) : !todayRecord?.clockOut ? (
              <button
                className="w-full bg-stone-900 text-white font-black py-5 md:py-6 rounded-3xl shadow-xl shadow-stone-200 hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl">logout</span>
                  <span className="tracking-widest">CLOCK OUT NOW</span>
                </div>
                <span className="text-[10px] opacity-70 font-bold uppercase tracking-wider">Finish for today</span>
              </button>
            ) : (
              <div className="bg-green-50 p-6 rounded-3xl text-center border border-green-100 animate-in fade-in zoom-in duration-500">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                </div>
                <p className="text-green-800 font-black uppercase tracking-widest text-sm">Attendance Done!</p>
                <p className="text-xs text-green-600 font-bold mt-1">See you tomorrow, {employee?.nama?.split(' ')[0]}!</p>
              </div>
            )}
          </div>
        </motion.div>

        <div className="flex items-center gap-2 justify-center text-stone-400">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-stone-100">
            <span className="material-symbols-outlined text-sm text-orange-500">location_on</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Oishii Kitchen (Main Branch)</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AbsenModule;
