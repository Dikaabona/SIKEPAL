import React, { useState } from 'react';
import { UserRole, Division, Position, BranchLocation } from '../types';
import MapPicker from './MapPicker';

interface SettingsModuleProps {
  userRole: UserRole;
  userCompany: string;
  userEmail?: string;
  onRefresh: () => void;
  onLogout: () => void;
  divisions: Division[];
  positions: Position[];
  branchLocations: BranchLocation[];
  onSaveDivision: (division: Division) => Promise<void>;
  onDeleteDivision: (id: string) => Promise<void>;
  onSavePosition: (position: Position) => Promise<void>;
  onDeletePosition: (id: string) => Promise<void>;
  onSaveBranchLocation: (location: BranchLocation) => Promise<void>;
  onDeleteBranchLocation: (id: string) => Promise<void>;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  userCompany, 
  userEmail, 
  userRole, 
  onLogout,
  divisions,
  positions,
  branchLocations,
  onSaveDivision,
  onDeleteDivision,
  onSavePosition,
  onDeletePosition,
  onSaveBranchLocation,
  onDeleteBranchLocation
}) => {
  const [newDivision, setNewDivision] = useState('');
  const [newPosition, setNewPosition] = useState('');

  // Branch Location Form State
  const [branchForm, setBranchForm] = useState<Partial<BranchLocation>>({
    kodeCabang: '',
    namaCabang: '',
    alamatCabang: '',
    teleponCabang: '',
    radius: 100,
    latitude: -6.2088,
    longitude: 106.8456,
    company: userCompany
  });

  const handleAddDivision = async () => {
    if (!newDivision.trim()) return;
    await onSaveDivision({
      id: crypto.randomUUID(),
      name: newDivision.trim(),
      company: userCompany
    });
    setNewDivision('');
  };

  const handleAddPosition = async () => {
    if (!newPosition.trim()) return;
    await onSavePosition({
      id: crypto.randomUUID(),
      name: newPosition.trim(),
      company: userCompany
    });
    setNewPosition('');
  };

  const handleSaveBranch = async () => {
    if (!branchForm.kodeCabang || !branchForm.namaCabang) {
      alert('Kode Cabang dan Nama Cabang harus diisi.');
      return;
    }
    await onSaveBranchLocation({
      id: branchForm.id || crypto.randomUUID(),
      kodeCabang: branchForm.kodeCabang!,
      namaCabang: branchForm.namaCabang!,
      alamatCabang: branchForm.alamatCabang || '',
      teleponCabang: branchForm.teleponCabang || '',
      radius: branchForm.radius || 100,
      latitude: branchForm.latitude || -6.2088,
      longitude: branchForm.longitude || 106.8456,
      company: userCompany
    });
    // Reset form
    setBranchForm({
      kodeCabang: '',
      namaCabang: '',
      alamatCabang: '',
      teleponCabang: '',
      radius: 100,
      latitude: -6.2088,
      longitude: 106.8456,
      company: userCompany
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">

      {/* MAPS Configuration Section */}
      <section className="bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">map</span>
          MAPS Configuration
        </h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Kode Cabang *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">tag</span>
                <input 
                  type="text"
                  value={branchForm.kodeCabang}
                  onChange={(e) => setBranchForm({...branchForm, kodeCabang: e.target.value})}
                  placeholder="Contoh: TSM (Maksimal 3 karakter)"
                  maxLength={3}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nama Cabang *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">edit</span>
                <input 
                  type="text"
                  value={branchForm.namaCabang}
                  onChange={(e) => setBranchForm({...branchForm, namaCabang: e.target.value})}
                  placeholder="Contoh: TASIKMALAYA"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Alamat Cabang *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">location_on</span>
              <input 
                type="text"
                value={branchForm.alamatCabang}
                onChange={(e) => setBranchForm({...branchForm, alamatCabang: e.target.value})}
                placeholder="Contoh: Jln. Perintis Kemerdekaan No. 80"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Telepon Cabang *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">call</span>
                <input 
                  type="text"
                  value={branchForm.teleponCabang}
                  onChange={(e) => setBranchForm({...branchForm, teleponCabang: e.target.value})}
                  placeholder="Contoh: 0265311766"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Radius Verifikasi (Meter)</label>
                <span className="px-3 py-1 bg-stone-100 text-stone-900 text-[10px] font-black rounded-lg">{branchForm.radius}m</span>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <input 
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={branchForm.radius}
                  onChange={(e) => setBranchForm({...branchForm, radius: parseInt(e.target.value)})}
                  className="flex-1 h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Pilih Lokasi di Peta</label>
            <MapPicker 
              lat={branchForm.latitude || -6.2088} 
              lng={branchForm.longitude || 106.8456} 
              radius={branchForm.radius || 100}
              onChange={(lat, lng) => setBranchForm({...branchForm, latitude: lat, longitude: lng})}
            />
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSaveBranch}
              className="px-8 py-3 bg-stone-900 text-white font-bold rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined">save</span>
              Simpan Lokasi Cabang
            </button>
          </div>

          {/* List of Branch Locations */}
          {branchLocations?.length > 0 && (
            <div className="mt-8 space-y-4">
              <h4 className="text-sm font-black text-stone-400 uppercase tracking-widest ml-1">Daftar Cabang Terdaftar</h4>
              <div className="grid grid-cols-1 gap-4">
                {branchLocations?.map(loc => (
                  <div key={loc.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-stone-200 text-primary font-black">
                        {loc.kodeCabang}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">{loc.namaCabang}</p>
                        <p className="text-[10px] text-stone-500 font-medium">{loc.alamatCabang}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setBranchForm(loc)}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-200 text-stone-400 hover:text-primary transition-all flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button 
                        onClick={() => onDeleteBranchLocation(loc.id)}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-200 text-stone-400 hover:text-red-600 transition-all flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">corporate_fare</span>
          Organization Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Divisions Management */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-stone-400 uppercase tracking-widest">Divisi</h4>
            <div className="flex gap-2">
              <input 
                type="text"
                value={newDivision}
                onChange={(e) => setNewDivision(e.target.value)}
                placeholder="Tambah divisi baru..."
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button 
                onClick={handleAddDivision}
                className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {divisions?.map(div => (
                <div key={div.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100 group">
                  <span className="text-sm font-bold text-stone-700">{div.name}</span>
                  <button 
                    onClick={() => onDeleteDivision(div.id)}
                    className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
              {divisions.length === 0 && <p className="text-xs text-stone-400 italic">Belum ada divisi.</p>}
            </div>
          </div>

          {/* Positions Management */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-stone-400 uppercase tracking-widest">Posisi / Jabatan</h4>
            <div className="flex gap-2">
              <input 
                type="text"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                placeholder="Tambah posisi baru..."
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button 
                onClick={handleAddPosition}
                className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {positions?.map(pos => (
                <div key={pos.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100 group">
                  <span className="text-sm font-bold text-stone-700">{pos.name}</span>
                  <button 
                    onClick={() => onDeletePosition(pos.id)}
                    className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
              {positions.length === 0 && <p className="text-xs text-stone-400 italic">Belum ada posisi.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">security</span>
          System Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
            <div>
              <p className="font-bold text-stone-900">Enable Geolocation</p>
              <p className="text-xs text-stone-500 font-medium">Require staff to share location during check-in</p>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
            <div>
              <p className="font-bold text-stone-900">Auto-Approval</p>
              <p className="text-xs text-stone-500 font-medium">Automatically approve leave requests under 2 days</p>
            </div>
            <div className="w-12 h-6 bg-stone-200 rounded-full relative cursor-pointer">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-600">
          <span className="material-symbols-outlined">logout</span>
          Account Actions
        </h3>
        <div className="p-4 bg-red-50 rounded-2xl flex items-center justify-between">
          <div>
            <p className="font-bold text-red-900">Logout</p>
            <p className="text-xs text-red-500 font-medium">Sign out of your account on this device</p>
          </div>
          <button 
            onClick={onLogout}
            className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95"
          >
            Keluar
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <button className="px-8 py-4 bg-primary text-on-primary font-bold rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all">
          Save All Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsModule;
