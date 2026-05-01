import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage } from '../utils/imageUtils';
import { Icons } from '../constants';
import { DeliveryRecord, Order, Store, UserRole, Employee } from '../types';
import { formatDate, getLocalDateString, parseIndoDate } from '../lib/utils';

interface KeteranganInputProps {
  value: string;
  onChange: (val: string) => void;
  isKeteranganRequired?: boolean;
}

const KeteranganInput: React.FC<KeteranganInputProps> = React.memo(({ value, onChange, isKeteranganRequired }) => {
  const [localValue, setLocalValue] = React.useState(value);
  const skipSyncRef = useRef(false);

  // Sync with external changes (e.g. when modal opens or record changes)
  React.useEffect(() => {
    if (!skipSyncRef.current) {
      setLocalValue(value);
    }
    skipSyncRef.current = false;
  }, [value]);

  // Handle local change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalValue(val);
  };

  // Sync back to parent on blur or debounced
  const syncToParent = React.useCallback((val: string) => {
    if (val !== value) {
      skipSyncRef.current = true;
      onChange(val);
    }
  }, [onChange, value]);

  // Debounced update to parent (longer delay to prevent jank while typing)
  React.useEffect(() => {
    const timer = setTimeout(() => syncToParent(localValue), 1200);
    return () => clearTimeout(timer);
  }, [localValue, syncToParent]);

  return (
    <textarea
      value={localValue}
      onChange={handleChange}
      onBlur={() => syncToParent(localValue)}
      placeholder={isKeteranganRequired ? "Wajib diisi karena waste > 20%..." : "Catatan tambahan..."}
      className={`w-full px-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-stone-900 transition-all text-sm font-medium h-24 resize-none ${
        isKeteranganRequired && !localValue.trim() ? 'bg-red-50 ring-1 ring-red-200' : 'bg-stone-50'
      }`}
    />
  );
});

