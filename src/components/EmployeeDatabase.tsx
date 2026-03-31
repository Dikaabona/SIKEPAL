import React, { useState } from 'react';
import { Employee } from '../types';
import EmployeeForm from './EmployeeForm';

interface EmployeeDatabaseProps {
  employees: Employee[];
  onSaveEmployee: (emp: Employee) => void;
  company: string;
}

const EmployeeDatabase: React.FC<EmployeeDatabaseProps> = ({ employees, onSaveEmployee, company }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const handleSave = (emp: Partial<Employee>) => {
    if (editingEmployee) {
      onSaveEmployee({ ...editingEmployee, ...emp } as Employee);
    } else {
      const newEmp: Employee = {
        ...emp as Employee,
        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      };
      onSaveEmployee(newEmp);
    }
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-stone-900 uppercase">Employee Database</h2>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">person_add</span>
          Add New Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => (
          <div key={emp.id} className="bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden shrink-0">
                <img
                  alt={emp.nama}
                  src={`https://picsum.photos/seed/${emp.nama}/200/200`}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900 leading-tight">{emp.nama}</h3>
                <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">{emp.jabatan}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-stone-500">
                <span className="material-symbols-outlined text-sm">mail</span>
                <span className="text-xs font-medium">{emp.email}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-500">
                <span className="material-symbols-outlined text-sm">badge</span>
                <span className="text-xs font-medium">ID: {emp.idKaryawan}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-500">
                <span className="material-symbols-outlined text-sm">apartment</span>
                <span className="text-xs font-medium">{emp.division}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Joined {new Date(emp.tanggalMasuk).toLocaleDateString()}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                emp.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-stone-100 text-stone-500'
              }`}>
                {emp.role}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <EmployeeForm
          employees={employees}
          initialData={editingEmployee}
          userRole="super"
          userCompany={company}
          currentUserEmployee={null}
          onSave={handleSave}
          onSaveAndOnboard={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditingEmployee(null); }}
        />
      )}
    </div>
  );
};

export default EmployeeDatabase;
