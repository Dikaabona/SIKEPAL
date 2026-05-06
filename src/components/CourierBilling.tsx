import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Order, Employee, Store, BillingRecord } from '../types';
import { getLocalDateString } from '../lib/utils';

interface CourierBillingProps {
  orders: Order[];
  employees: Employee[];
  billingReports: BillingRecord[];
  company: string;
  currentUserEmployee?: Employee | null;
  onSync?: () => Promise<void>;
  onUpdateRecord?: (id: string, updates: Partial<BillingRecord>) => Promise<void>;
  onDeleteRecord?: (id: string) => Promise<void>;
  onDuplicateRecord?: (id: string, newDate: string) => Promise<void>;
}

const CourierBilling: React.FC<CourierBillingProps> = ({ 
  orders, 
  employees, 
  billingReports, 
  company, 
  currentUserEmployee,
  onSync,
  onUpdateRecord,
  onDeleteRecord,
  onDuplicateRecord
}) => {
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);
  const [duplicateDate, setDuplicateDate] = useState(getLocalDateString());
  const [isSaving, setIsSaving] = useState(false);

  const filteredReports = useMemo(() => {
    return billingReports.filter(report => {
      // Only show records from spreadsheet or synced ones
      const isFromSpreadsheet = report.source === 'spreadsheet' || report.id.startsWith('sync_') || report.source === 'manual';
      if (!isFromSpreadsheet) return false;

      // Filter for Kurir division
      const isKurir = currentUserEmployee?.division?.toUpperCase() === 'KURIR' || 
                      currentUserEmployee?.jabatan?.toUpperCase() === 'KURIR';
      
      if (isKurir && currentUserEmployee?.nama) {
        if (report.namaKurir !== currentUserEmployee.nama) return false;
      }

      const reportDate = report.tanggal;
      const matchesDate = reportDate >= startDate && reportDate <= endDate;
      const matchesSearch = report.namaKurir.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           report.namaLokasi.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDate && matchesSearch;
    }).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [billingReports, startDate, endDate, searchQuery]);

  // Paginated data
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredReports.slice(startIndex, startIndex + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredReports.length / pageSize);

  const handleSync = async () => {
    if (!onSync) return;
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEdit = (record: BillingRecord) => {
    setSelectedRecord({ ...record });
    setIsEditModalOpen(true);
  };

  const handleDuplicate = (record: BillingRecord) => {
    setSelectedRecord(record);
    setDuplicateDate(getLocalDateString());
    setIsDuplicateModalOpen(true);
  };

  const confirmDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      if (onDeleteRecord) {
        await onDeleteRecord(id);
      }
    }
  };

  const saveEdit = async () => {
    if (!selectedRecord || !onUpdateRecord) return;
    setIsSaving(true);
    try {
      await onUpdateRecord(selectedRecord.id, selectedRecord);
      setIsEditModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDuplicate = async () => {
    if (!selectedRecord || !onDuplicateRecord) return;
    setIsSaving(true);
    try {
      await onDuplicateRecord(selectedRecord.id, duplicateDate);
      setIsDuplicateModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Penagihan Kurir</h2>
          <p className="text-xs md:text-sm text-stone-500 font-medium">
            Monitor penagihan dan setoran kurir untuk {company}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isSyncing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">sync</span>
            )}
            Sinkronisasi
          </button>

          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl p-1 shadow-sm">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold text-stone-600 focus:outline-none bg-transparent"
            />
            <span className="text-stone-300">/</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold text-stone-600 focus:outline-none bg-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl p-1 shadow-sm">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Show:</span>
            <select 
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-stone-600 bg-transparent pr-2 focus:outline-none"
            >
              {[10, 30, 50, 100, 500].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari kurir atau lokasi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full md:w-64 transition-all"
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-sm">search</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">Nama Kurir</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">Lokasi Penagihan</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {paginatedReports.length > 0 ? (
                paginatedReports.map((report) => (
                  <tr key={report.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-stone-600">{report.tanggal}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-xs uppercase">
                          {report.namaKurir.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-stone-800">{report.namaKurir}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-stone-800">{report.namaLokasi}</span>
                        {report.keterangan && (
                          <span className="text-[10px] text-stone-400 font-medium">{report.keterangan}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(report)}
                          className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDuplicate(report)}
                          className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                          title="Duplikat"
                        >
                          <span className="material-symbols-outlined text-[18px]">content_copy</span>
                        </button>
                        <button 
                          onClick={() => confirmDelete(report.id)}
                          className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                          title="Hapus"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-stone-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">payments</span>
                    <p className="text-sm font-medium">Tidak ada data penagihan pada periode ini</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-50 bg-stone-50/30 flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 disabled:opacity-20 transition-all"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Simple pagination logic to only show some pages if many
                if (totalPages > 5 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                  if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-stone-300">...</span>;
                  return null;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-full text-[10px] font-black uppercase transition-all ${
                      currentPage === page 
                        ? 'bg-stone-900 text-white shadow-md' 
                        : 'text-stone-400 hover:bg-stone-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 disabled:opacity-20 transition-all"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-stone-50 bg-stone-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-stone-900 uppercase">Edit Data Penagihan</h3>
                <p className="text-xs text-stone-500 font-medium tracking-widest uppercase">ID: {selectedRecord.id.slice(-6)}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Tanggal</label>
                  <input 
                    type="date"
                    value={selectedRecord.tanggal}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, tanggal: e.target.value })}
                    className="w-full px-5 py-4 rounded-[24px] bg-stone-50 border border-stone-100 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Nama Kurir</label>
                  <select 
                    value={selectedRecord.namaKurir}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, namaKurir: e.target.value })}
                    className="w-full px-5 py-4 rounded-[24px] bg-stone-50 border border-stone-100 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  >
                    <option value="">Pilih Kurir</option>
                    {employees.filter(e => e.division === 'Kurir' || e.jabatan?.toLowerCase().includes('kurir')).map(e => (
                      <option key={e.id} value={e.nama}>{e.nama}</option>
                    ))}
                    {!employees.some(e => e.nama === selectedRecord.namaKurir) && (
                      <option value={selectedRecord.namaKurir}>{selectedRecord.namaKurir}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Lokasi Penagihan</label>
                  <input 
                    type="text"
                    value={selectedRecord.namaLokasi}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, namaLokasi: e.target.value })}
                    className="w-full px-5 py-4 rounded-[24px] bg-stone-50 border border-stone-100 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Keterangan</label>
                  <textarea 
                    value={selectedRecord.keterangan || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, keterangan: e.target.value })}
                    rows={3}
                    className="w-full px-5 py-4 rounded-[24px] bg-stone-50 border border-stone-100 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                    placeholder="Contoh: Titipan barang, barang rusak, dll"
                  />
                </div>
              </div>

              <button
                onClick={saveEdit}
                disabled={isSaving}
                className="w-full py-4 bg-stone-900 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 flex items-center justify-center gap-2"
              >
                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">save</span>}
                Simpan Perubahan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Duplicate Modal */}
      {isDuplicateModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-stone-50 bg-stone-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-stone-900 uppercase">Duplikat Data</h3>
                <p className="text-xs text-stone-500 font-medium tracking-widest uppercase">Target Lokasi: {selectedRecord.namaLokasi}</p>
              </div>
              <button onClick={() => setIsDuplicateModalOpen(false)} className="w-10 h-10 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Pilih Tanggal Baru</label>
                <input 
                  type="date"
                  value={duplicateDate}
                  onChange={(e) => setDuplicateDate(e.target.value)}
                  className="w-full px-5 py-4 rounded-[24px] bg-stone-50 border border-stone-100 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                />
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <p className="text-[10px] font-bold text-stone-500 leading-relaxed uppercase tracking-tight">
                  Sistem akan membuat salinan data dengan kurir <span className="text-stone-900">{selectedRecord.namaKurir}</span> di lokasi <span className="text-stone-900">{selectedRecord.namaLokasi}</span> untuk tanggal yang Anda pilih.
                </p>
              </div>

              <button
                onClick={confirmDuplicate}
                disabled={isSaving}
                className="w-full py-4 bg-emerald-600 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
              >
                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">content_copy</span>}
                Duplikat Sekarang
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CourierBilling;
