import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, Shift, ShiftAssignment, UserRole } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ScheduleModuleProps {
  employees: Employee[];
  shifts: Shift[];
  shiftAssignments: ShiftAssignment[];
  onSaveShift: (shift: Shift) => Promise<void>;
  onDeleteShift: (id: string) => Promise<void>;
  onSaveAssignment: (assignment: ShiftAssignment) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
  userRole: UserRole;
  company: string;
}

const ScheduleModule: React.FC<ScheduleModuleProps> = ({
  employees,
  shifts,
  shiftAssignments,
  onSaveShift,
  onDeleteShift,
  onSaveAssignment,
  onDeleteAssignment,
  userRole,
  company
}) => {
  const [activeTab, setActiveTab] = useState<'lihat' | 'kelola'>('kelola');
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [newShift, setNewShift] = useState<Partial<Shift>>({
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    color: '#3b82f6'
  });

  const handleAddShift = async () => {
    if (!newShift.name) return;
    const shift: Shift = {
      id: Math.random().toString(36).substr(2, 9),
      name: newShift.name,
      startTime: newShift.startTime || '08:00',
      endTime: newShift.endTime || '17:00',
      color: newShift.color || '#3b82f6',
      company
    };
    await onSaveShift(shift);
    setIsAddShiftModalOpen(false);
    setNewShift({ name: '', startTime: '08:00', endTime: '17:00', color: '#3b82f6' });
  };

  const handleAssignShift = async (employeeId: string, shiftId: string) => {
    const existing = shiftAssignments.find(a => a.employeeId === employeeId && a.date === selectedDate);
    if (existing) {
      if (shiftId === 'none') {
        await onDeleteAssignment(existing.id);
      } else {
        await onSaveAssignment({ ...existing, shiftId });
      }
    } else if (shiftId !== 'none') {
      const assignment: ShiftAssignment = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId,
        company,
        date: selectedDate,
        shiftId
      };
      await onSaveAssignment(assignment);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-stone-900 uppercase">Jadwal Shift</h1>
          <p className="text-stone-500 font-medium uppercase tracking-widest text-xs mt-1">Manajemen Waktu Kerja Karyawan</p>
        </div>
        
        <div className="flex bg-stone-100 p-1.5 rounded-2xl w-full md:w-auto shadow-inner">
          <button
            onClick={() => setActiveTab('lihat')}
            className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'lihat' 
                ? 'bg-white text-stone-900 shadow-md' 
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Lihat Jadwal
          </button>
          <button
            onClick={() => setActiveTab('kelola')}
            className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'kelola' 
                ? 'bg-white text-stone-900 shadow-md' 
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Kelola Shift
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'kelola' ? (
          <motion.div
            key="kelola"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-stone-900 uppercase">Daftar Tipe Shift</h2>
              <button
                onClick={() => setIsAddShiftModalOpen(true)}
                className="bg-[#0f172a] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                Tambah Tipe
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shifts.map((shift, index) => (
                <div 
                  key={shift.id} 
                  className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
                >
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1.5" 
                    style={{ backgroundColor: shift.color || '#3b82f6' }}
                  />
                  
                  <div className="flex justify-between items-start mb-8">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Nama Shift</label>
                      <div className="text-lg font-black text-stone-900 uppercase">{shift.name}</div>
                    </div>
                    <button 
                      onClick={() => onDeleteShift(shift.id)}
                      className="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Mulai</label>
                      <div className="bg-stone-50 p-4 rounded-2xl flex items-center justify-between border border-stone-100">
                        <span className="font-black text-stone-900">{shift.startTime.replace(':', '.')}</span>
                        <span className="material-symbols-outlined text-stone-300 text-lg">schedule</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Selesai</label>
                      <div className="bg-stone-50 p-4 rounded-2xl flex items-center justify-between border border-stone-100">
                        <span className="font-black text-stone-900">{shift.endTime.replace(':', '.')}</span>
                        <span className="material-symbols-outlined text-stone-300 text-lg">schedule</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="lihat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-stone-600">calendar_month</span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-stone-900 uppercase">Jadwal Harian</h2>
                  <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">
                    {format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: id })}
                  </p>
                </div>
              </div>
              
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-stone-100 border-none rounded-2xl px-6 py-3 font-black text-stone-900 focus:ring-2 focus:ring-stone-200 transition-all outline-none"
              />
            </div>

            <div className="bg-white rounded-[40px] border border-stone-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/50 border-b border-stone-100">
                    <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Karyawan</th>
                    <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Jabatan</th>
                    <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Shift Terpasang</th>
                    <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {employees.filter(e => e.company === company).map((employee) => {
                    const assignment = shiftAssignments.find(a => a.employeeId === employee.id && a.date === selectedDate);
                    const currentShift = shifts.find(s => s.id === assignment?.shiftId);
                    
                    return (
                      <tr key={employee.id} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center font-black text-stone-400 text-xs">
                              {employee.nama.charAt(0)}
                            </div>
                            <div>
                              <div className="font-black text-stone-900 uppercase text-sm">{employee.nama}</div>
                              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{employee.idKaryawan}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 rounded-lg bg-stone-100 text-stone-600 text-[10px] font-black uppercase tracking-wider">
                            {employee.jabatan}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          {currentShift ? (
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentShift.color }} />
                              <div className="font-black text-stone-900 text-xs uppercase tracking-wider">
                                {currentShift.name} ({currentShift.startTime} - {currentShift.endTime})
                              </div>
                            </div>
                          ) : (
                            <span className="text-stone-300 font-bold text-xs uppercase tracking-wider italic">Belum Diatur</span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <select
                            value={assignment?.shiftId || 'none'}
                            onChange={(e) => handleAssignShift(employee.id, e.target.value)}
                            className="bg-stone-100 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider text-stone-600 outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                          >
                            <option value="none">Pilih Shift</option>
                            {shifts.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Shift Modal */}
      <AnimatePresence>
        {isAddShiftModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-stone-100"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-stone-900 uppercase tracking-tight">Tambah Tipe Shift</h3>
                <button onClick={() => setIsAddShiftModalOpen(false)} className="text-stone-400 hover:text-stone-900 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Nama Shift</label>
                  <input
                    type="text"
                    value={newShift.name}
                    onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                    placeholder="Contoh: Shift Pagi"
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-6 py-4 font-bold text-stone-900 outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Waktu Mulai</label>
                    <input
                      type="time"
                      value={newShift.startTime}
                      onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-6 py-4 font-bold text-stone-900 outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Waktu Selesai</label>
                    <input
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-6 py-4 font-bold text-stone-900 outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Warna Label</label>
                  <div className="flex gap-3">
                    {['#3b82f6', '#f59e0b', '#6366f1', '#ef4444', '#10b981', '#8b5cf6'].map(color => (
                      <button
                        key={color}
                        onClick={() => setNewShift({ ...newShift, color })}
                        className={`w-10 h-10 rounded-xl transition-all ${newShift.color === color ? 'ring-4 ring-stone-100 scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddShift}
                  className="w-full bg-stone-900 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-stone-800 active:scale-[0.98] transition-all mt-4"
                >
                  Simpan Tipe Shift
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScheduleModule;
