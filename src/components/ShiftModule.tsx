import React from 'react';
import { Employee, ShiftAssignment, UserRole, Shift } from '../types';

interface ShiftModuleProps {
  employees: Employee[];
  assignments: ShiftAssignment[];
  setAssignments: any;
  userRole: UserRole;
  company: string;
  onClose: () => void;
  globalShifts: Shift[];
  onRefreshShifts: () => void;
  onDeleteShift: (id: string) => void;
}

const ShiftModule: React.FC<ShiftModuleProps> = ({ globalShifts, onClose, onDeleteShift }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-stone-900 uppercase">Shift Management</h2>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-6 py-3 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all">Back</button>
          <button className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">
            <span className="material-symbols-outlined">add</span>
            Create New Shift
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {globalShifts.map((shift) => (
          <div key={shift.id} className="bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">schedule</span>
              </div>
              <button 
                onClick={() => onDeleteShift(shift.id)}
                className="text-stone-300 hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Shift Name</label>
                <input
                  readOnly
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl px-3 py-2 text-sm font-bold"
                  type="text"
                  value={shift.name}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Start Time</label>
                  <input
                    readOnly
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl px-3 py-2 text-sm font-bold"
                    type="time"
                    value={shift.startTime}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">End Time</label>
                  <input
                    readOnly
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl px-3 py-2 text-sm font-bold"
                    type="time"
                    value={shift.endTime}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-50">
                <div className="flex items-center justify-between text-xs font-medium text-stone-500">
                  <span>Duration</span>
                  <span className="text-stone-900 font-bold">8 Hours</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShiftModule;