interface DeliveryModuleProps {
  title?: string;
  addButtonLabel?: string;
  hideAddButton?: boolean;
  company: string;
  orders: Order[];
  stores: Store[];
  deliveries: DeliveryRecord[];
  userRole: UserRole;
  employees: Employee[]; // Add employees to props
  currentUserName?: string;
  currentUserDivision?: string;
  onSaveDelivery: (delivery: DeliveryRecord) => Promise<void>;
  onDeleteDelivery: (id: string) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onSaveOrder?: (order: Order) => Promise<void>; // Add onSaveOrder
  initialPrefillLocation?: string;
  initialPrefillCourier?: string;
  onPrefillHandled?: () => void;
  onCancel?: () => void;
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
  employees = [], // Default to empty array
  currentUserName,
  currentUserDivision,
  onSaveDelivery,
  onDeleteDelivery,
  onBulkDelete,
  onSaveOrder,
  initialPrefillLocation,
  initialPrefillCourier,
  onPrefillHandled,
  onCancel
}) => {
  // Extract unique courier names from orders
  const courierOptions = useMemo(() => {
    // SECURITY: If kurir in Billing Report or Delivery Report, they can ONLY see their own name
    if ((title === "Billing Report" || title === "Delivery Report") && currentUserDivision?.toLowerCase() === 'kurir') {
      return [currentUserName || ''].filter(Boolean);
    }

    const names = orders
      .map(order => order.namaKurir)
      .filter((name): name is string => !!name && name.trim() !== '');
    return Array.from(new Set(names)).sort();
  }, [orders]);

  const [formData, setFormData] = useState({
    namaKurir: currentUserDivision?.toLowerCase() === 'kurir' && (title === "Billing Report" || title === "Delivery Report") ? currentUserName || '' : '',
    tanggal: getLocalDateString(),
    namaLokasi: '',
    fotoBukti: '',
    lokasiBukti: '',
    jamBukti: '',
    qtyPengiriman: 0,
    sisa: '' as any,
    originalNilai: 0,
    hargaSikepal: 0,
    metodePembayaran: '',
    buktiTransfer: '',
    buktiSisa: '',
    keterangan: '',
    selectedOrderId: '',
    tanggalPiutang: '',
    jumlahKirim: 0
  });

  const handleKeteranganChange = React.useCallback((val: string) => {
    setFormData(prev => ({ ...prev, keterangan: val }));
  }, []);

  // Extract unique location names from orders and stores
  const locationOptions = useMemo(() => {
    const selectedCourier = formData.namaKurir;
    const selectedDate = formData.tanggal;

    const orderLocations = orders
      .filter(order => {
        const matchesCourier = !selectedCourier || order.namaKurir === selectedCourier;
        const orderDateObj = parseIndoDate(order.tanggal);
        const orderDateStr = orderDateObj ? getLocalDateString(orderDateObj) : order.tanggal;
        const matchesDate = orderDateStr === selectedDate;
        return matchesCourier && matchesDate;
      })
      .map(order => order.namaLokasi)
      .filter((name): name is string => !!name && name.trim() !== '');
    
    // For Delivery Report, only show locations from orders of that day
    if (title === "Delivery Report") {
      return Array.from(new Set(orderLocations)).sort();
    }

    const storeLocations = stores
      .filter(store => !selectedCourier || store.kurir === selectedCourier)
      .map(store => store.namaToko)
      .filter((name): name is string => !!name && name.trim() !== '');
      
    return Array.from(new Set([...orderLocations, ...storeLocations])).sort();
  }, [orders, stores, formData.namaKurir, formData.tanggal, title]);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'fotoBukti' | 'buktiTransfer' | 'buktiSisa'>('fotoBukti');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const startCamera = (target: 'fotoBukti' | 'buktiTransfer' | 'buktiSisa' = 'fotoBukti') => {
    setCameraTarget(target);
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
  const [isPiutangModalOpen, setIsPiutangModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedPiutangIds, setSelectedPiutangIds] = useState<string[]>([]);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
  const wasPrefilled = useRef(false);

  // States for Editing Order from Delivery Report
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isOrderEditModalOpen, setIsOrderEditModalOpen] = useState(false);
  const [orderLokasiSearch, setOrderLokasiSearch] = useState('');
  const [showOrderLokasiDropdown, setShowOrderLokasiDropdown] = useState(false);

  // Filters for Billing/Delivery Report
  const [filterCourier, setFilterCourier] = useState(() => 
    currentUserDivision?.toLowerCase() === 'kurir' ? currentUserName || '' : ''
  );
  const [filterDate, setFilterDate] = useState(getLocalDateString());
  const [filterEndDate, setFilterEndDate] = useState('');
  const [printData, setPrintData] = useState<{ delivery: DeliveryRecord; order?: Order } | null>(null);

  // Print effect
  React.useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
        setPrintData(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printData]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      // SECURITY: If kurir in Billing Report or Delivery Report, they can ONLY see their own data
      if ((title === "Billing Report" || title === "Delivery Report") && currentUserDivision?.toLowerCase() === 'kurir') {
        if (d.namaKurir !== currentUserName) return false;
      }

      const matchesCourier = !filterCourier || d.namaKurir === filterCourier;
      
      let matchesDate = true;
      if (filterDate && filterEndDate) {
        matchesDate = d.tanggal >= filterDate && d.tanggal <= filterEndDate;
      } else if (filterDate) {
        matchesDate = d.tanggal === filterDate;
      } else if (filterEndDate) {
        matchesDate = d.tanggal <= filterEndDate;
      }

      return matchesCourier && matchesDate;
    });
  }, [deliveries, filterCourier, filterDate, filterEndDate]);

  const summary = useMemo(() => {
    if (title === "Billing Report") {
      const totalNilai = filteredDeliveries.reduce((sum, d) => sum + (Number(d.qtyPengiriman) || 0), 0);
      const totalSisa = filteredDeliveries.reduce((sum, d) => sum + (Number(d.sisa) || 0), 0);
      const uniqueLocations = new Set(filteredDeliveries.map(d => d.namaLokasi)).size;
      const totalPenagihan = filteredDeliveries.filter(d => 
        !d.metodePembayaran || d.metodePembayaran === 'Cash' || d.metodePembayaran === 'Transfer'
      ).length;

      const totalCash = filteredDeliveries
        .filter(d => !d.metodePembayaran || d.metodePembayaran === 'Cash')
        .reduce((sum, d) => sum + (Number(d.qtyPengiriman) || 0), 0);
      
      const totalTransfer = filteredDeliveries
        .filter(d => d.metodePembayaran === 'Transfer')
        .reduce((sum, d) => sum + (Number(d.qtyPengiriman) || 0), 0);

      const totalPiutang = filteredDeliveries
        .filter(d => d.metodePembayaran === 'Piutang')
        .reduce((sum, d) => sum + (Number(d.qtyPengiriman) || 0), 0);

      return {
        totalNilai,
        totalSisa,
        uniqueLocations,
        totalPenagihan,
        totalCash,
        totalTransfer,
        totalPiutang
      };
    } else if (title === "Delivery Report") {
      const uniqueLocations = new Set(filteredDeliveries.map(d => d.namaLokasi)).size;
      const totalQty = filteredDeliveries.reduce((sum, d) => sum + (Number(d.qtyPengiriman) || 0), 0);
      
      return {
        uniqueLocations,
        totalQty
      };
    }
    
    return null;
  }, [filteredDeliveries, deliveries, title]);

  // Piutang Modal States
  const [piutangSearchQuery, setPiutangSearchQuery] = useState('');
  const [piutangFilterKurir, setPiutangFilterKurir] = useState('');

  // Initialize filter with formData.namaKurir when modal opens
  React.useEffect(() => {
    if (isPiutangModalOpen) {
      setPiutangFilterKurir(formData.namaKurir || '');
      // Only clear search if it's not already set (e.g. by prefill)
      if (!piutangSearchQuery) {
        setPiutangSearchQuery('');
      }
    }
  }, [isPiutangModalOpen, formData.namaKurir]);

  const filteredPiutangOrders = useMemo(() => {
    // Get all orderIds that are already in the billing reports
    // If we are editing, we exclude the current record's orderId from being blocked
    const existingOrderIds = new Set(
      deliveries
        .filter(d => d.id !== editingId)
        .map(d => d.orderId)
        .filter(Boolean)
    );

    return orders
      .filter(o => {
        const isUnpaid = o.pembayaran?.toUpperCase() === 'FALSE';
        const isAlreadyReported = existingOrderIds.has(o.id);
        const matchesKurir = !piutangFilterKurir || o.namaKurir === piutangFilterKurir;
        const matchesSearch = !piutangSearchQuery || 
          o.namaLokasi.toLowerCase().includes(piutangSearchQuery.toLowerCase()) ||
          o.namaKurir?.toLowerCase().includes(piutangSearchQuery.toLowerCase());
        
        return isUnpaid && !isAlreadyReported && matchesKurir && matchesSearch;
      })
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [orders, piutangFilterKurir, piutangSearchQuery, deliveries, editingId]);

  // Reset to page 1 when deliveries list changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredDeliveries.length]);

  const paginatedDeliveries = useMemo(() => {
    if (itemsPerPage === 'all') return filteredDeliveries;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDeliveries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDeliveries, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    if (itemsPerPage === 'all') return 1;
    return Math.ceil(filteredDeliveries.length / itemsPerPage);
  }, [filteredDeliveries, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds([]); // Clear selection when page changes
    // Scroll to top of table/container if needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredLocationOptions = useMemo(() => {
    if (!locationSearchQuery.trim()) return locationOptions;
    return locationOptions.filter(name => 
      name.toLowerCase().includes(locationSearchQuery.toLowerCase())
    );
  }, [locationOptions, locationSearchQuery]);

  const currentWastePercent = useMemo(() => {
    const currentNilai = Number(formData.qtyPengiriman) || 0;
    const origNilai = Number(formData.originalNilai) || 0;
    return origNilai > 0 ? ((origNilai - currentNilai) / origNilai) * 100 : 0;
  }, [formData.qtyPengiriman, formData.originalNilai]);

  const isKeteranganRequired = title === "Billing Report" && currentWastePercent > 20;

  // Handle prefill from props
  React.useEffect(() => {
    if (initialPrefillLocation) {
      wasPrefilled.current = true;
      setFormData(prev => ({
        ...prev,
        namaLokasi: initialPrefillLocation,
        namaKurir: initialPrefillCourier || prev.namaKurir,
        tanggal: getLocalDateString(),
        qtyPengiriman: 0,
        keterangan: '',
        fotoBukti: '',
        lokasiBukti: '',
        jamBukti: ''
      }));
      setEditingId(null);
      setIsModalOpen(true);
      
      // If it's a billing report, automatically open piutang modal and search for this location
      if (title === "Billing Report") {
        setIsPiutangModalOpen(true);
        setPiutangSearchQuery(initialPrefillLocation);
      }
      
      onPrefillHandled?.();
    }
  }, [initialPrefillLocation, initialPrefillCourier, onPrefillHandled, title]);

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
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        
        const processPhoto = async () => {
          let finalData = photoData;
          try {
            finalData = await compressImage(photoData);
          } catch (err) {
            console.error('Compression error:', err);
          }

          // Get current time
          const now = new Date();
          const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
          
          // Get current location
          if (navigator.geolocation && cameraTarget === 'fotoBukti') {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                  ...prev,
                  [cameraTarget]: finalData,
                  lokasiBukti: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                  jamBukti: timeStr
                }));
                stopCamera();
              },
              (error) => {
                console.error("Error getting location:", error);
                setFormData(prev => ({
                  ...prev,
                  [cameraTarget]: finalData,
                  jamBukti: timeStr
                }));
                stopCamera();
              }
            );
          } else {
            setFormData(prev => ({
              ...prev,
              [cameraTarget]: finalData,
              ...(cameraTarget === 'fotoBukti' ? { jamBukti: timeStr } : {})
            }));
            stopCamera();
          }
        };

        processPhoto();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      const { 
        selectedOrderId, 
        originalNilai, 
        hargaSikepal: _h, 
        jumlahKirim: _j, 
        ...restFormData 
      } = formData;
      
      const currentNilai = Number(formData.qtyPengiriman) || 0;
      const origNilai = Number(formData.originalNilai) || 0;
      const wastePercent = origNilai > 0 ? ((origNilai - currentNilai) / origNilai) * 100 : 0;

      const deliveryData: any = {
        id: editingId || Math.random().toString(36).substr(2, 9),
        namaKurir: restFormData.namaKurir,
        tanggal: restFormData.tanggal,
        namaLokasi: restFormData.namaLokasi,
        fotoBukti: restFormData.fotoBukti || null,
        lokasiBukti: restFormData.lokasiBukti || null,
        jamBukti: restFormData.jamBukti || null,
        qtyPengiriman: currentNilai,
        sisa: Number(formData.sisa) || 0,
        hargaSikepal: Number(formData.hargaSikepal) || 0,
        metodePembayaran: formData.metodePembayaran || null,
        buktiTransfer: formData.buktiTransfer || null,
        buktiSisa: formData.buktiSisa || null,
        waste: wastePercent,
        tanggalPiutang: formData.tanggalPiutang || null,
        keterangan: formData.keterangan || '',
        company,
        status: editingId 
          ? (deliveries.find(d => d.id === editingId)?.status || 'Completed')
          : (title === "Billing Report" ? 'Pending' : 'Completed'),
        orderId: selectedOrderId || null,
        createdAt: editingId 
          ? (deliveries.find(d => d.id === editingId)?.createdAt || new Date().toISOString())
          : new Date().toISOString()
      };
      
      await onSaveDelivery(deliveryData);
      
      // Auto-print after save if it's a new delivery
      if (!editingId) {
        const associatedOrder = orders.find(o => o.id === deliveryData.orderId);
        setPrintData({ delivery: deliveryData, order: associatedOrder });
      }

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
      sisa: delivery.sisa || 0,
      hargaSikepal: delivery.hargaSikepal || 0,
      metodePembayaran: delivery.metodePembayaran || '',
      buktiTransfer: delivery.buktiTransfer || '',
      buktiSisa: delivery.buktiSisa || '',
      originalNilai: (delivery.qtyPengiriman || 0) + ((delivery.sisa || 0) * (delivery.hargaSikepal || 0)),
      keterangan: delivery.keterangan || '',
      selectedOrderId: delivery.orderId || '',
      tanggalPiutang: delivery.tanggalPiutang || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = (shouldTriggerCancel: boolean = false) => {
    setIsModalOpen(false);
    setIsPiutangModalOpen(false);
    setEditingId(null);
    setSelectedIds([]);
    stopCamera();
    setLocationSearchQuery('');
    setIsLocationDropdownOpen(false);
    setFormData({
      namaKurir: '',
      tanggal: getLocalDateString(),
      namaLokasi: '',
      fotoBukti: '',
      lokasiBukti: '',
      jamBukti: '',
      qtyPengiriman: 0,
      sisa: '' as any,
      originalNilai: 0,
      hargaSikepal: 0,
      metodePembayaran: '',
      buktiTransfer: '',
      buktiSisa: '',
      keterangan: '',
      selectedOrderId: '',
      tanggalPiutang: '',
      jumlahKirim: 0
    });
    if (shouldTriggerCancel && wasPrefilled.current) {
      wasPrefilled.current = false;
      onCancel?.();
    }
    // Always reset prefilled flag if closing
    wasPrefilled.current = false;
  };

  const handleBulkPiutangSave = async () => {
    if (selectedPiutangIds.length === 0 || isSaving) return;
    
    let successCount = 0;
    let failCount = 0;
    
    try {
      setIsSaving(true);
      const selectedOrders = orders.filter(o => selectedPiutangIds.includes(o.id));
      
      for (const order of selectedOrders) {
        try {
          const deliveryData: any = {
            id: `BR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            namaKurir: order.namaKurir,
            tanggal: getLocalDateString(),
            namaLokasi: order.namaLokasi,
            fotoBukti: null,
            lokasiBukti: null,
            jamBukti: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
            qtyPengiriman: order.jumlahUang,
            sisa: order.sisa || 0,
            hargaSikepal: order.hargaSikepal || 0,
            metodePembayaran: 'Cash',
            buktiTransfer: null,
            buktiSisa: null,
            waste: 0,
            tanggalPiutang: order.tanggal,
            keterangan: 'Proses Massal',
            company,
            status: 'Pending',
            orderId: order.id,
            createdAt: new Date().toISOString()
          };
          await onSaveDelivery(deliveryData);
          successCount++;
        } catch (err) {
          console.error(`Failed to save order ${order.id}:`, err);
          failCount++;
        }
      }
      
      if (failCount === 0) {
        alert(`Berhasil memproses ${successCount} data billing report secara massal.`);
      } else {
        alert(`Selesai dengan catatan: ${successCount} berhasil, ${failCount} gagal. Pastikan tabel SQL sudah sesuai.`);
      }
      
      setSelectedPiutangIds([]);
      setIsPiutangModalOpen(false);
      closeModal();
    } catch (error) {
      console.error('Error in handleBulkPiutangSave:', error);
      alert('Terjadi kesalahan sistem saat proses massal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedDeliveries.map(d => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (onBulkDelete && selectedIds.length > 0) {
      await onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
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

      {title === "Billing Report" && summary && (
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          <div className="bg-white p-2 md:p-6 rounded-2xl md:rounded-[32px] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 md:mb-4">
              <span className="material-symbols-outlined text-base md:text-xl">account_balance_wallet</span>
            </div>
            <div className="text-[7px] md:text-[10px] font-black text-stone-400 uppercase tracking-tight md:tracking-[0.2em] mb-1.5">Metode Bayar</div>
            <div className="space-y-1 md:space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[7px] md:text-[10px] font-bold text-stone-500 uppercase">Cash:</span>
                <span className="text-[9px] md:text-sm font-black text-stone-900 whitespace-nowrap">Rp {summary.totalCash?.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[7px] md:text-[10px] font-bold text-stone-500 uppercase">Transfer:</span>
                <span className="text-[9px] md:text-sm font-black text-blue-600 whitespace-nowrap">Rp {summary.totalTransfer?.toLocaleString('id-ID')}</span>
              </div>
              <div className="border-t border-stone-100 my-1 pt-1 opacity-50"></div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[7px] md:text-[10px] font-bold text-stone-500 uppercase">Jumlah:</span>
                <span className="text-[9px] md:text-sm font-black text-stone-900 whitespace-nowrap">Rp {((summary.totalCash || 0) + (summary.totalTransfer || 0)).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[7px] md:text-[10px] font-bold text-stone-500 uppercase">Piutang:</span>
                <span className="text-[9px] md:text-sm font-black text-orange-600 whitespace-nowrap">Rp {summary.totalPiutang?.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-2 md:p-6 rounded-2xl md:rounded-[32px] border border-stone-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 md:mb-4">
                <span className="material-symbols-outlined text-base md:text-xl">store</span>
              </div>
              <div className="text-[7px] md:text-[10px] font-black text-stone-400 uppercase tracking-tight md:tracking-[0.2em] mb-1">Jumlah Lokasi</div>
              <div className="flex items-baseline gap-1 md:gap-2">
                <span className="text-base md:text-2xl font-black text-stone-900 leading-none">{summary.uniqueLocations}</span>
                <span className="text-[7px] md:text-[10px] text-stone-400 font-bold uppercase tracking-widest">Titik</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-2 md:p-6 rounded-2xl md:rounded-[32px] border border-stone-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 md:mb-4">
                <span className="material-symbols-outlined text-base md:text-xl">receipt_long</span>
              </div>
              <div className="text-[7px] md:text-[10px] font-black text-stone-400 uppercase tracking-tight md:tracking-[0.2em] mb-1">Jumlah Penagihan</div>
              <div className="flex items-baseline gap-1 md:gap-2">
                <span className="text-base md:text-2xl font-black text-stone-900 leading-none">{summary.totalPenagihan}</span>
                <span className="text-[7px] md:text-[10px] text-stone-400 font-bold uppercase tracking-widest">Data</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {title === "Delivery Report" && summary && (
        <div className="grid grid-cols-2 gap-3 md:gap-6">
          <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 md:mb-4 shadow-inner">
              <span className="material-symbols-outlined text-xl md:text-2xl">storefront</span>
            </div>
            <div className="text-[8px] md:text-[10px] font-black text-stone-400 uppercase tracking-[0.1em] md:tracking-[0.2em] mb-1">Jumlah Lokasi</div>
            <div className="flex items-baseline gap-1 md:gap-2">
              <span className="text-xl md:text-3xl font-black text-stone-900 leading-none">{summary.uniqueLocations}</span>
              <span className="text-[8px] md:text-xs text-stone-400 font-bold uppercase tracking-widest">Titik</span>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 md:mb-4 shadow-inner">
              <span className="material-symbols-outlined text-xl md:text-2xl">inventory_2</span>
            </div>
            <div className="text-[8px] md:text-[10px] font-black text-stone-400 uppercase tracking-[0.1em] md:tracking-[0.2em] mb-1">Total Qty</div>
            <div className="flex items-baseline gap-1 md:gap-2">
              <span className="text-xl md:text-3xl font-black text-stone-900 leading-none">{summary.totalQty?.toLocaleString('id-ID')}</span>
              <span className="text-[8px] md:text-xs text-stone-400 font-bold uppercase tracking-widest">Pcs</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[24px] md:rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-stone-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-stone-900 text-sm md:text-base">
            {title === "Billing Report" ? "Daftar Penagihan" : "Daftar Pengiriman"}
          </h3>
          
          <div className="flex flex-wrap items-center gap-3">
            {(title === "Billing Report" || title === "Delivery Report") && (
              <>
                {!((title === "Billing Report" || title === "Delivery Report") && currentUserDivision?.toLowerCase() === 'kurir') && (
                  <div className="relative min-w-[160px]">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-lg">person</span>
                    <select
                      value={filterCourier}
                      onChange={(e) => setFilterCourier(e.target.value)}
                      className="w-full pl-11 pr-8 py-2.5 rounded-full bg-stone-50 border border-stone-100 focus:ring-2 focus:ring-stone-200 focus:bg-white outline-none transition-all text-[11px] font-black text-stone-800 uppercase appearance-none cursor-pointer tracking-wider shadow-sm"
                    >
                      <option value="">Semua Kurir</option>
                      {courierOptions.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[140px] flex-1 md:flex-none">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">calendar_today</span>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-full bg-stone-50 border border-stone-100 focus:ring-2 focus:ring-stone-200 focus:bg-white outline-none transition-all text-[10px] font-black text-stone-800 uppercase tracking-wider shadow-sm cursor-pointer"
                    />
                  </div>
                  {(title === "Billing Report" || title === "Delivery Report") && (
                    <>
                      <span className="text-stone-400 font-bold text-[10px]">-</span>
                      <div className="relative min-w-[140px] flex-1 md:flex-none">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">calendar_today</span>
                        <input
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-full bg-stone-50 border border-stone-100 focus:ring-2 focus:ring-stone-200 focus:bg-white outline-none transition-all text-[10px] font-black text-stone-800 uppercase tracking-wider shadow-sm cursor-pointer"
                        />
                        {filterEndDate && (
                          <button 
                            onClick={() => setFilterEndDate('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-600"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {selectedIds.length > 0 && onBulkDelete && (
              <button 
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] md:text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-2 border border-red-100"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>Hapus Massal ({selectedIds.length})</span>
              </button>
            )}
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
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-stone-50/50">
                {onBulkDelete && (
                  <th className="px-3 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                      checked={paginatedDeliveries.length > 0 && selectedIds.length === paginatedDeliveries.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">NAMA KURIR</th>
                <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">TANGGAL</th>
                <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">NAMA LOKASI</th>
                {title === "Billing Report" && (
                  <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">TANGGAL PIUTANG</th>
                )}
                <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                  {title === "Billing Report" ? "BUKTI PENAGIHAN" : "BUKTI PENGIRIMAN"}
                </th>
                {title === "Billing Report" && (
                  <>
                    <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">METODE</th>
                    <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">BUKTI TRANSFER</th>
                  </>
                )}
                {title === "Delivery Report" && (
                  <>
                    <th className="px-2 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">T. PEDES</th>
                    <th className="px-2 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">T. MAYO</th>
                    <th className="px-2 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">A. MAYO</th>
                    <th className="px-2 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">A. PEDES</th>
                    <th className="px-2 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">M. BULAN</th>
                    <th className="px-2 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center text-blue-600">JML KIRIM</th>
                  </>
                )}
                <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">
                  {title === "Billing Report" ? "NILAI" : "QTY"}
                </th>
                {title === "Billing Report" && (
                  <>
                    <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">BUKTI SISA</th>
                    <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">SISA</th>
                    <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">WASTE</th>
                    <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">STATUS</th>
                  </>
                )}
                <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">KET</th>
                {(userRole === 'owner' || userRole === 'admin') && (
                  <th className="px-3 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">AKSI</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {paginatedDeliveries.length > 0 ? (
                paginatedDeliveries.map((delivery) => {
                  const associatedOrder = orders.find(o => {
                    const orderDateObj = parseIndoDate(o.tanggal);
                    const orderDateStr = orderDateObj ? getLocalDateString(orderDateObj) : o.tanggal;
                    return (delivery.orderId && o.id === delivery.orderId) ||
                           (o.namaLokasi === delivery.namaLokasi && orderDateStr === delivery.tanggal);
                  });

                  return (
                    <tr key={delivery.id} className={`hover:bg-stone-50/30 transition-colors ${selectedIds.includes(delivery.id) ? 'bg-stone-50' : ''}`}>
                      {onBulkDelete && (
                        <td className="px-3 py-4">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                            checked={selectedIds.includes(delivery.id)}
                            onChange={() => handleSelectOne(delivery.id)}
                          />
                        </td>
                      )}
                      <td className="px-3 py-4">
                        <div className="font-bold text-stone-900 text-sm">{delivery.namaKurir}</div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-stone-600 text-sm">{formatDate(delivery.tanggal)}</div>
                      </td>
                      <td className="px-3 py-4 max-w-[150px]">
                        <div className="font-medium text-stone-900 text-sm leading-tight">{delivery.namaLokasi}</div>
                      </td>
                      {title === "Billing Report" && (
                        <td className="px-3 py-4">
                          <div className="text-stone-600 text-sm">{delivery.tanggalPiutang ? formatDate(delivery.tanggalPiutang) : '-'}</div>
                        </td>
                      )}
                      <td className="px-3 py-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          {delivery.fotoBukti ? (
                            <img 
                              src={delivery.fotoBukti} 
                              alt="Bukti" 
                              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md cursor-zoom-in hover:scale-105 transition-transform relative z-20"
                              referrerPolicy="no-referrer"
                              onClick={() => setPreviewImage(delivery.fotoBukti)}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 border-2 border-white shadow-sm" title="Belum Upload Bukti">
                              <span className="material-symbols-outlined text-base">image_not_supported</span>
                            </div>
                          )}
                          <div className="flex flex-col gap-0.5 py-0.5">
                            <div className="text-stone-400 flex items-center gap-1 text-[10px]">
                              <span className="material-symbols-outlined text-[10px]">location_on</span>
                              <span className="truncate max-w-[100px]">{delivery.lokasiBukti || '-'}</span>
                            </div>
                            <div className="text-stone-400 flex items-center gap-1 text-[10px]">
                              <span className="material-symbols-outlined text-[10px]">schedule</span>
                              {delivery.jamBukti || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      {title === "Billing Report" && (
                        <>
                          <td className="px-3 py-4">
                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                              delivery.metodePembayaran === 'Transfer' 
                                ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                : 'bg-stone-50 text-stone-600 border border-stone-100'
                            }`}>
                              {delivery.metodePembayaran || 'Cash'}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            {delivery.buktiTransfer ? (
                              <img 
                                src={delivery.buktiTransfer} 
                                alt="Transfer" 
                                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md cursor-zoom-in hover:scale-105 transition-transform relative z-20"
                                referrerPolicy="no-referrer"
                                onClick={() => setPreviewImage(delivery.buktiTransfer)}
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 border-2 border-white shadow-sm" title="Bukan Transfer / Belum Upload">
                                <span className="material-symbols-outlined text-base">payments</span>
                              </div>
                            )}
                          </td>
                        </>
                      )}
                      {title === "Delivery Report" && (
                        <>
                          <td className="px-2 py-4 text-center">
                            <span className="text-xs font-black text-stone-900">{associatedOrder?.tunaPedes || 0}</span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="text-xs font-black text-stone-900">{associatedOrder?.tunaMayo || 0}</span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="text-xs font-black text-stone-900">{associatedOrder?.ayamMayo || 0}</span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="text-xs font-black text-stone-900">{associatedOrder?.ayamPedes || 0}</span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="text-xs font-black text-stone-900">{associatedOrder?.menuBulanan || 0}</span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="text-xs font-black text-blue-600 underline decoration-blue-200 underline-offset-4">{associatedOrder?.jumlahKirim || 0}</span>
                          </td>
                        </>
                      )}
                      <td className="px-3 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-xl bg-stone-50 text-stone-900 border border-stone-100 text-[10px] font-black min-w-[32px] whitespace-nowrap">
                          {title === "Billing Report" 
                            ? `Rp ${delivery.qtyPengiriman.toLocaleString('id-ID')}` 
                            : delivery.qtyPengiriman}
                        </span>
                      </td>
                      {title === "Billing Report" && (
                        <>
                          <td className="px-3 py-4">
                            {delivery.buktiSisa ? (
                              <img 
                                src={delivery.buktiSisa} 
                                alt="Sisa" 
                                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md cursor-zoom-in hover:scale-105 transition-transform relative z-20"
                                referrerPolicy="no-referrer"
                                onClick={() => setPreviewImage(delivery.buktiSisa)}
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 border-2 border-white shadow-sm" title="Tidak Ada Sisa / Belum Upload">
                                <span className="material-symbols-outlined text-base">inventory_2</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg bg-orange-50 text-orange-600 text-[10px] font-black whitespace-nowrap">
                              {delivery.sisa || 0}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-black whitespace-nowrap">
                              {delivery.waste ? `${delivery.waste.toFixed(0)}%` : '0%'}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg text-[9px] font-black whitespace-nowrap uppercase ${
                              delivery.status === 'Completed' 
                                ? 'bg-green-50 text-green-600' 
                                : 'bg-orange-50 text-orange-600'
                            }`}>
                              {delivery.status === 'Completed' ? 'Appr' : 'Pend'}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-3 py-4">
                        <p className="text-stone-500 text-[10px] line-clamp-2 max-w-[120px]">
                          {delivery.keterangan || '-'}
                        </p>
                      </td>
                      {(userRole === 'owner' || userRole === 'admin') && (
                        <td className="px-3 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {title === "Billing Report" && delivery.status !== 'Completed' && (
                              <button
                                onClick={() => onSaveDelivery({ ...delivery, status: 'Completed' })}
                                className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-all border border-green-100 shadow-sm"
                                title="Approve"
                              >
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                              </button>
                            )}
                            {title === "Delivery Report" && associatedOrder && (userRole === 'admin' || userRole === 'owner') && currentUserDivision?.toLowerCase() !== 'kurir' && (
                              <button
                                onClick={() => {
                                  const orderDateObj = parseIndoDate(associatedOrder.tanggal);
                                  const formattedDate = orderDateObj ? getLocalDateString(orderDateObj) : associatedOrder.tanggal;
                                  setEditingOrder({ ...associatedOrder, tanggal: formattedDate });
                                  setOrderLokasiSearch(associatedOrder.namaLokasi);
                                  setIsOrderEditModalOpen(true);
                                }}
                                className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center hover:bg-purple-100 transition-all border border-purple-100 shadow-sm"
                                title="Edit di Data Orderan"
                              >
                                <span className="material-symbols-outlined text-xs">receipt_long</span>
                              </button>
                            )}
                            {title === "Delivery Report" && (
                              <button
                                onClick={() => {
                                  const associatedOrder = orders.find(o => {
                                    const orderDateObj = parseIndoDate(o.tanggal);
                                    const orderDateStr = orderDateObj ? getLocalDateString(orderDateObj) : o.tanggal;
                                    return (delivery.orderId && o.id === delivery.orderId) ||
                                           (o.namaLokasi === delivery.namaLokasi && orderDateStr === delivery.tanggal);
                                  });
                                  setPrintData({ delivery, order: associatedOrder });
                                }}
                                className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition-all border border-orange-100 shadow-sm"
                                title="Print Preview"
                              >
                                <span className="material-symbols-outlined text-xs">print</span>
                              </button>
                            )}
                            <button
                                onClick={() => handleEdit(delivery)}
                                className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                                title="Edit"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                              </button>
                              <button
                                onClick={() => onDeleteDelivery(delivery.id)}
                                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all border border-red-100 shadow-sm"
                                title="Hapus"
                              >
                                <span className="material-symbols-outlined text-xs">delete</span>
                              </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
            ) : (
                <tr>
                  <td colSpan={15} className="p-12 text-center">
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
          {paginatedDeliveries.length > 0 ? (
            paginatedDeliveries.map((delivery) => {
              const associatedOrder = orders.find(o => {
                const orderDateObj = parseIndoDate(o.tanggal);
                const orderDateStr = orderDateObj ? getLocalDateString(orderDateObj) : o.tanggal;
                return (delivery.orderId && o.id === delivery.orderId) ||
                       (o.namaLokasi === delivery.namaLokasi && orderDateStr === delivery.tanggal);
              });
              return (
                <div key={delivery.id} className={`p-5 space-y-4 transition-colors ${selectedIds.includes(delivery.id) ? 'bg-stone-50' : ''}`}>
                {/* Header: Images & Actions */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {title === "Billing Report" && (
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                        checked={selectedIds.includes(delivery.id)}
                        onChange={() => handleSelectOne(delivery.id)}
                      />
                    )}
                    <div className="flex gap-2">
                      {delivery.fotoBukti ? (
                        <img 
                          src={delivery.fotoBukti} 
                          alt="Bukti" 
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                          referrerPolicy="no-referrer"
                          onClick={() => setPreviewImage(delivery.fotoBukti)}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 border-2 border-white shadow-sm">
                          <span className="material-symbols-outlined text-xl">image</span>
                        </div>
                      )}
                      {delivery.buktiTransfer && (
                        <img 
                          src={delivery.buktiTransfer} 
                          alt="Transfer" 
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                          referrerPolicy="no-referrer"
                          onClick={() => setPreviewImage(delivery.buktiTransfer)}
                        />
                      )}
                      {delivery.buktiSisa && (
                        <img 
                          src={delivery.buktiSisa} 
                          alt="Sisa" 
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                          referrerPolicy="no-referrer"
                          onClick={() => setPreviewImage(delivery.buktiSisa)}
                        />
                      )}
                    </div>
                  </div>

                  {(userRole === 'owner' || userRole === 'admin') && (
                    <div className="flex items-center gap-2">
                      {title === "Delivery Report" && (
                        <button
                          onClick={() => setPrintData({ delivery, order: associatedOrder })}
                          className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm border border-orange-100 active:scale-90 transition-transform"
                          title="Print"
                        >
                          <span className="material-symbols-outlined text-lg">print</span>
                        </button>
                      )}
                      {title === "Billing Report" && delivery.status !== 'Completed' && (
                        <button
                          onClick={() => onSaveDelivery({ ...delivery, status: 'Completed' })}
                          className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm border border-green-100 active:scale-90 transition-transform"
                          title="Approve"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                        </button>
                      )}
                      {title === "Delivery Report" && associatedOrder && (userRole === 'admin' || userRole === 'owner') && currentUserDivision?.toLowerCase() !== 'kurir' && (
                        <button
                          onClick={() => {
                            const orderDateObj = parseIndoDate(associatedOrder.tanggal);
                            const formattedDate = orderDateObj ? getLocalDateString(orderDateObj) : associatedOrder.tanggal;
                            setEditingOrder({ ...associatedOrder, tanggal: formattedDate });
                            setOrderLokasiSearch(associatedOrder.namaLokasi);
                            setIsOrderEditModalOpen(true);
                          }}
                          className="w-9 h-9 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shadow-sm border border-purple-100 active:scale-90 transition-transform"
                          title="Edit di Data Orderan"
                        >
                          <span className="material-symbols-outlined text-lg">receipt_long</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(delivery)}
                        className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100 active:scale-90 transition-transform"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => onDeleteDelivery(delivery.id)}
                        className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm border border-red-100 active:scale-90 transition-transform"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Main Info: Courier & Badges */}
                <div className="space-y-3">
                  <div>
                    <div className="font-black text-stone-900 text-base uppercase tracking-tight">{delivery.namaKurir}</div>
                    <div className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">{formatDate(delivery.tanggal)}</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-white text-[10px] font-black whitespace-nowrap shadow-sm">
                      {title === "Billing Report" 
                        ? `Rp ${delivery.qtyPengiriman.toLocaleString('id-ID')}` 
                        : `QTY: ${delivery.qtyPengiriman}`}
                    </span>
                    {title === "Billing Report" && (
                      <>
                        <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black whitespace-nowrap">
                          SISA: {delivery.sisa || 0}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 text-[10px] font-black whitespace-nowrap">
                          WASTE: {delivery.waste ? `${delivery.waste.toFixed(0)}%` : '0%'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap uppercase border ${
                          delivery.status === 'Completed' 
                            ? 'bg-green-50 text-green-600 border-green-100' 
                            : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                          {delivery.status === 'Completed' ? 'APPROVED' : 'PENDING'}
                        </span>
                        {delivery.metodePembayaran && (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black whitespace-nowrap uppercase">
                            {delivery.metodePembayaran}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Details Section */}
                <div className="bg-stone-50 rounded-2xl p-4 space-y-3 border border-stone-100/50">
                  {title === "Delivery Report" && associatedOrder && (
                    <div className="grid grid-cols-2 gap-3 pb-3 mb-3 border-b border-stone-200/50">
                      <div className="bg-white p-2 rounded-xl border border-stone-100">
                        <div className="text-[8px] font-black text-stone-400 uppercase mb-1">TUNAS PEDES</div>
                        <div className="text-xs font-black text-stone-900">{associatedOrder.tunaPedes}</div>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-stone-100">
                        <div className="text-[8px] font-black text-stone-400 uppercase mb-1">TUNA MAYO</div>
                        <div className="text-xs font-black text-stone-900">{associatedOrder.tunaMayo}</div>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-stone-100">
                        <div className="text-[8px] font-black text-stone-400 uppercase mb-1">AYAM MAYO</div>
                        <div className="text-xs font-black text-stone-900">{associatedOrder.ayamMayo}</div>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-stone-100">
                        <div className="text-[8px] font-black text-stone-400 uppercase mb-1">AYAM PEDES</div>
                        <div className="text-xs font-black text-stone-900">{associatedOrder.ayamPedes}</div>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-stone-100">
                        <div className="text-[8px] font-black text-stone-400 uppercase mb-1">MENU BULANAN</div>
                        <div className="text-xs font-black text-stone-900">{associatedOrder.menuBulanan}</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                        <div className="text-[8px] font-black text-blue-400 uppercase mb-1 underline">JML KIRIM</div>
                        <div className="text-xs font-black text-blue-600">{associatedOrder.jumlahKirim}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-stone-400 shadow-sm flex-shrink-0">
                      <span className="material-symbols-outlined text-lg">store</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Lokasi Toko</div>
                      <div className="text-xs font-bold text-stone-900">{delivery.namaLokasi}</div>
                    </div>
                  </div>

                  {title === "Billing Report" && delivery.tanggalPiutang && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-stone-400 shadow-sm flex-shrink-0">
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tanggal Piutang</div>
                        <div className="text-xs font-bold text-stone-900">{formatDate(delivery.tanggalPiutang)}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-stone-400 text-base">location_on</span>
                      <span className="text-[10px] font-bold text-stone-500">{delivery.lokasiBukti || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-stone-400 text-base">schedule</span>
                      <span className="text-[10px] font-bold text-stone-500">{delivery.jamBukti || '-'}</span>
                    </div>
                  </div>

                  {delivery.keterangan && (
                    <div className="pt-3 border-t border-stone-200/50">
                      <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Keterangan</div>
                      <p className="text-xs text-stone-600 font-medium italic leading-relaxed">"{delivery.keterangan}"</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
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

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-white border-t border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <span className="text-[11px] font-black text-stone-400 uppercase tracking-widest leading-none">
              MENAMPILKAN {itemsPerPage === 'all' 
                ? `SEMUA ${filteredDeliveries.length}` 
                : `${((currentPage - 1) * (itemsPerPage as number)) + 1} SAMPAI ${Math.min(currentPage * (itemsPerPage as number), filteredDeliveries.length)}`} DARI {filteredDeliveries.length} DATA
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-stone-400 uppercase tracking-widest leading-none">TAMPILKAN:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  const val = e.target.value;
                  setItemsPerPage(val === 'all' ? 'all' : Number(val));
                  setCurrentPage(1);
                }}
                className="text-[11px] font-black text-stone-900 border border-stone-200 rounded-lg px-2 py-1 outline-none bg-stone-50/50 hover:bg-stone-50 transition-all cursor-pointer shadow-sm"
              >
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value="all">Semua</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && itemsPerPage !== 'all' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-full border border-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-50 hover:text-stone-900 transition-all disabled:opacity-30 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => {
                    if (totalPages <= 7) return true;
                    if (p === 1 || p === totalPages) return true;
                    if (Math.abs(p - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx-1] !== p - 1 && (
                        <span className="text-stone-300 text-[10px] items-center justify-center w-6 text-center">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded-full text-[10px] font-black transition-all border shadow-sm ${
                          currentPage === p
                            ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                            : 'bg-white text-stone-400 border-stone-100 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-full border border-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-50 hover:text-stone-900 transition-all disabled:opacity-30 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
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

      {/* Order Edit Modal (triggered from Delivery Report) */}
      <AnimatePresence>
        {isOrderEditModalOpen && editingOrder && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrderEditModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="text-lg font-black text-stone-800 uppercase tracking-tight">Edit di Data Orderan</h3>
                <button 
                  onClick={() => setIsOrderEditModalOpen(false)}
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
                      value={editingOrder.tanggal}
                      onChange={(e) => setEditingOrder({...editingOrder, tanggal: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nama Kurir</label>
                    <select 
                      value={editingOrder.employeeId || ''}
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        setEditingOrder({
                          ...editingOrder, 
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
                        value={orderLokasiSearch}
                        onChange={(e) => {
                          setOrderLokasiSearch(e.target.value);
                          setShowOrderLokasiDropdown(true);
                        }}
                        onFocus={() => setShowOrderLokasiDropdown(true)}
                        className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-stone-400 text-sm pointer-events-none">
                        search
                      </span>
                    </div>
                    
                    {showOrderLokasiDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-[125]" 
                          onClick={() => setShowOrderLokasiDropdown(false)} 
                        />
                        <div className="absolute z-[130] left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                          {stores
                            .filter(s => s.namaToko.toLowerCase().includes(orderLokasiSearch.toLowerCase()))
                            .map(store => (
                              <button
                                key={store.id}
                                type="button"
                                onClick={() => {
                                  const rawPrice = store.harga || '0';
                                  const numericPrice = parseInt(rawPrice.replace(/[^0-9]/g, '')) || 0;
                                  
                                  setEditingOrder({
                                    ...editingOrder, 
                                    namaLokasi: store.namaToko,
                                    hargaSikepal: numericPrice
                                  });
                                  setOrderLokasiSearch(store.namaToko);
                                  setShowOrderLokasiDropdown(false);
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
                      value={editingOrder.tunaPedes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        const others = (editingOrder.tunaMayo || 0) + (editingOrder.ayamMayo || 0) + (editingOrder.ayamPedes || 0) + (editingOrder.menuBulanan || 0);
                        setEditingOrder({...editingOrder, tunaPedes: val, jumlahKirim: val + others});
                      }}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tuna Mayo</label>
                    <input 
                      type="number" 
                      value={editingOrder.tunaMayo}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        const others = (editingOrder.tunaPedes || 0) + (editingOrder.ayamMayo || 0) + (editingOrder.ayamPedes || 0) + (editingOrder.menuBulanan || 0);
                        setEditingOrder({...editingOrder, tunaMayo: val, jumlahKirim: val + others});
                      }}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Ayam Mayo</label>
                    <input 
                      type="number" 
                      value={editingOrder.ayamMayo}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        const others = (editingOrder.tunaPedes || 0) + (editingOrder.tunaMayo || 0) + (editingOrder.ayamPedes || 0) + (editingOrder.menuBulanan || 0);
                        setEditingOrder({...editingOrder, ayamMayo: val, jumlahKirim: val + others});
                      }}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Ayam Pedes</label>
                    <input 
                      type="number" 
                      value={editingOrder.ayamPedes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        const others = (editingOrder.tunaPedes || 0) + (editingOrder.tunaMayo || 0) + (editingOrder.ayamMayo || 0) + (editingOrder.menuBulanan || 0);
                        setEditingOrder({...editingOrder, ayamPedes: val, jumlahKirim: val + others});
                      }}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Menu Bulanan</label>
                    <input 
                      type="number" 
                      value={editingOrder.menuBulanan}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        const others = (editingOrder.tunaPedes || 0) + (editingOrder.tunaMayo || 0) + (editingOrder.ayamMayo || 0) + (editingOrder.ayamPedes || 0);
                        setEditingOrder({...editingOrder, menuBulanan: val, jumlahKirim: val + others});
                      }}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Jumlah Kirim</label>
                    <input 
                      type="number" 
                      value={editingOrder.jumlahKirim}
                      readOnly
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
                      value={editingOrder.hargaSikepal}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingOrder({...editingOrder, hargaSikepal: val, jumlahUang: val * editingOrder.jumlahKirim});
                      }}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Periode Bayar</label>
                    <select 
                      value={editingOrder.periodeBayar}
                      onChange={(e) => setEditingOrder({...editingOrder, periodeBayar: e.target.value})}
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
                      value={editingOrder.pembayaran}
                      onChange={(e) => setEditingOrder({...editingOrder, pembayaran: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      <option value="">Pilih Status</option>
                      <option value="FALSE">BELUM LUNAS</option>
                      <option value="TRUE">LUNAS</option>
                    </select>
                  </div>
                </div>

                {/* Section 4: Detail Keuangan (Advanced) */}
                {(userRole === 'admin' || userRole === 'owner') && (
                  <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3 bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
                    <div className="col-span-2 md:col-span-4 mb-1">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Detail Keuangan</h4>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Sisa</label>
                      <input 
                        type="number" 
                        value={editingOrder.sisa}
                        onChange={(e) => setEditingOrder({...editingOrder, sisa: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Jumlah Uang</label>
                      <input 
                        type="number" 
                        value={editingOrder.jumlahUang}
                        onChange={(e) => setEditingOrder({...editingOrder, jumlahUang: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tanggal Bayar</label>
                      <input 
                        type="date" 
                        value={editingOrder.tanggalBayar}
                        onChange={(e) => setEditingOrder({...editingOrder, tanggalBayar: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nilai Bayar</label>
                      <input 
                        type="number" 
                        value={editingOrder.nilaiPembayaran || 0}
                        onChange={(e) => setEditingOrder({...editingOrder, nilaiPembayaran: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Waste (%)</label>
                      <input 
                        type="number" 
                        value={editingOrder.waste || 0}
                        onChange={(e) => setEditingOrder({...editingOrder, waste: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Diskon</label>
                      <input 
                        type="number" 
                        value={editingOrder.diskon}
                        onChange={(e) => setEditingOrder({...editingOrder, diskon: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Status Approval</label>
                        <select 
                          value={editingOrder.status || 'Approved'}
                          onChange={(e) => setEditingOrder({...editingOrder, status: e.target.value as any})}
                          className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsOrderEditModalOpen(false)}
                  className="px-6 py-2 text-stone-500 font-bold text-sm hover:bg-stone-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={async () => {
                    if (onSaveOrder) {
                      await onSaveOrder({
                        ...editingOrder,
                        updatedAt: new Date().toISOString()
                      });
                      setIsOrderEditModalOpen(false);
                      setEditingOrder(null);
                    }
                  }}
                  className="px-8 py-2 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  Simpan Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
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
                onClick={() => closeModal(true)}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-sm md:text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar flex-1 pb-10 md:pb-8">
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6`}>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nama Kurir</label>
                      <select
                        required
                        disabled={(title === "Billing Report" || title === "Delivery Report") && currentUserDivision?.toLowerCase() === 'kurir'}
                        value={formData.namaKurir}
                        onChange={(e) => setFormData({...formData, namaKurir: e.target.value})}
                        className="w-full px-4 py-3 rounded-2xl bg-stone-50 border-none focus:ring-2 focus:ring-stone-900 transition-all text-sm font-medium appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                        readOnly
                        value={formData.tanggal}
                        onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                        className="w-full px-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-stone-900 transition-all text-sm font-medium bg-stone-100 text-stone-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                {title !== "Billing Report" && (
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
                )}

                {title === "Billing Report" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Piutang</label>
                    <button
                      type="button"
                      onClick={() => setIsPiutangModalOpen(true)}
                      className={`w-full px-4 py-3 rounded-2xl border-2 transition-all text-sm font-bold flex items-center justify-between ${
                        formData.selectedOrderId 
                          ? 'bg-orange-50 border-orange-200 text-orange-700' 
                          : 'bg-stone-50 border-transparent hover:bg-stone-100 text-stone-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">
                          {formData.selectedOrderId ? 'check_circle' : 'receipt_long'}
                        </span>
                        <span>
                          {formData.selectedOrderId 
                            ? `${formData.namaLokasi} (Rp ${formData.qtyPengiriman.toLocaleString('id-ID')})` 
                            : 'Pilih dari Daftar Piutang'}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-stone-400">arrow_forward_ios</span>
                    </button>
                    {formData.selectedOrderId && (
                      <div className="flex flex-col gap-1 px-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-orange-600 font-bold italic">Terhubung dengan data orderan</p>
                          <button 
                            type="button"
                            onClick={() => setFormData({
                              ...formData, 
                              selectedOrderId: '',
                              qtyPengiriman: 0,
                              originalNilai: 0,
                              sisa: '' as any,
                              hargaSikepal: 0,
                              namaKurir: '',
                              namaLokasi: '',
                              jumlahKirim: 0
                            })}
                            className="text-[10px] text-red-500 font-black uppercase hover:underline"
                          >
                            Batalkan
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            {formData.namaLokasi}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                            Qty: {formData.jumlahKirim}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">payments</span>
                            Nilai: Rp {formData.qtyPengiriman.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
                      {title === "Billing Report" ? "Nilai" : "Qty Pengiriman"}
                    </label>
                    <div className="relative">
                      {title === "Billing Report" && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">Rp</span>
                      )}
                      <input
                        required
                        type="number"
                        readOnly={title === "Billing Report"}
                        value={formData.qtyPengiriman}
                        onChange={(e) => setFormData({...formData, qtyPengiriman: parseInt(e.target.value) || 0})}
                        className={`w-full px-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-stone-900 transition-all text-sm font-medium ${
                          title === "Billing Report" 
                            ? 'pl-10 bg-stone-100 text-stone-500 cursor-not-allowed' 
                            : 'bg-stone-50 text-stone-900'
                        }`}
                      />
                    </div>
                  </div>
                  {title === "Billing Report" ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Sisa (Qty)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.sisa === '' ? '' : formData.sisa}
                        onChange={(e) => {
                          const val = e.target.value;
                          const sisaVal = val === '' ? '' : parseInt(val);
                          const numericSisa = typeof sisaVal === 'number' ? sisaVal : 0;
                          const reduction = numericSisa * (formData.hargaSikepal || 0);
                          setFormData({
                            ...formData,
                            sisa: sisaVal as any,
                            qtyPengiriman: Math.max(0, formData.originalNilai - reduction)
                          });
                        }}
                        placeholder="-"
                        className="w-full px-4 py-3 rounded-2xl bg-stone-50 border-none focus:ring-2 focus:ring-stone-900 transition-all text-sm font-medium"
                      />
                    </div>
                  ) : (
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
                  )}
                </div>

                {title === "Billing Report" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Metode Pembayaran</label>
                      <select
                        required
                        value={formData.metodePembayaran}
                        onChange={(e) => setFormData({...formData, metodePembayaran: e.target.value})}
                        className="w-full px-4 py-3 rounded-2xl bg-stone-50 border-none focus:ring-2 focus:ring-stone-900 transition-all text-sm font-medium appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Pilih Metode</option>
                        <option value="Cash">Cash</option>
                        <option value="Transfer">Transfer</option>
                        <option value="Piutang">Piutang</option>
                      </select>
                    </div>
                  </div>
                )}

                {title === "Billing Report" && formData.metodePembayaran === 'Transfer' && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Bukti Transfer</label>
                    <div className="flex flex-col items-center gap-4">
                      {formData.buktiTransfer ? (
                        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-4 border-stone-900 shadow-xl">
                          <img 
                            src={formData.buktiTransfer} 
                            alt="Bukti Transfer" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, buktiTransfer: ''})}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      ) : (
                        <label className="w-full py-12 rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-3 text-stone-400 hover:bg-stone-100 hover:border-stone-300 transition-all cursor-pointer">
                          <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                          <span className="text-xs font-bold uppercase tracking-widest">Upload Bukti Transfer</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  try {
                                    const compressed = await compressImage(reader.result as string);
                                    setFormData({ ...formData, buktiTransfer: compressed });
                                  } catch (err) {
                                    console.error('Compression error:', err);
                                    setFormData({ ...formData, buktiTransfer: reader.result as string });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {title === "Billing Report" && formData.sisa > 0 && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Bukti Sisa</label>
                    <div className="flex flex-col items-center gap-4">
                      {isCameraActive && cameraTarget === 'buktiSisa' ? (
                        <div className="relative rounded-3xl overflow-hidden bg-black aspect-video border-4 border-stone-900 shadow-xl w-full">
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
                      ) : formData.buktiSisa ? (
                        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-4 border-stone-900 shadow-xl">
                          <img 
                            src={formData.buktiSisa} 
                            alt="Bukti Sisa" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 right-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => startCamera('buktiSisa')}
                              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-stone-900 shadow-lg"
                            >
                              <span className="material-symbols-outlined">refresh</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, buktiSisa: ''})}
                              className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full space-y-3">
                          <label className="w-full py-12 rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-3 text-stone-400 hover:bg-stone-100 hover:border-stone-300 transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                            <span className="text-xs font-bold uppercase tracking-widest">Upload Bukti Sisa</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    try {
                                      const compressed = await compressImage(reader.result as string);
                                      setFormData({ ...formData, buktiSisa: compressed });
                                    } catch (err) {
                                      console.error('Compression error:', err);
                                      setFormData({ ...formData, buktiSisa: reader.result as string });
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => startCamera('buktiSisa')}
                            className="w-full py-4 rounded-2xl border-2 border-dashed border-stone-100 bg-stone-50/50 flex items-center justify-center gap-2 text-stone-400 hover:bg-stone-100 transition-all"
                          >
                            <span className="material-symbols-outlined text-xl">add_a_photo</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Atau Ambil Foto Sisa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
                    {title === "Billing Report" ? "Bukti Penagihan (Selfie/Foto)" : "Bukti Pengiriman (Selfie/Foto)"}
                  </label>
                  
                  {isCameraActive && cameraTarget === 'fotoBukti' ? (
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
                            onClick={() => startCamera('fotoBukti')}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-stone-900 shadow-lg"
                          >
                            <span className="material-symbols-outlined">refresh</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full">
                          <button
                            type="button"
                            onClick={() => startCamera('fotoBukti')}
                            className="w-full py-16 rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-4 text-stone-400 hover:bg-stone-100 hover:border-stone-300 transition-all"
                          >
                            <span className="material-symbols-outlined text-5xl">add_a_photo</span>
                            <span className="text-sm font-black uppercase tracking-widest">Foto Bukti</span>
                          </button>
                        </div>
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
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
                      Keterangan {isKeteranganRequired && <span className="text-red-500">* (Wajib jika waste &gt; 20%)</span>}
                    </label>
                    <KeteranganInput 
                      value={formData.keterangan}
                      onChange={handleKeteranganChange}
                      isKeteranganRequired={isKeteranganRequired}
                    />
                  </div>
                </div>

                <div className="p-6 md:p-8 pt-4 pb-12 md:pb-8 border-t border-stone-50 flex gap-3 md:gap-4 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => closeModal(true)}
                  className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl bg-stone-100 text-stone-600 text-xs md:text-sm font-bold hover:bg-stone-200 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    !formData.fotoBukti || 
                    (formData.metodePembayaran === 'Transfer' && !formData.buktiTransfer) || 
                    (title === "Billing Report" && formData.sisa > 0 && !formData.buktiSisa) ||
                    (isKeteranganRequired && !formData.keterangan.trim()) || 
                    (title === "Billing Report" && formData.sisa === '') ||
                    isSaving
                  }
                  className={`flex-1 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl text-white text-xs md:text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                    formData.fotoBukti && 
                    (formData.metodePembayaran !== 'Transfer' || formData.buktiTransfer) && 
                    (title !== "Billing Report" || formData.sisa <= 0 || formData.buktiSisa) &&
                    (!isKeteranganRequired || formData.keterangan.trim()) && 
                    (title !== "Billing Report" || formData.sisa !== '') &&
                    !isSaving
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
                    editingId ? 'Perbarui' : 'Simpan & Print'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </AnimatePresence>
      {/* Piutang Modal */}
      {isPiutangModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 md:p-8 border-b border-stone-50 flex items-center justify-between bg-stone-50/30">
              <div>
                <h3 className="text-lg md:text-xl font-black text-stone-900 uppercase tracking-tight">Daftar Piutang</h3>
                <p className="text-[10px] md:text-xs text-stone-500 font-medium uppercase tracking-widest">Data Orderan (Unpaid)</p>
              </div>
              <button 
                onClick={() => setIsPiutangModalOpen(false)}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-sm md:text-base">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Search and Filter Bar */}
              <div className="p-4 md:p-6 pb-2 border-b border-stone-50 bg-white space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">search</span>
                    <input
                      type="text"
                      placeholder="Cari lokasi atau kurir..."
                      value={piutangSearchQuery}
                      onChange={(e) => setPiutangSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border-none focus:ring-2 focus:ring-stone-900 transition-all text-xs font-medium"
                    />
                  </div>
                  <div className="w-full md:w-48 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">person</span>
                    <select
                      value={piutangFilterKurir}
                      onChange={(e) => setPiutangFilterKurir(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-stone-50 border-none focus:ring-2 focus:ring-stone-900 transition-all text-xs font-medium appearance-none cursor-pointer"
                    >
                      <option value="">Semua Kurir</option>
                      {courierOptions.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 md:p-6 pt-2">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50/50">
                        <th className="px-4 py-3 w-10">
                          <input 
                            type="checkbox"
                            checked={selectedPiutangIds.length === filteredPiutangOrders.length && filteredPiutangOrders.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPiutangIds(filteredPiutangOrders.map(o => o.id));
                              } else {
                                setSelectedPiutangIds([]);
                              }
                            }}
                            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                          />
                        </th>
                        <th className="px-4 py-3 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tanggal</th>
                        <th className="px-4 py-3 text-[10px] font-black text-stone-400 uppercase tracking-widest">Nama Lokasi</th>
                        <th className="px-4 py-3 text-[10px] font-black text-stone-400 uppercase tracking-widest">Jumlah Uang</th>
                        <th className="px-4 py-3 text-[10px] font-black text-stone-400 uppercase tracking-widest">Pembayaran</th>
                        <th className="px-4 py-3 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredPiutangOrders.length > 0 ? (
                        filteredPiutangOrders.map((order) => (
                          <tr 
                            key={order.id} 
                            className={`group transition-colors cursor-pointer ${
                              selectedPiutangIds.includes(order.id) ? 'bg-orange-50/50' : 'hover:bg-stone-50/50'
                            }`}
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox"
                                checked={selectedPiutangIds.includes(order.id)}
                                onChange={() => {
                                  setSelectedPiutangIds(prev => 
                                    prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]
                                  );
                                }}
                                className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                              />
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-stone-600" onClick={() => {
                              setSelectedPiutangIds(prev => 
                                prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]
                              );
                            }}>{formatDate(order.tanggal)}</td>
                            <td className="px-4 py-3 text-xs font-bold text-stone-900">
                              <div>{order.namaLokasi}</div>
                              <div className="text-[10px] text-stone-400 font-medium">{order.namaKurir}</div>
                            </td>
                            <td className="px-4 py-3 text-xs font-black text-stone-900">
                              <div>Rp {order.jumlahUang.toLocaleString('id-ID')}</div>
                              <div className="text-[10px] text-stone-400 font-medium">Qty: {order.jumlahKirim}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-black uppercase">
                                {order.pembayaran}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const grossValue = (order.jumlahKirim || 0) * (order.hargaSikepal || 0);
                                  setFormData({
                                    ...formData,
                                    namaKurir: order.namaKurir,
                                    namaLokasi: order.namaLokasi,
                                    qtyPengiriman: order.jumlahUang,
                                    originalNilai: grossValue,
                                    hargaSikepal: order.hargaSikepal || 0,
                                    sisa: order.sisa || 0,
                                    selectedOrderId: order.id,
                                    tanggalPiutang: order.tanggal,
                                    jumlahKirim: order.jumlahKirim
                                  });
                                  setIsPiutangModalOpen(false);
                                }}
                                className="px-3 py-1.5 bg-stone-900 text-white text-[10px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Pilih
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-stone-400 font-medium text-sm">
                            <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="material-symbols-outlined text-stone-300 text-2xl">search_off</span>
                            </div>
                            {piutangSearchQuery || piutangFilterKurir 
                              ? "Tidak ada piutang yang sesuai dengan pencarian/filter"
                              : "Tidak ada data piutang (semua sudah lunas)"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden space-y-3">
                  {filteredPiutangOrders.length > 0 ? (
                    filteredPiutangOrders.map((order) => (
                      <div 
                        key={order.id}
                         onClick={() => {
                          const isCurrentlySelected = selectedPiutangIds.includes(order.id);
                          if (isCurrentlySelected) {
                            setSelectedPiutangIds(prev => prev.filter(id => id !== order.id));
                          } else {
                            setSelectedPiutangIds(prev => [...prev, order.id]);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${
                          selectedPiutangIds.includes(order.id) 
                            ? 'bg-orange-50 border-orange-200 shadow-sm' 
                            : 'bg-white border-stone-100 hover:border-stone-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox"
                              checked={selectedPiutangIds.includes(order.id)}
                              onChange={() => {}} // Handled by div onClick
                              className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                            />
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                              {formatDate(order.tanggal)}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-red-50 text-red-600 text-[9px] font-black uppercase">
                            {order.pembayaran}
                          </span>
                        </div>
                        <div className="mb-3">
                          <div className="text-sm font-black text-stone-900 leading-tight">{order.namaLokasi}</div>
                          <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wide mt-0.5">{order.namaKurir}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <div className="text-sm font-black text-orange-600">
                              Rp {order.jumlahUang.toLocaleString('id-ID')}
                            </div>
                            <div className="text-[10px] font-bold text-stone-400">
                              Qty: {order.jumlahKirim}
                            </div>
                          </div>
                          <div className="text-[10px] font-black text-stone-400 uppercase flex items-center gap-1">
                            Pilih <span className="material-symbols-outlined text-xs">chevron_right</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-stone-400 font-medium text-sm">
                      <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="material-symbols-outlined text-stone-300 text-2xl">search_off</span>
                      </div>
                      {piutangSearchQuery || piutangFilterKurir 
                        ? "Tidak ada piutang yang sesuai dengan pencarian/filter"
                        : "Tidak ada data piutang (semua sudah lunas)"}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-stone-50 bg-stone-50/30 flex items-center justify-between">
              <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                {selectedPiutangIds.length} Terpilih
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsPiutangModalOpen(false)}
                  className="px-6 py-3 bg-stone-100 text-stone-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-200 transition-all"
                >
                  Tutup
                </button>
                {selectedPiutangIds.length > 0 && (
                  <button 
                    onClick={handleBulkPiutangSave}
                    disabled={isSaving}
                    className="px-8 py-3 bg-stone-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center gap-2"
                  >
                    {isSaving ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                    )}
                    Proses Massal ({selectedPiutangIds.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt (58mm Thermal) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          #root {
            display: none !important;
          }
          #print-receipt-container {
            display: block !important;
            width: 58mm;
            padding: 4mm;
            margin: 0;
            background: white;
            color: black;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.2;
          }
          .receipt-logo {
            width: 35mm;
            height: auto;
            display: block;
            margin: 0 auto 4mm;
          }
          .receipt-header {
            text-align: center;
            font-weight: 900;
            margin-bottom: 3mm;
            border-bottom: 1px dashed black;
            padding-bottom: 2mm;
            text-transform: uppercase;
            font-size: 13px;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
          }
          .receipt-divider {
            border-top: 1px dashed black;
            margin: 2mm 0;
          }
          .receipt-section-title {
            font-weight: 900;
            text-transform: uppercase;
            margin-bottom: 2mm;
            text-decoration: underline;
            text-align: center;
          }
          .receipt-total {
            border-top: 1px solid black;
            margin-top: 2mm;
            padding-top: 1mm;
            font-weight: 900;
            font-size: 12px;
          }
          .receipt-footer {
            margin-top: 5mm;
            text-align: center;
            font-style: italic;
            font-size: 9px;
            border-top: 1px dashed black;
            padding-top: 2mm;
          }
        }
        @media screen {
          #print-receipt-container {
            display: none;
          }
        }
      `}} />

      {printData && (
        <div id="print-receipt-container">
          <img 
            src="https://lh3.googleusercontent.com/d/1b-hkPOsHZ8_rW1f9aqABu7R5bw_ZJM0y" 
            alt="Sikepal Logo" 
            className="receipt-logo"
            referrerPolicy="no-referrer"
          />
          <div className="receipt-header">Bukti Pengiriman</div>
          
          <div className="receipt-details">
            <div className="receipt-row">
              <span style={{fontWeight: 900}}>Lokasi:</span>
              <span style={{textAlign: 'right'}}>{printData.delivery.namaLokasi}</span>
            </div>
            <div className="receipt-row">
              <span style={{fontWeight: 900}}>Kurir:</span>
              <span>{printData.delivery.namaKurir}</span>
            </div>
            <div className="receipt-row">
              <span style={{fontWeight: 900}}>Tgl:</span>
              <span>{formatDate(printData.delivery.tanggal)}</span>
            </div>
            <div className="receipt-row">
              <span style={{fontWeight: 900}}>Jam:</span>
              <span>{printData.delivery.jamBukti || '-'}</span>
            </div>
            <div className="receipt-row">
              <span style={{fontWeight: 900}}>Loc:</span>
              <span style={{fontSize: '7px', textAlign: 'right'}}>{printData.delivery.lokasiBukti || '-'}</span>
            </div>
          </div>

          <div className="receipt-divider" />
          <div className="receipt-section-title">Detail Varian</div>
          
          {printData.order ? (
            <div className="receipt-variants">
              {[
                { label: 'Tuna Pedes', val: printData.order.tunaPedes },
                { label: 'Tuna Mayo', val: printData.order.tunaMayo },
                { label: 'Ayam Mayo', val: printData.order.ayamMayo },
                { label: 'Ayam Pedes', val: printData.order.ayamPedes },
                { label: 'Menu Bulanan', val: printData.order.menuBulanan },
              ].filter(v => v.val > 0).map(v => (
                <div key={v.label} className="receipt-row">
                  <span>{v.label}</span>
                  <span>{v.val}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="receipt-row">
              <span>Qty Total</span>
              <span>{printData.delivery.qtyPengiriman}</span>
            </div>
          )}

          <div className="receipt-row receipt-total">
            <span>TOTAL KIRIM</span>
            <span>{printData.order?.jumlahKirim || printData.delivery.qtyPengiriman} Pcs</span>
          </div>

          {printData.delivery.keterangan && (
            <div style={{marginTop: '3mm', fontStyle: 'italic', fontSize: '9px'}}>
              Ket: {printData.delivery.keterangan}
            </div>
          )}

          <div style={{ marginTop: '8mm', display: 'flex', justifyContent: 'space-between', padding: '0 2mm' }}>
            <div style={{ textAlign: 'center', width: '22mm' }}>
              <div style={{ fontSize: '8px', marginBottom: '8mm' }}>PENERIMA</div>
              <div style={{ borderTop: '0.5px solid black', fontSize: '7px', paddingTop: '1mm' }}>Ttd & Nama</div>
            </div>
            <div style={{ textAlign: 'center', width: '22mm' }}>
              <div style={{ fontSize: '8px', marginBottom: '8mm' }}>KURIR</div>
              <div style={{ borderTop: '0.5px solid black', fontSize: '7px', paddingTop: '1mm', fontWeight: 900 }}>{printData.delivery.namaKurir}</div>
            </div>
          </div>

          <div className="receipt-footer">
            Terima kasih atas kerja kerasnya!<br/>
            Sikepal Premium Nasi Kepal
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryModule;
