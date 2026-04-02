import React, { useState } from 'react';
import { Employee, UserRole } from '../types';

interface EmployeeFormProps {
  employees: Employee[];
  initialData: Employee | null;
  userRole: UserRole;
  userCompany: string;
  currentUserEmployee: Employee | null;
  onSave: (emp: Partial<Employee>) => void;
  onSaveAndOnboard: (emp: Partial<Employee>) => void;
  onCancel: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ initialData, userCompany, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Employee>>(initialData || {
    nama: '',
    email: '',
    jabatan: '',
    division: '',
    role: 'employee',
    company: userCompany,
    tanggalMasuk: new Date().toISOString().split('T')[0],
    idKaryawan: '',
    hutang: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black tracking-tight text-stone-900">{initialData ? 'Edit Employee' : 'Register New Employee'}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-600">Full Name</label>
              <input
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-600">Employee ID</label>
              <input
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                type="text"
                value={formData.idKaryawan}
                onChange={(e) => setFormData({ ...formData, idKaryawan: e.target.value })}
                placeholder="e.g. EMP001"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-600">Email Address</label>
              <input
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. john@oishii.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-600">Position / Jabatan</label>
              <input
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                type="text"
                value={formData.jabatan}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                placeholder="e.g. Head Chef"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-600">Division</label>
              <select
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
              >
                <option value="">Select Division</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Logistics">Logistics</option>
                <option value="Front Desk">Front Desk</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-600">System Role</label>
              <select
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <option value="employee">Employee</option>
                <option value="kurir">Kurir</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-600">Join Date</label>
              <input
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                type="date"
                value={formData.tanggalMasuk}
                onChange={(e) => setFormData({ ...formData, tanggalMasuk: e.target.value })}
              />
            </div>
          </div>
          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-stone-100 text-stone-600 font-bold py-4 rounded-xl hover:bg-stone-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] bg-primary text-on-primary font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              {initialData ? 'Update Employee' : 'Register Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
