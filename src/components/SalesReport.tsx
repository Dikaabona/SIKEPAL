import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SalesReportEntry, Employee, Store, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { getLocalDateString } from '../lib/utils';

interface SalesReportProps {
  company: string;
  reports: SalesReportEntry[];
  onSave: (report: SalesReportEntry) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  employees: Employee[];
  stores: Store[];
  currentUser: Employee | null;
  authUserId?: string;
}

const SalesReport: React.FC<SalesReportProps> = ({ 
  company, 
  reports, 
  onSave, 
  onDelete,
  employees,
  stores,
  currentUser,
  authUserId
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<SalesReportEntry>>({
    tanggal: getLocalDateString(),
    namaPic: '',
    namaToko: '',
    noHp: '',
    reportType: 'Bawa sample',
    reportVisit: '',
    hasil: 'Pending',
    keterangan: '',
  });

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'fotoTempat' | 'fotoBukti'>('fotoTempat');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const enableCamera = async () => {
      if (isCameraActive && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          console.error("Error accessing camera:", err);
          alert("Tidak dapat mengakses kamera.");
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

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 600;
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > height) {
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      } else {
        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
      }

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, width, height);
        const photoData = canvas.toDataURL('image/jpeg', 0.7);
        setFormData(prev => ({ ...prev, [cameraTarget]: photoData }));
        setIsCameraActive(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'fotoTempat' | 'fotoBukti') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [target]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (r.company !== company) return false;
      const reportDate = r.tanggal;
      const matchSearch = r.namaToko.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.namaPic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDate = reportDate >= startDate && reportDate <= endDate;
      return matchSearch && matchDate;
    });
  }, [reports, company, searchQuery, startDate, endDate]);

  const handleReset = () => {
    setFormData({
      tanggal: getLocalDateString(),
      namaPic: '',
      namaToko: '',
      noHp: '',
      reportType: 'Bawa sample',
      reportVisit: '',
      hasil: 'Pending',
      keterangan: '',
      fotoTempat: undefined,
      fotoBukti: undefined,
    });
    setEditingId(null);
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSave = async () => {
    if (!formData.namaToko || !formData.namaPic) {
      alert('Nama Toko dan Nama PIC wajib diisi');
      return;
    }

    const isUUID = (str: string) => {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    };

    const reportToSave: SalesReportEntry = {
      id: editingId || generateUUID(),
      tanggal: formData.tanggal || getLocalDateString(),
      namaPic: formData.namaPic || '',
      namaToko: formData.namaToko || '',
      noHp: formData.noHp || '',
      reportType: formData.reportType || 'Bawa sample',
      reportVisit: formData.reportVisit || '',
      fotoTempat: formData.fotoTempat,
      fotoBukti: formData.fotoBukti,
      hasil: formData.hasil || 'Pending',
      keterangan: formData.keterangan || '',
      company,
      employeeId: (authUserId && isUUID(authUserId)) ? authUserId : 
                  (currentUser?.id && isUUID(currentUser.id)) ? currentUser.id : 
                  undefined,
      updatedAt: new Date().toISOString(),
    };

    await onSave(reportToSave);
    setIsModalOpen(false);
    handleReset();
  };

  const handleEdit = (report: SalesReportEntry) => {
    setEditingId(report.id);
    setFormData({ ...report });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-800 uppercase tracking-tight">Sales Report</h2>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Manajemen laporan kunjungan sales</p>
        </div>
        <button
          onClick={() => { handleReset(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-2xl hover:bg-stone-800 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-stone-200"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Tambah Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-sm p-3 md:p-4 rounded-3xl border border-stone-100 shadow-sm space-y-3 md:space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Cari toko atau PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-800 outline-none focus:ring-2 focus:ring-stone-200 transition-all uppercase tracking-wider h-11 md:h-12"
            />
          </div>
          <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-2xl border border-stone-100 self-stretch md:self-auto justify-between md:justify-start">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black text-stone-800 outline-none uppercase"
            />
            <span className="text-stone-300 font-bold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black text-stone-800 outline-none uppercase"
            />
          </div>
        </div>
      </div>

      {/* Mobile Card List (Visible on mobile only) */}
      <div className="md:hidden space-y-4">
        {filteredReports.map((report) => (
          <div key={report.id} className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{format(new Date(report.tanggal), 'dd/MM/yyyy')}</p>
                <h4 className="text-sm font-black text-stone-800 uppercase tracking-tight">{report.namaToko}</h4>
                <p className="text-[10px] font-bold text-stone-500 uppercase">{report.namaPic} • {report.noHp}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                report.hasil === 'Approve' ? 'bg-green-100 text-green-700' :
                report.hasil === 'Reject' ? 'bg-red-100 text-red-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {report.hasil}
              </span>
            </div>
            
            <div className="bg-stone-50 p-3 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{report.reportType}</span>
                <div className="flex gap-1.5">
                  {report.fotoTempat && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-stone-200" onClick={() => setZoomImage(report.fotoTempat || null)}>
                      <img src={report.fotoTempat} alt="T" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {report.fotoBukti && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-stone-200" onClick={() => setZoomImage(report.fotoBukti || null)}>
                      <img src={report.fotoBukti} alt="B" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-stone-600 italic leading-relaxed line-clamp-2">{report.reportVisit}</p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button 
                onClick={() => handleEdit(report)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-600 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-xs">edit</span>
                Edit
              </button>
              <button 
                onClick={() => onDelete(report.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-xs">delete</span>
                Hapus
              </button>
            </div>
          </div>
        ))}
        {filteredReports.length === 0 && (
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm text-center">
             <span className="material-symbols-outlined text-stone-200 text-4xl mb-2">search_off</span>
             <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tidak ada laporan</p>
          </div>
        )}
      </div>

      {/* Table (Visible on desktop only) */}
      <div className="hidden md:block bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">Tanggal</th>
                <th className="px-6 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">Nama PIC</th>
                <th className="px-6 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">Nama Toko</th>
                <th className="px-6 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">No HP / WA</th>
                <th className="px-6 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">Report</th>
                <th className="px-6 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">Visit Detail</th>
                <th className="px-6 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">Bukti</th>
                <th className="px-6 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">Hasil</th>
                <th className="px-6 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-5 text-[11px] font-black text-stone-500 uppercase tracking-wider">
                    {format(new Date(report.tanggal), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-black text-stone-800 uppercase tracking-tight">{report.namaPic}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-black text-stone-800 uppercase tracking-tight">{report.namaToko}</div>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-stone-600">{report.noHp}</td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      {report.reportType}
                    </span>
                  </td>
                  <td className="px-6 py-5 min-w-[200px]">
                    <p className="text-[11px] text-stone-500 leading-relaxed italic">{report.reportVisit}</p>
                    {report.keterangan && <p className="text-[9px] text-stone-400 mt-1 uppercase font-bold">Ket: {report.keterangan}</p>}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2">
                      {report.fotoTempat && (
                        <div 
                          className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => setZoomImage(report.fotoTempat || null)}
                        >
                          <img src={report.fotoTempat} alt="Tempat" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {report.fotoBukti && (
                        <div 
                          className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => setZoomImage(report.fotoBukti || null)}
                        >
                          <img src={report.fotoBukti} alt="Bukti" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      report.hasil === 'Approve' ? 'bg-green-100 text-green-700' :
                      report.hasil === 'Reject' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {report.hasil}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(report)} className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => onDelete(report.id)} className="p-2 text-stone-400 hover:text-red-600 transition-colors">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <span className="material-symbols-outlined text-stone-200 text-5xl mb-4">search_off</span>
                    <p className="text-xs font-black text-stone-400 uppercase tracking-widest">Tidak ada laporan ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isCameraActive) setIsModalOpen(false); }}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[24px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[90vh]"
            >
              <div className="p-4 md:p-6 border-b border-stone-100 flex items-center justify-between">
                <h3 className="text-base md:text-xl font-black text-stone-800 uppercase tracking-tight">
                  {editingId ? 'Edit Laporan' : 'Laporan Baru'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-50 rounded-xl transition-colors">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-4 md:space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase ml-1">Tanggal</label>
                    <input
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold focus:ring-2 focus:ring-stone-200 outline-none uppercase"
                    />
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase ml-1">Hasil</label>
                    <select
                      value={formData.hasil}
                      onChange={(e) => setFormData({ ...formData, hasil: e.target.value as any })}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold focus:ring-2 focus:ring-stone-200 outline-none"
                    >
                      <option value="Pending">PENDING</option>
                      <option value="Approve">APPROVE</option>
                      <option value="Reject">REJECT</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase ml-1">Nama Toko</label>
                    <input
                      type="text"
                      list="store-suggestions"
                      value={formData.namaToko}
                      onChange={(e) => {
                        const val = e.target.value;
                        const store = stores.find(s => s.namaToko === val);
                        setFormData({ 
                          ...formData, 
                          namaToko: val,
                          namaPic: store?.namaPic || formData.namaPic,
                          noHp: store?.nomorPIC || formData.noHp
                        });
                      }}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold focus:ring-2 focus:ring-stone-200 outline-none"
                    />
                    <datalist id="store-suggestions">
                      {stores.map(s => <option key={s.id} value={s.namaToko} />)}
                    </datalist>
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase ml-1">Nama PIC</label>
                    <input
                      type="text"
                      value={formData.namaPic}
                      onChange={(e) => setFormData({ ...formData, namaPic: e.target.value })}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold focus:ring-2 focus:ring-stone-200 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase ml-1">Nomor HP / WA</label>
                    <input
                      type="text"
                      value={formData.noHp}
                      onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold focus:ring-2 focus:ring-stone-200 outline-none"
                    />
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase ml-1">Tipe Laporan</label>
                    <select
                      value={formData.reportType}
                      onChange={(e) => setFormData({ ...formData, reportType: e.target.value as any })}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold focus:ring-2 focus:ring-stone-200 outline-none"
                    >
                      <option value="Bawa sample">Sample</option>
                      <option value="proposal">Proposal</option>
                      <option value="isi manual">Manual</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-0.5 md:space-y-1">
                  <label className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase ml-1">Report Visit</label>
                  <textarea
                    value={formData.reportVisit}
                    onChange={(e) => setFormData({ ...formData, reportVisit: e.target.value })}
                    rows={2}
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold focus:ring-2 focus:ring-stone-200 outline-none resize-none"
                    placeholder="Laporan kunjungan..."
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                  {/* Foto Tempat */}
                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase ml-1">Foto Tempat</label>
                    <div className="flex gap-2">
                      <div className="flex-1 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setCameraTarget('fotoTempat'); setIsCameraActive(true); }}
                          className="flex-1 py-2 md:py-3 bg-stone-50 border border-dashed border-stone-200 rounded-lg md:rounded-xl flex flex-col items-center justify-center gap-0.5 hover:bg-stone-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base md:text-lg text-stone-400">photo_camera</span>
                          <span className="text-[7px] md:text-[8px] font-black text-stone-400 uppercase">Kamera</span>
                        </button>
                        <label className="flex-1 py-2 md:py-3 bg-stone-50 border border-dashed border-stone-200 rounded-lg md:rounded-xl flex flex-col items-center justify-center gap-0.5 hover:bg-stone-100 transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-base md:text-lg text-stone-400">upload</span>
                          <span className="text-[7px] md:text-[8px] font-black text-stone-400 uppercase">File</span>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'fotoTempat')} className="hidden" />
                        </label>
                      </div>
                      {formData.fotoTempat && (
                        <div className="w-10 h-10 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden border border-stone-100 relative group shrink-0">
                          <img src={formData.fotoTempat} alt="T" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setFormData({ ...formData, fotoTempat: undefined })}
                            className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="material-symbols-outlined text-white text-xs md:text-sm">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Foto Bukti (Selfie) */}
                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase ml-1">Selfie Visit</label>
                    <div className="flex gap-2">
                      <div className="flex-1 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setCameraTarget('fotoBukti'); setIsCameraActive(true); }}
                          className="flex-1 py-2 md:py-3 bg-stone-50 border border-dashed border-stone-200 rounded-lg md:rounded-xl flex flex-col items-center justify-center gap-0.5 hover:bg-stone-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base md:text-lg text-stone-400">face</span>
                          <span className="text-[7px] md:text-[8px] font-black text-stone-400 uppercase">Selfie</span>
                        </button>
                        <label className="flex-1 py-2 md:py-3 bg-stone-50 border border-dashed border-stone-200 rounded-lg md:rounded-xl flex flex-col items-center justify-center gap-0.5 hover:bg-stone-100 transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-base md:text-lg text-stone-400">upload</span>
                          <span className="text-[7px] md:text-[8px] font-black text-stone-400 uppercase">File</span>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'fotoBukti')} className="hidden" />
                        </label>
                      </div>
                      {formData.fotoBukti && (
                        <div className="w-10 h-10 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden border border-stone-100 relative group shrink-0">
                          <img src={formData.fotoBukti} alt="B" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setFormData({ ...formData, fotoBukti: undefined })}
                            className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="material-symbols-outlined text-white text-xs md:text-sm">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Camera Overlay */}
              <AnimatePresence>
                {isCameraActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[70] bg-black flex flex-col"
                  >
                    <div className="relative flex-1">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover shadow-2xl" />
                      <div className="absolute inset-x-0 bottom-12 flex justify-center gap-6">
                        <button
                          onClick={capturePhoto}
                          className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full border-4 border-stone-300 shadow-xl active:scale-90 transition-transform"
                        />
                        <button
                          onClick={() => setIsCameraActive(false)}
                          className="w-14 h-14 md:w-16 md:h-16 bg-red-500 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
                        >
                          <span className="material-symbols-outlined text-white text-2xl">close</span>
                        </button>
                      </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-4 md:p-6 bg-stone-50 flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 md:py-4 text-stone-500 font-black text-xs uppercase tracking-widest hover:bg-stone-100 rounded-xl md:rounded-2xl transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="flex-[2] py-3 md:py-4 bg-stone-900 text-white font-black text-xs uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-stone-800 transition-all shadow-lg"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoom Image Modal */}
      <AnimatePresence>
        {zoomImage && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/90 backdrop-blur-xl"
            onClick={() => setZoomImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh]"
            >
              <img src={zoomImage} alt="Zoomed" className="w-full h-full object-contain rounded-2xl shadow-2xl" />
              <button className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-stone-900">close</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesReport;
