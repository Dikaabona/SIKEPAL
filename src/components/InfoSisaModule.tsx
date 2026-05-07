import React, { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { InfoSisaRecord, Employee, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { getLocalDateString, getPaginationRange, parseIndoDate } from '../lib/utils';

interface InfoSisaModuleProps {
  records: InfoSisaRecord[];
  employees: Employee[];
  company: string;
  userRole: UserRole;
  currentUserName?: string;
  currentUserDivision?: string;
  onSave: (record: InfoSisaRecord) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
}

const InfoSisaModule: React.FC<InfoSisaModuleProps> = ({ 
  records, 
  employees, 
  company, 
  userRole,
  currentUserName,
  currentUserDivision,
  onSave, 
  onDelete,
  onBulkDelete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [filterKurir, setFilterKurir] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<InfoSisaRecord>>({
    tanggal: getLocalDateString(),
    namaKurir: currentUserDivision?.toLowerCase() === 'kurir' ? currentUserName : '',
    tanggalNota: getLocalDateString(),
    keteranganSisa: ''
  });

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => {
        const matchesCompany = r.company === company;
        
        // SECURITY: If kurir, ONLY see own data
        if (currentUserDivision?.toLowerCase() === 'kurir' && r.namaKurir !== currentUserName) {
          return false;
        }

        const matchesDate = r.tanggal >= startDate && r.tanggal <= endDate;
        const matchesKurir = !filterKurir || r.namaKurir === filterKurir;
        const matchesSearch = !searchQuery || 
          r.namaKurir.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.keteranganSisa.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCompany && matchesDate && matchesKurir && matchesSearch;
      })
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [records, company, startDate, endDate, filterKurir, searchQuery, currentUserDivision, currentUserName]);

  const couriers = useMemo(() => {
    if (currentUserDivision?.toLowerCase() === 'kurir') {
      return [currentUserName].filter(Boolean) as string[];
    }
    return employees
      .filter(e => e.division?.toLowerCase() === 'kurir' || e.jabatan?.toLowerCase() === 'kurir')
      .map(e => e.nama)
      .sort();
  }, [employees, currentUserDivision, currentUserName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaKurir || !formData.tanggal || !formData.tanggalNota || !formData.keteranganSisa) {
      alert('Mohon isi semua field yang wajib');
      return;
    }

    setIsSubmitting(true);

    const recordToSave: InfoSisaRecord = {
      id: editingId || `sisa_${Date.now()}`,
      tanggal: formData.tanggal!,
      namaKurir: formData.namaKurir!,
      tanggalNota: formData.tanggalNota!,
      keteranganSisa: formData.keteranganSisa!,
      company,
      createdAt: editingId ? (records.find(r => r.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    try {
      await onSave(recordToSave);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Save error:', err);
      alert(`Gagal menyimpan info sisa: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (record: InfoSisaRecord) => {
    const newRecord: InfoSisaRecord = {
      ...record,
      id: `sisa_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    try {
      await onSave(newRecord);
    } catch (err: any) {
      alert(`Gagal menduplikasi: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      tanggal: getLocalDateString(),
      namaKurir: currentUserDivision?.toLowerCase() === 'kurir' ? currentUserName : '',
      tanggalNota: getLocalDateString(),
      keteranganSisa: ''
    });
    setEditingId(null);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const csvUrl = 'https://docs.google.com/spreadsheets/d/1FdhqqzioWvySOgK0o4mw6q9-DTUJdLwoDToYr1xKgwA/export?format=csv&gid=1084078830';
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Gagal mengambil data dari Google Sheets. Pastikan spreadsheet publik.');
      
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data as any[];
          let successCount = 0;
          let failCount = 0;
          let duplicateCount = 0;

          // Sequential save to avoid overwhelming or race conditions
          for (const row of rows) {
            try {
              // Try to find columns regardless of exact naming
              const keys = Object.keys(row);
              const findVal = (possibleNames: string[]) => {
                const key = keys.find(k => possibleNames.includes(k.trim().toLowerCase()));
                return key ? row[key] : null;
              };

              const rawTanggal = findVal(['tanggal', 'tgl', 'date']);
              const rawNamaKurir = findVal(['nama kurir', 'kurir', 'nama']);
              const rawTanggalNota = findVal(['tanggal nota', 'tgl nota', 'nota date']);
              const rawKeteranganSisa = findVal(['keterangan sisa', 'sisa', 'keterangan']);

              const val0 = rawTanggal || Object.values(row)[0];
              const val1 = rawNamaKurir || Object.values(row)[1];
              const val2 = rawTanggalNota || Object.values(row)[2];
              const val3 = rawKeteranganSisa || Object.values(row)[3];

              if (!val0 || !val1) continue;

              const parsedDate = parseIndoDate(String(val0));
              const parsedNotaDate = parseIndoDate(String(val2));
              
              const formattedTanggal = getLocalDateString(parsedDate || new Date());
              const formattedNamaKurir = String(val1);
              const formattedTanggalNota = getLocalDateString(parsedNotaDate || new Date());
              const formattedKeteranganSisa = String(val3 || '-');

              // DUPLICATE CHECK
              const isDuplicate = records.some(r => 
                r.tanggal === formattedTanggal &&
                r.namaKurir.toLowerCase() === formattedNamaKurir.toLowerCase() &&
                r.tanggalNota === formattedTanggalNota &&
                r.keteranganSisa.trim() === formattedKeteranganSisa.trim()
              );

              if (isDuplicate) {
                duplicateCount++;
                continue;
              }

              const record: InfoSisaRecord = {
                id: `sisa_sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                tanggal: formattedTanggal,
                namaKurir: formattedNamaKurir,
                tanggalNota: formattedTanggalNota,
                keteranganSisa: formattedKeteranganSisa,
                company,
                createdAt: new Date().toISOString()
              };

              await onSave(record);
              successCount++;
            } catch (err) {
              console.error('Row sync error:', err);
              failCount++;
            }
          }
          alert(`Sinkronisasi selesai!\nBerhasil: ${successCount}\nDuplikat (Dilewati): ${duplicateCount}\nGagal: ${failCount}`);
          setIsSyncing(false);
        }
      });
    } catch (err: any) {
      console.error('Sync error:', err);
      alert('Gagal sinkronisasi: ' + err.message);
      setIsSyncing(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedData.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Hapus ${selectedIds.length} data terpilih?`)) return;
    
    try {
      await onBulkDelete(selectedIds);
      setSelectedIds([]);
    } catch (err: any) {
      alert(`Gagal hapus massal: ${err.message}`);
    }
  };

  const paginatedData = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 md:p-6 rounded-[28px] md:rounded-[32px] shadow-sm border border-stone-100">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-stone-900 uppercase">Info Sisa</h2>
          <p className="text-[10px] md:text-sm text-stone-500 font-medium tracking-tight">Data sisa pengiriman kurir</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100"
          >
            <span className={`material-symbols-outlined text-lg ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
            {isSyncing ? 'Syncing...' : 'Sync Spreadsheet'}
          </button>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-200"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Tambah Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-stone-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[8px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Cari Kurir/Keterangan</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs md:text-sm font-bold focus:outline-none"
              />
            </div>
          </div>
          <div className="w-full md:w-auto">
            <label className="text-[8px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Periode</label>
            <div className="flex items-center gap-2 mt-1 bg-stone-50 p-1 rounded-2xl border border-stone-100">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent border-none outline-none font-bold text-stone-600 px-3 py-2 text-xs md:text-sm" />
              <span className="text-stone-300 font-black text-[10px]">KE</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent border-none outline-none font-bold text-stone-600 px-3 py-2 text-xs md:text-sm" />
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black text-sm border border-red-100 hover:bg-red-100 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
              Hapus ({selectedIds.length})
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                    className="w-5 h-5 rounded-lg border-stone-300 text-stone-900 focus:ring-stone-500 rounded cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Nama Kurir</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tanggal Nota</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Keterangan Sisa</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {paginatedData.map((record, idx) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={record.id}
                  className={`hover:bg-stone-50/50 transition-colors ${selectedIds.includes(record.id) ? 'bg-stone-50' : ''}`}
                >
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      onChange={() => handleSelectRow(record.id)}
                      checked={selectedIds.includes(record.id)}
                      className="w-5 h-5 rounded-lg border-stone-300 text-stone-900 focus:ring-stone-500 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-stone-600">{format(new Date(record.tanggal), 'dd/MM/yyyy')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-stone-900 uppercase tracking-tight">{record.namaKurir}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-stone-600">{format(new Date(record.tanggalNota), 'dd/MM/yyyy')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-stone-500 font-medium whitespace-pre-wrap">{record.keteranganSisa}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-stone-400">
                      <button
                        onClick={() => handleDuplicate(record)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                        title="Duplikat"
                      >
                        <span className="material-symbols-outlined text-lg">content_copy</span>
                      </button>
                      <button
                        onClick={() => { setFormData(record); setEditingId(record.id); setIsModalOpen(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(record.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Hapus"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {paginatedData.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-400 font-bold uppercase tracking-widest text-[10px]">
            Tidak ada data ditemukan
          </div>
        ) : (
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tampilkan</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-stone-500/20"
                >
                  {[10, 30, 50, 100, 500].map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Data</span>
              </div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 text-stone-400 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              {getPaginationRange(currentPage, totalPages).map((p, idx) => (
                p === '...' ? (
                  <span key={`dots-${idx}`} className="px-2 text-stone-400 font-bold">...</span>
                ) : (
                  <button
                    key={`page-${p}`}
                    onClick={() => setCurrentPage(typeof p === 'number' ? p : currentPage)}
                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all ${
                      currentPage === p 
                        ? 'bg-stone-900 text-white shadow-lg shadow-stone-200 scale-110' 
                        : 'text-stone-400 hover:bg-stone-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-stone-400 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div>
                  <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">
                    {editingId ? 'Edit Data Sisa' : 'Input Data Sisa'}
                  </h3>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Input informasi sisa pengiriman</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tanggal Nota</label>
                    <input
                      type="date"
                      required
                      value={formData.tanggalNota}
                      onChange={(e) => setFormData({ ...formData, tanggalNota: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Kurir</label>
                  <select
                    required
                    value={formData.namaKurir}
                    onChange={(e) => setFormData({ ...formData, namaKurir: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none appearance-none"
                    disabled={currentUserDivision?.toLowerCase() === 'kurir'}
                  >
                    <option value="">Pilih Kurir</option>
                    {couriers.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Keterangan Sisa</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.keteranganSisa}
                    onChange={(e) => setFormData({ ...formData, keteranganSisa: e.target.value })}
                    placeholder="Contoh: Sisa tuna 5, ayam 2..."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-stone-100 text-stone-600 rounded-2xl font-black text-sm hover:bg-stone-200 transition-all active:scale-95 uppercase tracking-widest"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-4 bg-stone-900 text-white rounded-2xl font-black text-sm hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-200 uppercase tracking-widest disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Simpan Data')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InfoSisaModule;
