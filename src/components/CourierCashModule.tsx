import React, { useState, useMemo } from 'react';
import { CourierCashRecord, Employee, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { getLocalDateString, getPaginationRange } from '../lib/utils';

interface CourierCashModuleProps {
  records: CourierCashRecord[];
  employees: Employee[];
  company: string;
  userRole: UserRole;
  onSave: (record: CourierCashRecord) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 10;

const CourierCashModule: React.FC<CourierCashModuleProps> = ({ 
  records, 
  employees, 
  company, 
  userRole,
  onSave, 
  onDelete 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [filterKurir, setFilterKurir] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<Partial<CourierCashRecord>>({
    tanggal: getLocalDateString(),
    namaKurir: '',
    tipe: 'Masuk',
    jumlah: 0,
    keterangan: ''
  });

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => {
        const matchesCompany = r.company === company;
        const matchesDate = r.tanggal >= startDate && r.tanggal <= endDate;
        const matchesKurir = !filterKurir || r.namaKurir === filterKurir;
        const matchesSearch = !searchQuery || 
          r.namaKurir.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.keterangan.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCompany && matchesDate && matchesKurir && matchesSearch;
      })
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime() || 
                       new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [records, company, startDate, endDate, filterKurir, searchQuery]);

  const couriers = useMemo(() => {
    return employees
      .filter(e => e.division?.toLowerCase() === 'kurir' || e.jabatan?.toLowerCase() === 'kurir')
      .map(e => e.nama)
      .sort();
  }, [employees]);

  const stats = useMemo(() => {
    return filteredRecords.reduce((acc, curr) => {
      if (curr.tipe === 'Masuk') acc.totalMasuk += curr.jumlah;
      else acc.totalKeluar += curr.jumlah;
      acc.saldo = acc.totalMasuk - acc.totalKeluar;
      return acc;
    }, { totalMasuk: 0, totalKeluar: 0, saldo: 0 });
  }, [filteredRecords]);

  const handleEdit = (record: CourierCashRecord) => {
    setFormData(record);
    setEditingId(record.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaKurir || !formData.tanggal || !formData.jumlah) {
      alert('Mohon isi semua field yang wajib');
      return;
    }

    const recordToSave: CourierCashRecord = {
      id: editingId || `cash_${Date.now()}`,
      tanggal: formData.tanggal!,
      namaKurir: formData.namaKurir!,
      tipe: formData.tipe as 'Masuk' | 'Keluar',
      jumlah: Number(formData.jumlah),
      keterangan: formData.keterangan || '',
      company,
      createdAt: editingId ? (records.find(r => r.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    await onSave(recordToSave);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      tanggal: getLocalDateString(),
      namaKurir: '',
      tipe: 'Masuk',
      jumlah: 0,
      keterangan: ''
    });
    setEditingId(null);
  };

  const paginatedData = filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-stone-100">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-stone-900 uppercase">Kas Kurir</h2>
          <p className="text-stone-500 font-medium">Pengelolaan kas harian kurir</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-200"
        >
          <span className="material-symbols-outlined">add</span>
          Tambah Transaksi
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Masuk</p>
          <h3 className="text-2xl font-black text-stone-900">Rp {stats.totalMasuk.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">trending_down</span>
          </div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Keluar</p>
          <h3 className="text-2xl font-black text-stone-900">Rp {stats.totalKeluar.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Saldo Akhir</p>
          <h3 className="text-2xl font-black text-stone-900">Rp {stats.saldo.toLocaleString('id-ID')}</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Cari Keterangan/Kurir</label>
            <div className="relative mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400">search</span>
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
              />
            </div>
          </div>
          <div className="w-full md:w-auto">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Periode</label>
            <div className="flex items-center gap-2 mt-1 bg-stone-50 p-1 rounded-2xl border border-stone-100">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-stone-600 px-3 py-2 text-sm"
              />
              <span className="text-stone-300 font-black text-xs">KE</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-stone-600 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="w-full md:w-[200px]">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Kurir</label>
            <select
              value={filterKurir}
              onChange={(e) => setFilterKurir(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none appearance-none"
            >
              <option value="">Semua Kurir</option>
              {couriers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Kurir</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tipe</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Jumlah</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Keterangan</th>
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
                  className="hover:bg-stone-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-xs font-bold text-stone-600">{format(new Date(record.tanggal), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-stone-900">{record.namaKurir}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                      record.tipe === 'Masuk' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {record.tipe}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-black ${
                      record.tipe === 'Masuk' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {record.tipe === 'Masuk' ? '+' : '-'} Rp {record.jumlah.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-stone-500 font-medium">{record.keterangan || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      {(userRole === 'owner' || userRole === 'admin') && (
                        <button
                          onClick={() => onDelete(record.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 font-bold">Tidak ada data ditemukan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Showing <span className="text-stone-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-stone-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)}</span> of <span className="text-stone-900">{filteredRecords.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <span className="material-symbols-outlined text-stone-600 text-sm">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                {getPaginationRange(currentPage, totalPages).map((page, i) => (
                  <button
                    key={i}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={typeof page !== 'number' || currentPage === page}
                    className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${
                      currentPage === page 
                        ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20' 
                        : 'text-stone-400 hover:bg-white hover:text-stone-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <span className="material-symbols-outlined text-stone-600 text-sm">chevron_right</span>
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
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden relative"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-stone-900 uppercase tracking-tight">
                      {editingId ? 'Edit Transaksi' : 'Transaksi Baru'}
                    </h3>
                    <p className="text-stone-500 font-medium">Input mutasi kas kurir</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={formData.tanggal}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                        className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tipe</label>
                      <select
                        value={formData.tipe}
                        onChange={(e) => setFormData({ ...formData, tipe: e.target.value as 'Masuk' | 'Keluar' })}
                        className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none"
                      >
                        <option value="Masuk">Masuk (+)</option>
                        <option value="Keluar">Keluar (-)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Kurir</label>
                    <select
                      required
                      value={formData.namaKurir}
                      onChange={(e) => setFormData({ ...formData, namaKurir: e.target.value })}
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none appearance-none"
                    >
                      <option value="">Pilih Kurir</option>
                      {couriers.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Jumlah (Rp)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.jumlah}
                      onChange={(e) => setFormData({ ...formData, jumlah: Number(e.target.value) })}
                      placeholder="Contoh: 150000"
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Keterangan</label>
                    <textarea
                      rows={3}
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      placeholder="Catatan transaksi..."
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-5 bg-stone-900 text-white rounded-[24px] font-black uppercase tracking-widest transition-all hover:bg-stone-800 active:scale-[0.98] mt-4 shadow-xl shadow-stone-200"
                  >
                    Simpan Transaksi
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourierCashModule;
