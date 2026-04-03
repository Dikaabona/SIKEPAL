import React, { useState, useRef, useMemo } from 'react';
import { Icons } from '../constants';
import { DeliveryRecord, Order, Store, UserRole } from '../types';

interface DeliveryModuleProps {
  title?: string;
  addButtonLabel?: string;
  hideAddButton?: boolean;
  company: string;
  orders: Order[];
  stores: Store[];
  deliveries: DeliveryRecord[];
  userRole: UserRole;
  onSaveDelivery: (delivery: DeliveryRecord) => Promise<void>;
  onDeleteDelivery: (id: string) => Promise<void>;
  initialPrefillLocation?: string;
  onPrefillHandled?: () => void;
}

const DeliveryModule: React.FC<DeliveryModuleProps> = ({ 
  title = "Delivery",
  addButtonLabel = "Add New Delivery",
  hideAddButton = false,
  company, 
  orders, 
  stores, 
  deliveries, 
  userRole,
  onSaveDelivery,
  onDeleteDelivery,
  initialPrefillLocation,
  onPrefillHandled
}) => {
  // Extract unique courier names from orders
  const courierOptions = useMemo(() => {
    const names = orders
      .map(order => order.namaKurir)
      .filter((name): name is string => !!name && name.trim() !== '');
    return Array.from(new Set(names)).sort();
  }, [orders]);

  // Extract unique location names from orders and stores
  const locationOptions = useMemo(() => {
    const orderLocations = orders
      .map(order => order.namaLokasi)
      .filter((name): name is string => !!name && name.trim() !== '');
    
    const storeLocations = stores
      .map(store => store.namaToko)
      .filter((name): name is string => !!name && name.trim() !== '');
      
    return Array.from(new Set([...orderLocations, ...storeLocations])).sort();
  }, [orders, stores]);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [formData, setFormData] = useState({
    namaKurir: '',
    tanggal: new Date().toISOString().split('T')[0],
    namaLokasi: '',
    fotoBukti: '',
    lokasiBukti: '',
    jamBukti: '',
    qtyPengiriman: 0,
    keterangan: ''
  });

  // Handle camera stream attachment when isCameraActive becomes true
  React.useEffect(() => {
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);

  const filteredLocationOptions = useMemo(() => {
    if (!locationSearchQuery.trim()) return locationOptions;
    return locationOptions.filter(name => 
      name.toLowerCase().includes(locationSearchQuery.toLowerCase())
    );
  }, [locationOptions, locationSearchQuery]);

  // Handle prefill from props
  React.useEffect(() => {
    if (initialPrefillLocation) {
      setFormData(prev => ({
        ...prev,
        namaLokasi: initialPrefillLocation,
        tanggal: new Date().toISOString().split('T')[0],
        qtyPengiriman: 0,
        keterangan: '',
        fotoBukti: '',
        lokasiBukti: '',
        jamBukti: ''
      }));
      setEditingId(null);
      setIsModalOpen(true);
      onPrefillHandled?.();
    }
  }, [initialPrefillLocation, onPrefillHandled]);

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
        // Compress to 0.7 quality to save space in Supabase
        const photoData = canvas.toDataURL('image/jpeg', 0.7);
        
        // Get current time
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Get current location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setFormData(prev => ({
                ...prev,
                fotoBukti: photoData,
                lokasiBukti: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                jamBukti: timeStr
              }));
              stopCamera();
            },
            (error) => {
              console.error("Error getting location:", error);
              setFormData(prev => ({
                ...prev,
                fotoBukti: photoData,
                jamBukti: timeStr
              }));
              stopCamera();
            }
          );
        } else {
          setFormData(prev => ({
            ...prev,
            fotoBukti: photoData,
            jamBukti: timeStr
          }));
          stopCamera();
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      const deliveryData: DeliveryRecord = {
        id: editingId || Math.random().toString(36).substr(2, 9),
        ...formData,
        qtyPengiriman: Number(formData.qtyPengiriman) || 0,
        company,
        status: 'Completed',
        createdAt: editingId 
          ? (deliveries.find(d => d.id === editingId)?.createdAt || new Date().toISOString())
          : new Date().toISOString()
      };
      
      await onSaveDelivery(deliveryData);
      closeModal();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (delivery: DeliveryRecord) => {
    setEditingId(delivery.id);
    setFormData({
      namaKurir: delivery.namaKurir,
      tanggal: delivery.tanggal,
      namaLokasi: delivery.namaLokasi,
      fotoBukti: delivery.fotoBukti || '',
      lokasiBukti: delivery.lokasiBukti || '',
      jamBukti: delivery.jamBukti || '',
      qtyPengiriman: delivery.qtyPengiriman,
      keterangan: delivery.keterangan || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    stopCamera();
    setLocationSearchQuery('');
    setIsLocationDropdownOpen(false);
    setFormData({
      namaKurir: '',
      tanggal: new Date().toISOString().split('T')[0],
      namaLokasi: '',
      fotoBukti: '',
      lokasiBukti: '',
      jamBukti: '',
      qtyPengiriman: 0,
      keterangan: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{title}</h2>
          <p className="text-xs md:text-sm text-stone-500 font-medium">
            {title === "Billing Report" ? `Laporan penagihan pengiriman untuk ${company}` : `Kelola dan pantau pengiriman Anda untuk ${company}`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] md:rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-stone-50 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-sm md:text-base">
            {title === "Billing Report" ? "Daftar Penagihan" : "Daftar Pengiriman"}
          </h3>
          {!hideAddButton && (userRole === 'owner' || userRole === 'admin') && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] md:text-xs font-bold hover:bg-stone-800 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span className="hidden sm:inline">{addButtonLabel}</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">NAMA KURIR</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">TANGGAL</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">NAMA LOKASI</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                  {title === "Billing Report" ? "BUKTI PENAGIHAN" : "BUKTI PENGIRIMAN"}
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">QTY</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">KET</th>
                {(userRole === 'owner' || userRole === 'admin') && (
                  <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">AKSI</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {deliveries.length > 0 ? (
                deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-stone-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900 text-sm">{delivery.namaKurir}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-stone-600 text-sm">{delivery.tanggal}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900 text-sm">{delivery.namaLokasi}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {delivery.fotoBukti ? (
                          <img 
                            src={delivery.fotoBukti} 
                            alt="Bukti" 
                            className="w-10 h-10 rounded-lg object-cover border border-stone-100 cursor-zoom-in hover:scale-110 transition-transform"
                            referrerPolicy="no-referrer"
                            onClick={() => setPreviewImage(delivery.fotoBukti)}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-stone-50 flex items-center justify-center text-stone-300">
                            <span className="material-symbols-outlined text-sm">image</span>
                          </div>
                        )}
                        <div className="text-[10px] leading-tight">
                          <div className="text-stone-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">location_on</span>
                            {delivery.lokasiBukti || '-'}
                          </div>
                          <div className="text-stone-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">schedule</span>
                            {delivery.jamBukti || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-100 text-stone-900 text-xs font-black">
                        {delivery.qtyPengiriman}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-stone-500 text-xs line-clamp-2 max-w-[200px]">
                        {delivery.keterangan || '-'}
                      </p>
                    </td>
                    {(userRole === 'owner' || userRole === 'admin') && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(delivery)}
                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => onDeleteDelivery(delivery.id)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-stone-300 text-3xl">local_shipping</span>
                    </div>
                    <p className="text-stone-400 font-medium">
                      {title === "Billing Report" ? "Tidak ada rekaman penagihan" : "Tidak ada rekaman pengiriman"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-stone-50">
          {deliveries.length > 0 ? (
            deliveries.map((delivery) => (
              <div key={delivery.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {delivery.fotoBukti ? (
                      <img 
                        src={delivery.fotoBukti} 
                        alt="Bukti" 
                        className="w-12 h-12 rounded-xl object-cover border border-stone-100"
                        referrerPolicy="no-referrer"
                        onClick={() => setPreviewImage(delivery.fotoBukti)}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center text-stone-300">
                        <span className="material-symbols-outlined">image</span>
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-stone-900 text-sm">{delivery.namaKurir}</div>
                      <div className="text-stone-500 text-[10px]">{delivery.tanggal}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2 py-1 rounded-lg bg-stone-100 text-stone-900 text-[10px] font-black">
                      Qty: {delivery.qtyPengiriman}
                    </span>
                    {(userRole === 'owner' || userRole === 'admin') && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(delivery)}
                          className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                        </button>
                        <button
                          onClick={() => onDeleteDelivery(delivery.id)}
                          className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-stone-50/50 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-2 text-stone-600">
                    <span className="material-symbols-outlined text-sm text-stone-400">store</span>
                    <span className="text-xs font-medium">{delivery.namaLokasi}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-stone-400">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">location_on</span>
                      {delivery.lokasiBukti || '-'}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">schedule</span>
                      {delivery.jamBukti || '-'}
                    </div>
                  </div>
                  {delivery.keterangan && (
                    <div className="pt-1 border-t border-stone-100">
                      <p className="text-[10px] text-stone-500 italic">"{delivery.keterangan}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-stone-300 text-2xl">local_shipping</span>
              </div>
              <p className="text-stone-400 text-xs font-medium">
                {title === "Billing Report" ? "Tidak ada rekaman penagihan" : "Tidak ada rekaman pengiriman"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 md:p-12">
          <div className="relative w-full h-full flex items-center justify-center">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-0 right-0 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <img 
              src={previewImage} 
              alt="Preview Bukti" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Add New Delivery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 pb-24 md:p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[75vh] md:max-h-[85vh]">
            <div className="p-6 md:p-8 border-b border-stone-50 flex items-center justify-between bg-stone-50/30 flex-shrink-0">
              <div>
                <h3 className="text-lg md:text-xl font-black text-stone-900 uppercase tracking-tight">
                  {editingId 
                    ? (title === "Billing Report" ? 'Edit Report' : 'Edit Delivery') 
                    : (title === "Billing Report" ? 'Add New Report' : 'Add New Delivery')}
                </h3>
                {editingId && (
                  <p className="text-[10px] md:text-xs text-stone-500 font-medium">
                    {title === "Billing Report" ? 'Perbarui detail penagihan' : 'Perbarui detail pengiriman'}
                  </p>
                )}
              </div>
              <button 
                onClick={closeModal}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-sm md:text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar flex-1 pb-10 md:pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nama Kurir</label>
                    <select
                      required
                      value={formData.namaKurir}
                      onChange={(e) => setFormData({...formData, namaKurir: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl bg-stone-50 border-none focus:ring-2 focus:ring-stone-900 transition-all text-sm font-medium appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Pilih Kurir</option>
                      {courierOptions.length > 0 ? (
                        courierOptions.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))
                      ) : (
                        <option value="" disabled>Tidak ada data kurir</option>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tanggal</label>
                    <input
                      required
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl bg-stone-50 border-none focus:ring-2 focus:ring-stone-900 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nama Lokasi</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Cari atau pilih lokasi..."
                      value={isLocationDropdownOpen ? locationSearchQuery : formData.namaLokasi}
                      onFocus={() => {
                        setIsLocationDropdownOpen(true);
                        setLocationSearchQuery(formData.namaLokasi);
                      }}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-stone-50 border-none focus:ring-2 focus:ring-stone-900 transition-all text-sm font-medium pr-10"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                      {isLocationDropdownOpen ? 'search' : 'expand_more'}
                    </span>
                  </div>

                  {isLocationDropdownOpen && (
                    <div className="absolute z-[70] left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredLocationOptions.length > 0 ? (
                          filteredLocationOptions.map(name => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, namaLokasi: name});
                                setLocationSearchQuery('');
                                setIsLocationDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-none flex items-center justify-between group"
                            >
                              <span className={formData.namaLokasi === name ? 'text-stone-900 font-bold' : 'text-stone-600'}>
                                {name}
                              </span>
                              {formData.namaLokasi === name && (
                                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center">
                            <span className="material-symbols-outlined text-stone-200 text-2xl mb-2">location_off</span>
                            <p className="text-xs text-stone-400 font-medium">Lokasi tidak ditemukan</p>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({...formData, namaLokasi: locationSearchQuery});
                                setLocationSearchQuery('');
                                setIsLocationDropdownOpen(false);
                              }}
                              className="mt-3 text-[10px] font-black uppercase text-primary hover:underline"
                            >
                              Gunakan "{locationSearchQuery}"
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Backdrop to close dropdown */}
                  {isLocationDropdownOpen && (
                    <div 
                      className="fixed inset-0 z-[65]" 
                      onClick={() => {
                        setIsLocationDropdownOpen(false);
                        setLocationSearchQuery('');
                      }}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
                      {title === "Billing Report" ? "Qty Penagihan" : "Qty Pengiriman"}
                    </label>
                    <input
                      required
                      type="number"
                      value={formData.qtyPengiriman}
                      onChange={(e) => setFormData({...formData, qtyPengiriman: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 rounded-2xl bg-stone-50 border-none focus:ring-2 focus:ring-stone-900 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Jam Bukti</label>
                    <input
                      readOnly
                      type="text"
                      value={formData.jamBukti}
                      placeholder="Otomatis saat foto"
                      className="w-full px-4 py-3 rounded-2xl bg-stone-100 border-none text-sm font-medium text-stone-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
                    {title === "Billing Report" ? "Bukti Penagihan (Selfie/Foto)" : "Bukti Pengiriman (Selfie/Foto)"}
                  </label>
                  
                  {isCameraActive ? (
                    <div className="relative rounded-3xl overflow-hidden bg-black aspect-video border-4 border-stone-900 shadow-xl">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-stone-900 shadow-lg hover:scale-110 transition-transform"
                        >
                          <span className="material-symbols-outlined text-3xl">photo_camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
                        >
                          <span className="material-symbols-outlined text-3xl">close</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.fotoBukti ? (
                        <div className="relative rounded-3xl overflow-hidden border-4 border-stone-900 shadow-xl aspect-video">
                          <img 
                            src={formData.fotoBukti} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={startCamera}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-stone-900 shadow-lg"
                          >
                            <span className="material-symbols-outlined">refresh</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="w-full py-12 rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-3 text-stone-400 hover:bg-stone-100 hover:border-stone-300 transition-all"
                        >
                          <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                          <span className="text-xs font-bold uppercase tracking-widest">Ambil Foto Bukti</span>
                        </button>
                      )}
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Lokasi Bukti (Otomatis)</label>
                  <div className="relative">
                    <input
                      readOnly
                      type="text"
                      value={formData.lokasiBukti}
                      placeholder="Otomatis saat foto"
                      className="w-full px-4 py-3 rounded-2xl bg-stone-100 border-none text-sm font-medium text-stone-500 cursor-not-allowed pl-10"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">location_on</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Keterangan</label>
                  <textarea
                    value={formData.keterangan}
                    onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                    placeholder="Catatan tambahan..."
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 border-none focus:ring-2 focus:ring-stone-900 transition-all text-sm font-medium h-24 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 md:p-8 pt-4 pb-12 md:pb-8 border-t border-stone-50 flex gap-3 md:gap-4 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl bg-stone-100 text-stone-600 text-xs md:text-sm font-bold hover:bg-stone-200 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!formData.fotoBukti || isSaving}
                  className={`flex-1 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl text-white text-xs md:text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                    formData.fotoBukti && !isSaving
                      ? 'bg-stone-900 hover:bg-stone-800 shadow-stone-900/20' 
                      : 'bg-stone-300 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    editingId ? 'Perbarui' : 'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryModule;
