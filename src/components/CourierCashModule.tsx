import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CourierCashRecord, Employee, UserRole, COAAccount } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { getLocalDateString, getPaginationRange } from '../lib/utils';

interface CourierCashModuleProps {
  records: CourierCashRecord[];
  employees: Employee[];
  coaAccounts: COAAccount[];
  company: string;
  userRole: UserRole;
  currentUserName?: string;
  currentUserDivision?: string;
  onSave: (record: CourierCashRecord) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const CourierCashModule: React.FC<CourierCashModuleProps> = ({ 
  records, 
  employees, 
  coaAccounts,
  company, 
  userRole,
  currentUserName,
  currentUserDivision,
  onSave, 
  onDelete 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [filterKurir, setFilterKurir] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle camera stream attachment when isCameraActive becomes true
  useEffect(() => {
    const enableCamera = async () => {
      if (isCameraActive && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
          alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
          setIsCameraActive(false);
        }
      }
    };

    enableCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraActive]);

  const startCamera = () => {
    setIsCameraActive(true);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Draw to canvas with smaller dimensions for compression
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 600;
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, width, height);
        // Compress to 0.7 quality to save space
        const photoData = canvas.toDataURL('image/jpeg', 0.7);
        setFormData(prev => ({ ...prev, bukti_url: photoData }));
        stopCamera();
      }
    }
  };

  const [formData, setFormData] = useState<Partial<CourierCashRecord>>({
    tanggal: getLocalDateString(),
    nama_kurir: currentUserDivision?.toLowerCase() === 'kurir' ? currentUserName : '',
    tipe: currentUserDivision?.toLowerCase() === 'kurir' ? 'Keluar' : 'Masuk',
    jumlah: 0,
    keterangan: '',
    debit_account: currentUserDivision?.toLowerCase() === 'kurir' ? 'Biaya Pengiriman' : 'Kas',
    credit_account: currentUserDivision?.toLowerCase() === 'kurir' ? 'Kas' : ''
  });

  const filteredCOA = useMemo(() => {
    return coaAccounts.filter(acc => acc.company === company);
  }, [coaAccounts, company]);

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => {
        const matchesCompany = r.company === company;
        
        // SECURITY: If kurir, ONLY see own data
        if (currentUserDivision?.toLowerCase() === 'kurir' && r.nama_kurir !== currentUserName) {
          return false;
        }

        const matchesDate = r.tanggal >= startDate && r.tanggal <= endDate;
        const matchesKurir = !filterKurir || r.nama_kurir === filterKurir;
        const matchesSearch = !searchQuery || 
          r.nama_kurir.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.jurnal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.debit_account?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.credit_account?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCompany && matchesDate && matchesKurir && matchesSearch;
      })
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime() || 
                       new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

  useEffect(() => {
    if (!editingId) {
      const isKurir = currentUserDivision?.toLowerCase() === 'kurir';
      if (formData.tipe === 'Masuk') {
        setFormData(prev => ({ 
          ...prev, 
          debit_account: 'Kas', 
          credit_account: isKurir ? 'Pendapatan' : '' 
        }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          debit_account: isKurir ? 'Biaya Pengiriman' : '', 
          credit_account: 'Kas' 
        }));
      }
    }
  }, [formData.tipe, editingId, currentUserDivision]);

  const stats = useMemo(() => {
    return filteredRecords.reduce((acc, curr) => {
      if (curr.tipe === 'Masuk') acc.totalMasuk += curr.jumlah;
      else acc.totalKeluar += curr.jumlah;
      acc.saldo = acc.totalMasuk - acc.totalKeluar;
      return acc;
    }, { totalMasuk: 0, totalKeluar: 0, saldo: 0 });
  }, [filteredRecords]);

  const handleEdit = (record: CourierCashRecord) => {
    const editData = { ...record };
    if (!editData.debit_account && record.jurnal) {
      editData.debit_account = record.jurnal.split(' / ')[0];
    }
    if (!editData.credit_account && record.jurnal) {
      editData.credit_account = record.jurnal.split(' / ')[1];
    }
    setFormData(editData);
    setEditingId(record.id);
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, bukti_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_kurir || !formData.tanggal || !formData.jumlah || !formData.debit_account || !formData.credit_account || !formData.bukti_url) {
      alert('Mohon isi semua field yang wajib termasuk Akun Debit/Kredit dan Upload Bukti');
      return;
    }

    const recordToSave: CourierCashRecord = {
      id: editingId || `cash_${Date.now()}`,
      tanggal: formData.tanggal!,
      nama_kurir: formData.nama_kurir!,
      tipe: formData.tipe as 'Masuk' | 'Keluar',
      jumlah: Number(formData.jumlah),
      keterangan: formData.keterangan || '',
      jurnal: `${formData.debit_account} / ${formData.credit_account}`,
      bukti_url: formData.bukti_url,
      status: editingId 
        ? (records.find(r => r.id === editingId)?.status || 'Approved')
        : (currentUserDivision?.toLowerCase() === 'kurir' ? 'Pending' : 'Approved'),
      company,
      created_at: editingId ? (records.find(r => r.id === editingId)?.created_at || new Date().toISOString()) : new Date().toISOString()
    };

    // Only include split columns if they were specifically requested and handled by the database
    // For now, we use 'jurnal' column which we know exists and is required.
    // If the database supports these, we can re-add them to the type and payload.
    await onSave(recordToSave as CourierCashRecord);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    const isKurir = currentUserDivision?.toLowerCase() === 'kurir';
    const isMasuk = !isKurir; // Default to Masuk for non-kurir, Keluar for kurir
    
    setFormData({
      tanggal: getLocalDateString(),
      nama_kurir: isKurir ? currentUserName : '',
      tipe: isKurir ? 'Keluar' : 'Masuk',
      jumlah: 0,
      keterangan: '',
      debit_account: isKurir ? 'Biaya Pengiriman' : (isMasuk ? 'Kas' : ''),
      credit_account: isKurir ? 'Kas' : (isMasuk ? '' : 'Kas')
    });
    setEditingId(null);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, filterKurir, searchQuery]);

  const paginatedData = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const startIdx = filteredRecords.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, filteredRecords.length);

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 md:p-6 rounded-[28px] md:rounded-[32px] shadow-sm border border-stone-100">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-stone-900 uppercase">Kas Kurir</h2>
          <p className="text-[10px] md:text-sm text-stone-500 font-medium tracking-tight">Pengelolaan kas harian kurir</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-200"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Tambah Transaksi
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
        <div className="bg-white p-3 md:p-6 rounded-[24px] md:rounded-[32px] border border-stone-100 shadow-sm">
          <div className="w-7 h-7 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-2 md:mb-4">
            <span className="material-symbols-outlined text-base md:text-xl">trending_up</span>
          </div>
          <p className="text-[7px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5 md:mb-1">Total Masuk</p>
          <h3 className="text-sm md:text-2xl font-black text-stone-900 leading-tight">Rp {stats.totalMasuk.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-[24px] md:rounded-[32px] border border-stone-100 shadow-sm">
          <div className="w-7 h-7 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-2 md:mb-4">
            <span className="material-symbols-outlined text-base md:text-xl">trending_down</span>
          </div>
          <p className="text-[7px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5 md:mb-1">Total Keluar</p>
          <h3 className="text-sm md:text-2xl font-black text-stone-900 leading-tight">Rp {stats.totalKeluar.toLocaleString('id-ID')}</h3>
        </div>
        <div className="col-span-2 md:col-span-1 bg-white p-3 md:p-6 rounded-[24px] md:rounded-[32px] border border-stone-100 shadow-sm flex md:block items-center justify-between">
          <div className="flex items-center gap-3 md:block">
            <div className="w-7 h-7 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center md:mb-4">
              <span className="material-symbols-outlined text-base md:text-xl">account_balance_wallet</span>
            </div>
            <div className="md:block">
              <p className="text-[7px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5 md:mb-1">Saldo Akhir</p>
              <h3 className="text-sm md:text-2xl font-black text-stone-900 leading-tight">Rp {stats.saldo.toLocaleString('id-ID')}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-stone-100 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[150px]">
            <label className="text-[8px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Cari Keterangan/Kurir</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-sm md:text-base">search</span>
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 md:py-3 bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
              />
            </div>
          </div>
          <div className="w-full md:w-auto">
            <label className="text-[8px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Periode</label>
            <div className="flex items-center gap-2 mt-1 bg-stone-50 p-0.5 md:p-1 rounded-xl md:rounded-2xl border border-stone-100">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-stone-600 px-2 py-1.5 md:px-3 md:py-2 text-[9px] md:text-sm"
              />
              <span className="text-stone-300 font-black text-[8px] md:text-xs">KE</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-stone-600 px-2 py-1.5 md:px-3 md:py-2 text-[9px] md:text-sm"
              />
            </div>
          </div>
          {currentUserDivision?.toLowerCase() !== 'kurir' && (
            <div className="w-full md:w-[200px]">
              <label className="text-[8px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Kurir</label>
              <select
                value={filterKurir}
                onChange={(e) => setFilterKurir(e.target.value)}
                className="w-full mt-1 px-3 py-2 md:py-3 bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold focus:outline-none appearance-none"
              >
                <option value="">Semua Kurir</option>
                {couriers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* List (Desktop: Table, Mobile: Cards) */}
      <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Kurir</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Debit</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Kredit</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tipe</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Jumlah</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Keterangan</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Bukti Foto</th>
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
                    <span className="text-xs font-black text-stone-900">{record.nama_kurir}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      {record.debit_account || record.jurnal?.split(' / ')[0] || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-tight bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                      {record.credit_account || record.jurnal?.split(' / ')[1] || '-'}
                    </span>
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
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                      record.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                      record.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {record.status || 'Approved'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-stone-500 font-medium">{record.keterangan || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {record.bukti_url ? (
                      <div className="flex justify-center">
                        <button 
                          onClick={() => setZoomImage(record.bukti_url!)}
                          className="relative group transition-all"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white ring-2 ring-stone-100 shadow-lg group-hover:ring-stone-900 group-hover:scale-110 transition-all duration-300">
                            <img 
                              src={record.bukti_url} 
                              alt="Bukti" 
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                            />
                          </div>
                          <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 rounded-full flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">zoom_in</span>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full bg-stone-50 border-2 border-stone-100 flex items-center justify-center opacity-30 grayscale">
                          <span className="material-symbols-outlined text-stone-400 text-lg">receipt_long</span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-stone-400">
                      {(userRole === 'owner' || userRole === 'admin') && record.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => onSave({ ...record, status: 'Approved' })}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Approve"
                          >
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                          </button>
                          <button
                            onClick={() => onSave({ ...record, status: 'Rejected' })}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Reject"
                          >
                            <span className="material-symbols-outlined text-lg">cancel</span>
                          </button>
                        </>
                      )}
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
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-4 space-y-4">
          {paginatedData.map((record, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={record.id}
              className="bg-white rounded-[24px] p-4 border border-stone-100 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    {format(new Date(record.tanggal), 'EEEE, dd MMM yyyy')}
                  </span>
                  <h4 className="text-sm font-black text-stone-900 mt-1 uppercase tracking-tight">{record.nama_kurir}</h4>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  record.tipe === 'Masuk' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {record.tipe}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-y border-stone-50">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">JUMLAH</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${record.tipe === 'Masuk' ? 'text-green-600' : 'text-red-600'}`}>
                      {record.tipe === 'Masuk' ? '+' : '-'} Rp {record.jumlah.toLocaleString('id-ID')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      record.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                      record.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {record.status || 'Approved'}
                    </span>
                  </div>
                </div>
                {record.bukti_url && (
                  <button 
                    onClick={() => setZoomImage(record.bukti_url!)}
                    className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-lg relative group"
                  >
                    <img src={record.bukti_url} alt="Bukti" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-xs">zoom_in</span>
                    </div>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1">DEBIT</span>
                  <span className="text-[10px] font-black text-emerald-700 uppercase leading-tight block">
                    {record.debit_account || record.jurnal?.split(' / ')[0] || '-'}
                  </span>
                </div>
                <div className="bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1">KREDIT</span>
                  <span className="text-[10px] font-black text-amber-700 uppercase leading-tight block">
                    {record.credit_account || record.jurnal?.split(' / ')[1] || '-'}
                  </span>
                </div>
              </div>

              {record.keterangan && (
                <div className="bg-stone-50/50 p-3 rounded-xl border border-stone-50">
                  <p className="text-[10px] text-stone-500 font-medium italic">"{record.keterangan}"</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {(userRole === 'owner' || userRole === 'admin') && record.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => onSave({ ...record, status: 'Approved' })}
                      className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Approve
                    </button>
                    <button
                      onClick={() => onSave({ ...record, status: 'Rejected' })}
                      className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleEdit(record)}
                  className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit
                </button>
                {(userRole === 'owner' || userRole === 'admin') && (
                  <button
                    onClick={() => onDelete(record.id)}
                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Hapus
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {paginatedData.length === 0 && (
          <div className="px-6 py-12 text-center text-stone-400 font-bold">Tidak ada data ditemukan</div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">
              MENAMPILKAN {startIdx} SAMPAI {endIdx} DARI {filteredRecords.length} DATA
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">TAMPILKAN:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-[10px] font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-200"
              >
                {[10, 30, 50, 100].map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all border border-stone-200 bg-white"
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
                        : 'text-stone-400 hover:bg-white hover:text-stone-600 border border-transparent'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all border border-stone-200 bg-white"
              >
                <span className="material-symbols-outlined text-stone-600 text-sm">chevron_right</span>
              </button>
            </div>
          )}
        </div>
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
              className="bg-white rounded-[24px] md:rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative"
            >
              <div className="p-3 md:p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div>
                  <h3 className="text-base md:text-xl font-black text-stone-900 uppercase tracking-tight">
                    {editingId ? 'Edit Transaksi' : 'Transaksi Baru'}
                  </h3>
                  <p className="text-[7px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest">Input mutasi kas kurir</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 md:p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400"
                >
                  <span className="material-symbols-outlined text-base md:text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-3 md:p-6 space-y-2 md:space-y-4 max-h-[90vh] md:max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[7px] md:text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      className="w-full px-2 py-1.5 md:px-4 md:py-2.5 bg-stone-50 border border-stone-100 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[7px] md:text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Tipe</label>
                    <select
                      value={formData.tipe}
                      onChange={(e) => setFormData({ ...formData, tipe: e.target.value as 'Masuk' | 'Keluar' })}
                      className="w-full px-2 py-1.5 md:px-4 md:py-2.5 bg-stone-50 border border-stone-100 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold focus:outline-none"
                    >
                      <option value="Masuk">Masuk (+)</option>
                      <option value="Keluar">Keluar (-)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[7px] md:text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Akun Debit</label>
                    <select
                      required
                      value={formData.debit_account}
                      onChange={(e) => setFormData({ ...formData, debit_account: e.target.value })}
                      className="w-full px-2 py-1.5 md:px-4 md:py-2.5 bg-stone-50 border border-stone-100 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold focus:outline-none appearance-none"
                    >
                      <option value="">Pilih</option>
                      {filteredCOA.map(acc => (
                        <option key={acc.id} value={acc.name}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[7px] md:text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Akun Kredit</label>
                    <select
                      required
                      value={formData.credit_account}
                      onChange={(e) => setFormData({ ...formData, credit_account: e.target.value })}
                      className="w-full px-2 py-1.5 md:px-4 md:py-2.5 bg-stone-50 border border-stone-100 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold focus:outline-none appearance-none"
                    >
                      <option value="">Pilih</option>
                      {filteredCOA.map(acc => (
                        <option key={acc.id} value={acc.name}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[7px] md:text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Kurir</label>
                    <select
                      required
                      disabled={currentUserDivision?.toLowerCase() === 'kurir'}
                      value={formData.nama_kurir}
                      onChange={(e) => setFormData({ ...formData, nama_kurir: e.target.value })}
                      className="w-full px-2 py-1.5 md:px-4 md:py-2.5 bg-stone-50 border border-stone-100 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold focus:outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih</option>
                      {couriers.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[7px] md:text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Jumlah (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-[8px] md:text-xs">Rp</span>
                      <input
                        type="text"
                        required
                        value={formData.jumlah ? formData.jumlah.toLocaleString('id-ID') : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, jumlah: val ? Number(val) : 0 });
                        }}
                        placeholder="0"
                        className="w-full pl-6 md:pl-10 pr-2 md:pr-4 py-1.5 md:py-2.5 bg-stone-50 border border-stone-100 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all font-mono text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[7px] md:text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Upload Bukti</label>
                    <div className="flex items-center gap-1.5 md:gap-3">
                      {isCameraActive ? (
                        <div className="relative flex-1 group">
                          <div className="relative aspect-video md:aspect-square bg-black rounded-lg md:rounded-xl overflow-hidden shadow-2xl ring-4 ring-white border border-stone-200">
                            <video 
                              ref={videoRef} 
                              autoPlay 
                              playsInline 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-2 md:p-4 bg-gradient-to-t from-black/60 to-transparent flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={capturePhoto}
                                className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                                title="Ambil Foto"
                              >
                                <span className="material-symbols-outlined text-stone-900 text-lg md:text-2xl">photo_camera</span>
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="w-8 h-8 md:w-12 md:h-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                                title="Batal"
                              >
                                <span className="material-symbols-outlined text-lg md:text-2xl">close</span>
                              </button>
                            </div>
                          </div>
                          <canvas ref={canvasRef} className="hidden" />
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-1 gap-1.5 md:gap-2">
                            <label className="flex-1 cursor-pointer">
                              <div className="border border-dashed border-stone-200 rounded-lg md:rounded-xl py-1.5 md:py-3 flex flex-col items-center justify-center bg-stone-50 hover:bg-stone-100 transition-colors">
                                <span className="material-symbols-outlined text-stone-400 text-xs md:text-sm">upload_file</span>
                                <span className="text-[6px] md:text-[8px] font-black text-stone-400 uppercase tracking-tight">Upload</span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={startCamera}
                              className="flex-1 border border-dashed border-stone-200 rounded-lg md:rounded-xl py-1.5 md:py-3 flex flex-col items-center justify-center bg-stone-50 hover:bg-stone-100 transition-colors"
                            >
                              <span className="material-symbols-outlined text-stone-400 text-xs md:text-sm">photo_camera</span>
                              <span className="text-[6px] md:text-[8px] font-black text-stone-400 uppercase tracking-tight">Kamera</span>
                            </button>
                          </div>
                          {formData.bukti_url && (
                            <div className="relative w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-xl overflow-hidden shadow-sm border border-stone-100">
                              <img src={formData.bukti_url} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, bukti_url: undefined })}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                              >
                                <span className="material-symbols-outlined text-white text-[10px] md:text-sm">delete</span>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[7px] md:text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Keterangan</label>
                    <textarea
                      rows={1}
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      placeholder="Catatan..."
                      className="w-full px-2 py-1.5 md:px-4 md:py-2.5 bg-stone-50 border border-stone-100 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 md:py-4 bg-stone-900 text-white rounded-lg md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.3em] shadow-lg shadow-stone-200 hover:bg-stone-800 transition-all"
                  >
                    {editingId ? 'Update Transaksi' : 'Simpan Transaksi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* Zoom Image Modal */}
        <AnimatePresence>
          {zoomImage && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setZoomImage(null)}
                className="absolute inset-0 bg-stone-900/95 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotate: 5 }}
                className="relative max-w-4xl w-full flex flex-col items-center gap-6"
              >
                <div className="relative group overflow-hidden rounded-[32px] border-8 border-white bg-white shadow-2xl shadow-stone-950/50">
                  <img
                    src={zoomImage}
                    alt="Zoom Bukti"
                    className="max-h-[80vh] w-auto object-contain cursor-zoom-out"
                    onClick={() => setZoomImage(null)}
                  />
                  <div className="absolute top-0 inset-x-0 p-8 bg-gradient-to-b from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(zoomImage, '_blank');
                      }}
                      className="absolute top-4 right-16 bg-white/20 backdrop-blur-xl text-white p-3 rounded-2xl hover:bg-white/40 transition-all border border-white/30 truncate flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">open_in_new</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Buka di Tab Baru</span>
                    </button>
                    <button
                      onClick={() => setZoomImage(null)}
                      className="absolute top-4 right-4 bg-white text-stone-900 p-3 rounded-2xl hover:bg-stone-50 transition-all shadow-xl"
                    >
                      <span className="material-symbols-outlined font-black">close</span>
                    </button>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl px-12 py-4 rounded-[40px] border border-white/20 flex items-center gap-8 text-white shadow-2xl">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Resolusi</span>
                    <span className="text-xl font-bold font-mono">Original</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <button
                    onClick={() => setZoomImage(null)}
                    className="flex items-center gap-3 hover:text-white/70 transition-all"
                  >
                    <span className="material-symbols-outlined text-4xl">cancel</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Tutup</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default CourierCashModule;
