import React, { useState } from 'react';
import { Employee, UserRole, Division, Position, BranchLocation } from '../types';

interface EmployeeFormProps {
  employees: Employee[];
  initialData: Employee | null;
  userRole: UserRole;
  userCompany: string;
  currentUserEmployee: Employee | null;
  onSave: (emp: Partial<Employee>) => void;
  onSaveAndOnboard: (emp: Partial<Employee>) => void;
  onCancel: () => void;
  divisions: Division[];
  positions: Position[];
  branchLocations: BranchLocation[];
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ initialData, userCompany, onSave, onCancel, divisions, positions, branchLocations }) => {
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
          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-stone-100 border-4 border-stone-200 shadow-inner flex items-center justify-center">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-stone-400 text-5xl">person</span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all border-4 border-white">
                <span className="material-symbols-outlined text-xl">photo_camera</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, photo_url: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Profile Photo</p>
          </div>

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
              <select
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.jabatan}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
              >
                <option value="">Select Position</option>
                {positions?.map(pos => (
                  <option key={pos.id} value={pos.name}>{pos.name}</option>
                ))}
              </select>
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
                {divisions?.map(div => (
                  <option key={div.id} value={div.name}>{div.name}</option>
                ))}
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

            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-600">Maps (Absence Location)</label>
              <select
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.branchLocationId || ''}
                onChange={(e) => setFormData({ ...formData, branchLocationId: e.target.value || null })}
              >
                <option value="">Select Location</option>
                {branchLocations?.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.namaCabang} ({loc.kodeCabang})</option>
                ))}
              </select>
              <p className="text-[10px] text-stone-400 font-medium ml-1 italic">Karyawan hanya bisa absen di lokasi ini</p>
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
