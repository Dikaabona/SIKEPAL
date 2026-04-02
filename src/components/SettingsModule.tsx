import React from 'react';
import { UserRole } from '../types';

interface SettingsModuleProps {
  userRole: UserRole;
  userCompany: string;
  userEmail?: string;
  onRefresh: () => void;
  onLogout: () => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ userCompany, userEmail, userRole, onLogout }) => {
  return (
    <div className="space-y-8 max-w-4xl">

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
