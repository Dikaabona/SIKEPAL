import React, { useState } from 'react';
import { Employee, UserRole, Division, Position, BranchLocation } from '../types';
import EmployeeForm from './EmployeeForm';

interface EmployeeDatabaseProps {
  employees: Employee[];
  onSaveEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  company: string;
  divisions: Division[];
  positions: Position[];
  branchLocations: BranchLocation[];
}

const EmployeeDatabase: React.FC<EmployeeDatabaseProps> = ({ 
  employees, 
  onSaveEmployee, 
  onDeleteEmployee, 
  company,
  divisions,
  positions,
  branchLocations
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSave = (emp: Partial<Employee>) => {
    if (editingEmployee) {
      onSaveEmployee({ ...editingEmployee, ...emp } as Employee);
    } else {
      const newEmp: Employee = {
        ...emp as Employee,
        id: crypto.randomUUID(),
      };
      onSaveEmployee(newEmp);
    }
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const handleRoleChange = (emp: Employee, newRole: UserRole) => {
    onSaveEmployee({ ...emp, role: newRole });
  };

  const filteredEmployees = employees.filter(emp => 
    emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.idKaryawan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.jabatan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-stone-900 uppercase">Employee Database</h2>
          <p className="text-sm text-stone-500 font-medium">Manage employee profiles and system roles</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-sm">search</span>
            <input 
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all w-64"
            />
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Add Employee
          </button>
        </div>
      </div>

      {/* Role Explanation Section */}
      <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">info</span>
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Panduan Role & Akses</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-xs font-black text-stone-900 uppercase">Owner</span>
            </div>
            <p className="text-[10px] text-stone-500 leading-relaxed font-medium">
              Akses penuh ke seluruh fitur sistem tanpa batasan, termasuk pengaturan keuangan dan hapus data massal.
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-xs font-black text-stone-900 uppercase">Admin</span>
            </div>
            <p className="text-[10px] text-stone-500 leading-relaxed font-medium">
              Akses ke menu Database (Toko & Order) dan Laporan Penjualan. Dibatasi dari menu Absensi, Karyawan, dan Keuangan.
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span className="text-xs font-black text-stone-900 uppercase">Kurir</span>
            </div>
            <p className="text-[10px] text-stone-500 leading-relaxed font-medium">
              Akses lihat (view-only) menu Database. Tidak dapat menambah, mengedit, atau menghapus data toko/orderan.
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-stone-400"></span>
              <span className="text-xs font-black text-stone-900 uppercase">Employee</span>
            </div>
            <p className="text-[10px] text-stone-500 leading-relaxed font-medium">
              Akses standar untuk fitur operasional dasar seperti absensi dan pengajuan izin/lembur.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">ID & Division</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">System Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200 flex items-center justify-center">
                        {emp.photo_url ? (
                          <img
                            alt={emp.nama}
                            src={emp.photo_url}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-stone-400 text-xl">person</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-black text-stone-900 leading-none mb-1">{emp.nama}</div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{emp.jabatan}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-stone-700 mb-1">{emp.idKaryawan}</div>
                    <div className="text-[10px] text-stone-400 font-medium">{emp.division}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={emp.role}
                      onChange={(e) => handleRoleChange(emp, e.target.value as UserRole)}
                      className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border-2 transition-all outline-none cursor-pointer ${
                        emp.role === 'owner' ? 'border-primary bg-primary/5 text-primary' :
                        emp.role === 'admin' ? 'border-blue-500 bg-blue-50 text-blue-600' :
                        emp.role === 'kurir' ? 'border-orange-500 bg-orange-50 text-orange-600' :
                        'border-stone-200 bg-stone-50 text-stone-500'
                      }`}
                    >
                      <option value="employee">Employee</option>
                      <option value="kurir">Kurir</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setEditingEmployee(emp); setIsFormOpen(true); }}
                        className="w-8 h-8 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${emp.nama}?`)) {
                            onDeleteEmployee(emp.id);
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-stone-100">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200 shadow-sm flex items-center justify-center">
                    {emp.photo_url ? (
                      <img
                        alt={emp.nama}
                        src={emp.photo_url}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-stone-400 text-2xl">person</span>
                    )}
                  </div>
                  <div>
                    <div className="text-base font-black text-stone-900 leading-tight">{emp.nama}</div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{emp.jabatan}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditingEmployee(emp); setIsFormOpen(true); }}
                    className="w-9 h-9 rounded-xl bg-stone-50 text-stone-400 flex items-center justify-center border border-stone-100"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${emp.nama}?`)) {
                        onDeleteEmployee(emp.id);
                      }
                    }}
                    className="w-9 h-9 rounded-xl bg-red-50 text-red-400 flex items-center justify-center border border-red-100"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">ID Karyawan</span>
                  <span className="text-sm font-bold text-stone-800">{emp.idKaryawan}</span>
                </div>
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">Division</span>
                  <span className="text-sm font-bold text-stone-800">{emp.division}</span>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">System Role</span>
                <select 
                  value={emp.role}
                  onChange={(e) => handleRoleChange(emp, e.target.value as UserRole)}
                  className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border-2 transition-all outline-none cursor-pointer ${
                    emp.role === 'owner' ? 'border-primary bg-white text-primary' :
                    emp.role === 'admin' ? 'border-blue-500 bg-white text-blue-600' :
                    emp.role === 'kurir' ? 'border-orange-500 bg-white text-orange-600' :
                    'border-stone-200 bg-white text-stone-500'
                  }`}
                >
                  <option value="employee">Employee</option>
                  <option value="kurir">Kurir</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="px-6 py-12 text-center text-stone-400">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">person_search</span>
            <p className="text-sm font-medium">No employees found</p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <EmployeeForm
          employees={employees}
          initialData={editingEmployee}
          userRole="owner"
          userCompany={company}
          currentUserEmployee={null}
          onSave={handleSave}
          onSaveAndOnboard={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditingEmployee(null); }}
          divisions={divisions}
          positions={positions}
          branchLocations={branchLocations}
        />
      )}
    </div>
  );
};

export default EmployeeDatabase;
