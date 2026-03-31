import React from 'react';
import { Employee } from '../types';

interface AnnouncementModalProps {
  employees: Employee[];
  company: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">Pengumuman</h2>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl">Tutup</button>
      </div>
    </div>
  );
};

export default AnnouncementModal;
