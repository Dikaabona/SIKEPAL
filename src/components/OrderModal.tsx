import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, Employee, Store, UserRole } from '../types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Partial<Order>;
  onSave: (order: Order) => Promise<void>;
  employees: Employee[];
  stores: Store[];
  currentUserEmployee: Employee | null;
  userRole: UserRole;
  company: string;
}

const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onSave,
  employees,
  stores,
  currentUserEmployee,
  userRole,
  company
}) => {
  const [formData, setFormData] = useState<Partial<Order>>(order);
  const [lokasiSearch, setLokasiSearch] = useState('');
  const [showLokasiDropdown, setShowLokasiDropdown] = useState(false);

  useEffect(() => {
    setFormData(order);
    setLokasiSearch(order.namaLokasi || '');
  }, [order, isOpen]);

  const handleSave = async () => {
    if (!formData.namaLokasi || !formData.tanggal) {
      alert('Nama Lokasi dan Tanggal wajib diisi');
      return;
    }

    const isKurir = currentUserEmployee?.division?.toLowerCase() === 'kurir';
    let initialStatus: 'Pending' | 'Approved' | 'Rejected' = 'Approved';
    
    if (!formData.id) {
      if (isKurir) {
        initialStatus = 'Pending';
      } else {
        initialStatus = (formData.status as any) || 'Approved';
      }
    } else {
      initialStatus = formData.status || 'Approved';
    }

    const orderToSave: Order = {
      id: formData.id || `order_${Date.now()}`,
      tanggal: formData.tanggal || '',
      namaKurir: formData.namaKurir || '',
      employeeId: formData.employeeId || '',
      namaLokasi: formData.namaLokasi || '',
      tunaPedes: Number(formData.tunaPedes) || 0,
      tunaMayo: Number(formData.tunaMayo) || 0,
      ayamMayo: Number(formData.ayamMayo) || 0,
      ayamPedes: Number(formData.ayamPedes) || 0,
      menuBulanan: Number(formData.menuBulanan) || 0,
      jumlahKirim: Number(formData.jumlahKirim) || 0,
      hargaSikepal: Number(formData.hargaSikepal) || 0,
      periodeBayar: formData.periodeBayar || '',
      sisa: Number(formData.sisa) || 0,
      jumlahPiutang: Number(formData.jumlahPiutang) || 0,
      jumlahUang: Number(formData.jumlahUang) || 0,
      pembayaran: formData.pembayaran || '',
      tanggalBayar: formData.tanggalBayar || '',
      nilaiPembayaran: Number(formData.nilaiPembayaran) || 0,
      waste: Number(formData.waste) || 0,
      diskon: Number(formData.diskon) || 0,
      company: company,
      updatedAt: new Date().toISOString(),
      status: initialStatus
    };

    await onSave(orderToSave);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[500px] md:max-w-4xl overflow-hidden"
          >
            <div className="p-5 md:p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <h3 className="text-lg font-black text-stone-800 uppercase tracking-tight">
                {formData.id ? 'Edit Order' : 'Tambah Order Baru'}
              </h3>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Section 1: Data Utama */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
                <div className="md:col-span-3 mb-1">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Informasi Utama</h4>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tanggal *</label>
                  <input 
                    type="date" 
                    value={formData.tanggal}
                    onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nama Kurir</label>
                  <select 
                    value={formData.employeeId || ''}
                    onChange={(e) => {
                      const emp = employees.find(emp => emp.id === e.target.value);
                      setFormData({
                        ...formData, 
                        employeeId: e.target.value,
                        namaKurir: emp ? emp.nama : ''
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Pilih Kurir</option>
                    {employees
                      .filter(emp => emp.division?.toLowerCase() === 'kurir' || emp.jabatan?.toLowerCase() === 'kurir')
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.nama}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nama Lokasi *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Cari lokasi..."
                      value={lokasiSearch}
                      onChange={(e) => {
                        setLokasiSearch(e.target.value);
                        setShowLokasiDropdown(true);
                      }}
                      onFocus={() => setShowLokasiDropdown(true)}
                      className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-stone-400 text-sm pointer-events-none">
                      search
                    </span>
                  </div>
                  
                  {showLokasiDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-[105]" 
                        onClick={() => setShowLokasiDropdown(false)} 
                      />
                      <div className="absolute z-[110] left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                        {stores
                          .filter(s => s.namaToko.toLowerCase().includes(lokasiSearch.toLowerCase()))
                          .map(store => (
                            <button
                              key={store.id}
                              type="button"
                              onClick={() => {
                                const rawPrice = store.harga || '0';
                                const numericPrice = parseInt(rawPrice.replace(/[^0-9]/g, '')) || 0;
                                
                                setFormData({
                                  ...formData, 
                                  namaLokasi: store.namaToko,
                                  hargaSikepal: numericPrice
                                });
                                setLokasiSearch(store.namaToko);
                                setShowLokasiDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0"
                            >
                              {store.namaToko}
                            </button>
                          ))
                        }
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 2: Varian Produk */}
              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-6 gap-3 bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
                <div className="col-span-2 md:col-span-6 mb-1">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Varian Produk</h4>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tuna Pedes</label>
                  <input 
                    type="number" 
                    value={formData.tunaPedes}
                    onChange={(e) => setFormData({...formData, tunaPedes: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tuna Mayo</label>
                  <input 
                    type="number" 
                    value={formData.tunaMayo}
                    onChange={(e) => setFormData({...formData, tunaMayo: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Ayam Mayo</label>
                  <input 
                    type="number" 
                    value={formData.ayamMayo}
                    onChange={(e) => setFormData({...formData, ayamMayo: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Ayam Pedes</label>
                  <input 
                    type="number" 
                    value={formData.ayamPedes}
                    onChange={(e) => setFormData({...formData, ayamPedes: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Menu Bulanan</label>
                  <input 
                    type="number" 
                    value={formData.menuBulanan}
                    onChange={(e) => setFormData({...formData, menuBulanan: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Jumlah Kirim</label>
                  <input 
                    type="number" 
                    value={formData.jumlahKirim}
                    onChange={(e) => setFormData({...formData, jumlahKirim: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Section 3: Detail Harga & Pembayaran */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
                <div className="md:col-span-3 mb-1">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Harga & Bayar</h4>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Harga Sikepal</label>
                  <input 
                    type="number" 
                    value={formData.hargaSikepal}
                    onChange={(e) => setFormData({...formData, hargaSikepal: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Periode Bayar</label>
                  <select 
                    value={formData.periodeBayar}
                    onChange={(e) => setFormData({...formData, periodeBayar: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Pilih Periode</option>
                    <option value="Harian">Harian</option>
                    <option value="Mingguan">Mingguan</option>
                    <option value="Bulanan">Bulanan</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Pembayaran</label>
                  <select 
                    value={formData.pembayaran}
                    onChange={(e) => setFormData({...formData, pembayaran: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Pilih Status</option>
                    <option value="FALSE">BELUM LUNAS</option>
                    <option value="TRUE">LUNAS</option>
                  </select>
                </div>
              </div>

              {/* Section 4: Detail Keuangan (Advanced) - Hidden for Kurir */}
              {currentUserEmployee?.division?.toLowerCase() !== 'kurir' && (
                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3 bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
                  <div className="col-span-2 md:col-span-4 mb-1">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Detail Keuangan</h4>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Sisa</label>
                    <input 
                      type="number" 
                      value={formData.sisa}
                      onChange={(e) => setFormData({...formData, sisa: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Jumlah Uang</label>
                    <input 
                      type="number" 
                      value={formData.jumlahUang}
                      onChange={(e) => setFormData({...formData, jumlahUang: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tanggal Bayar</label>
                    <input 
                      type="date" 
                      value={formData.tanggalBayar}
                      onChange={(e) => setFormData({...formData, tanggalBayar: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nilai Bayar</label>
                    <input 
                      type="number" 
                      value={formData.nilaiPembayaran || 0}
                      onChange={(e) => setFormData({...formData, nilaiPembayaran: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Waste (%)</label>
                    <input 
                      type="number" 
                      value={formData.waste || 0}
                      onChange={(e) => setFormData({...formData, waste: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Diskon</label>
                    <input 
                      type="number" 
                      value={formData.diskon}
                      onChange={(e) => setFormData({...formData, diskon: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  {(userRole === 'admin' || userRole === 'owner') && (
                    <div className="space-y-1 col-span-2 md:col-span-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Status Approval</label>
                      <select 
                        value={formData.status || 'Approved'}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 md:p-6 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2 text-stone-500 font-bold text-sm hover:bg-stone-100 rounded-xl transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleSave}
                className="px-8 py-2 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                Simpan Data
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OrderModal;
