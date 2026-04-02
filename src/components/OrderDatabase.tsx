import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, UserRole, Store } from '../types';
import { getPaginationRange } from '../lib/utils';

interface OrderDatabaseProps {
  orders: Order[];
  stores: Store[];
  onSaveOrder: (order: Order) => Promise<void>;
  onDeleteAllOrders: () => Promise<void>;
  company: string;
  userRole: UserRole;
}

const OrderDatabase: React.FC<OrderDatabaseProps> = ({ 
  orders, 
  stores,
  onSaveOrder, 
  onDeleteAllOrders,
  company,
  userRole
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterKurir, setFilterKurir] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('');
  const [filterPembayaran, setFilterPembayaran] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncYear, setSyncYear] = useState('2026');
  const [syncMonth, setSyncMonth] = useState('Semua');
  const [syncDay, setSyncDay] = useState('Semua');
  const [syncGid, setSyncGid] = useState('0');
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    tanggal: new Date().toISOString().split('T')[0],
    namaKurir: '',
    namaLokasi: '',
    tunaPedes: 0,
    tunaMayo: 0,
    ayamMayo: 0,
    ayamPedes: 0,
    menuBulanan: 0,
    jumlahKirim: 0,
    hargaSikepal: 0,
    periodeBayar: '',
    sisa: 0,
    jumlahPiutang: 0,
    jumlahUang: 0,
    pembayaran: '',
    tanggalBayar: '',
    diskon: 0,
    company: company
  });

  const kurirOptions = useMemo(() => {
    const kurirs = new Set(orders.map(o => o.namaKurir).filter(Boolean));
    return Array.from(kurirs).sort();
  }, [orders]);

  const lokasiOptions = useMemo(() => {
    const lokasis = new Set(orders.map(o => o.namaLokasi).filter(Boolean));
    return Array.from(lokasis).sort();
  }, [orders]);

  const pembayaranOptions = useMemo(() => {
    const options = new Set(orders.map(o => o.pembayaran).filter(Boolean));
    return Array.from(options).sort();
  }, [orders]);

  const parseIndoDate = (dateStr: string) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.trim();

    // Handle "Rabu, 1, April, 2026" or "Rabu, 1 April 2026" format
    if (cleanStr.includes(',') || cleanStr.split(' ').length >= 3) {
      const parts = cleanStr.split(/[,\s]+/).map(p => p.trim()).filter(Boolean);
      
      // We expect at least [Day, Month, Year] or [DayName, Day, Month, Year]
      if (parts.length >= 3) {
        const year = parseInt(parts[parts.length - 1]);
        const monthName = parts[parts.length - 2].toLowerCase();
        const day = parseInt(parts[parts.length - 3]);

        const months: { [key: string]: number } = {
          'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
          'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5,
          'jul': 6, 'agu': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11
        };

        const month = months[monthName];
        if (!isNaN(day) && month !== undefined && !isNaN(year)) {
          let finalYear = year;
          if (finalYear < 100) finalYear += 2000;
          return new Date(finalYear, month, day);
        }
      }
    }

    // Handle YYYY-MM-DD (from input date) - Parse as local time to avoid timezone mismatch
    if (cleanStr.includes('-') && cleanStr.split('-')[0].length === 4) {
      const parts = cleanStr.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    // Handle DD/MM/YYYY or DD-MM-YYYY
    const parts = cleanStr.split(/[/-]/);
    if (parts.length === 3) {
      const d = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      let y = parseInt(parts[2]);
      if (y < 100) y += 2000;
      return new Date(y, m, d);
    }
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.namaLokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.namaKurir.toLowerCase().includes(searchQuery.toLowerCase());
      
      const orderDate = parseIndoDate(order.tanggal);
      const start = startDate ? parseIndoDate(startDate) : null;
      const end = endDate ? parseIndoDate(endDate) : null;

      const matchesStartDate = !start || (orderDate && orderDate >= start);
      const matchesEndDate = !end || (orderDate && orderDate <= end);
      
      const matchesKurir = !filterKurir || order.namaKurir === filterKurir;
      const matchesLokasi = !filterLokasi || order.namaLokasi === filterLokasi;
      const matchesPembayaran = !filterPembayaran || order.pembayaran === filterPembayaran;

      return matchesSearch && matchesStartDate && matchesEndDate && matchesKurir && matchesLokasi && matchesPembayaran;
    }).sort((a, b) => {
      const dateA = parseIndoDate(a.tanggal);
      const dateB = parseIndoDate(b.tanggal);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });
  }, [orders, searchQuery, startDate, endDate, filterKurir, filterLokasi, filterPembayaran]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const summary = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
      acc.tunaPedes += order.tunaPedes;
      acc.tunaMayo += order.tunaMayo;
      acc.ayamMayo += order.ayamMayo;
      acc.ayamPedes += order.ayamPedes;
      acc.menuBulanan += order.menuBulanan;
      acc.jumlahKirim += order.jumlahKirim;
      acc.sisa += order.sisa;
      return acc;
    }, {
      tunaPedes: 0,
      tunaMayo: 0,
      ayamMayo: 0,
      ayamPedes: 0,
      menuBulanan: 0,
      jumlahKirim: 0,
      sisa: 0
    });
  }, [filteredOrders]);

  const percentageSisa = summary.jumlahKirim > 0 ? (summary.sisa / summary.jumlahKirim) * 100 : 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = parseIndoDate(dateStr);
    if (!date) return dateStr;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const handleSave = async () => {
    if (!newOrder.namaLokasi || !newOrder.tanggal) {
      alert('Nama Lokasi dan Tanggal wajib diisi');
      return;
    }

    const orderToSave: Order = {
      id: newOrder.id || `order_${Date.now()}`,
      tanggal: newOrder.tanggal || '',
      namaKurir: newOrder.namaKurir || '',
      namaLokasi: newOrder.namaLokasi || '',
      tunaPedes: Number(newOrder.tunaPedes) || 0,
      tunaMayo: Number(newOrder.tunaMayo) || 0,
      ayamMayo: Number(newOrder.ayamMayo) || 0,
      ayamPedes: Number(newOrder.ayamPedes) || 0,
      menuBulanan: Number(newOrder.menuBulanan) || 0,
      jumlahKirim: Number(newOrder.jumlahKirim) || 0,
      hargaSikepal: Number(newOrder.hargaSikepal) || 0,
      periodeBayar: newOrder.periodeBayar || '',
      sisa: Number(newOrder.sisa) || 0,
      jumlahPiutang: Number(newOrder.jumlahPiutang) || 0,
      jumlahUang: Number(newOrder.jumlahUang) || 0,
      pembayaran: newOrder.pembayaran || '',
      tanggalBayar: newOrder.tanggalBayar || '',
      diskon: Number(newOrder.diskon) || 0,
      company: company,
      updatedAt: new Date().toISOString()
    };

    await onSaveOrder(orderToSave);
    setIsAdding(false);
    setNewOrder({
      tanggal: new Date().toISOString().split('T')[0],
      namaKurir: '',
      namaLokasi: '',
      tunaPedes: 0,
      tunaMayo: 0,
      ayamMayo: 0,
      ayamPedes: 0,
      menuBulanan: 0,
      jumlahKirim: 0,
      hargaSikepal: 0,
      periodeBayar: '',
      sisa: 0,
      jumlahPiutang: 0,
      jumlahUang: 0,
      pembayaran: '',
      tanggalBayar: '',
      diskon: 0,
      company: company
    });
  };

  const syncFromSpreadsheet = async () => {
    setIsSyncing(true);
    try {
      const sheetUrl = `https://docs.google.com/spreadsheets/d/1FdhqqzioWvySOgK0o4mw6q9-DTUJdLwoDToYr1xKgwA/export?format=csv&gid=${syncGid}`;
      const response = await fetch(sheetUrl);
      const csvText = await response.text();
      
      // Simple CSV parser that handles quotes and commas
      const rows = csvText.split('\n').map(row => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });

      const headers = rows[0].map(h => h.trim().toUpperCase());
      
      const getIndex = (name: string) => {
        const n = name.toUpperCase();
        const exact = headers.indexOf(n);
        if (exact !== -1) return exact;
        return headers.findIndex(h => h.includes(n));
      };

      const idx = {
        tanggal: getIndex('TANGGAL'),
        kurir: getIndex('KURIR'),
        lokasi: getIndex('LOKASI'),
        tunaPedes: getIndex('TUNA PEDES'),
        tunaMayo: getIndex('TUNA MAYO'),
        ayamMayo: getIndex('AYAM MAYO'),
        ayamPedes: getIndex('AYAM PEDES'),
        menuBulanan: getIndex('MENU BULANAN'),
        jumlahKirim: getIndex('JUMLAH KIRIM'),
        hargaSikepal: getIndex('HARGA SIKEPAL'),
        periodeBayar: getIndex('PERIODE BAYAR'),
        sisa: getIndex('SISA'),
        jumlahPiutang: getIndex('JUMLAH PIUTANG'),
        jumlahUang: getIndex('JUMLAH UANG'),
        pembayaran: getIndex('PEMBAYARAN'),
        tanggalBayar: getIndex('TANGGAL BAYAR'),
        diskon: getIndex('DISKON'),
      };

      const dataRows = rows.slice(1); // Skip header
      let syncCount = 0;
      let skippedCount = 0;

      const parseNum = (val: string | undefined) => {
        if (!val) return 0;
        // If it looks like a date (contains / or -), it's likely the wrong column
        if (val.includes('/') || (val.includes('-') && val.length > 5)) return 0;
        
        // Handle potential decimal separators (comma or dot)
        // If there's a decimal part, we usually want to ignore it for quantities
        // but keep it for prices (though prices here are also integers usually)
        let cleaned = val.trim();
        
        // If it has both dot and comma, it's definitely a formatted number
        // e.g. 1.234,56 or 1,234.56
        if (cleaned.includes('.') && cleaned.includes(',')) {
          const dotIdx = cleaned.indexOf('.');
          const commaIdx = cleaned.indexOf(',');
          if (dotIdx < commaIdx) {
            // 1.234,56 -> dot is thousand, comma is decimal
            cleaned = cleaned.split(',')[0].replace(/\./g, '');
          } else {
            // 1,234.56 -> comma is thousand, dot is decimal
            cleaned = cleaned.split('.')[0].replace(/,/g, '');
          }
        } else if (cleaned.includes(',')) {
          // Could be decimal (1,5) or thousand (1,234)
          // If there are exactly 3 digits after comma, it's likely a thousand separator
          const parts = cleaned.split(',');
          if (parts.length === 2 && parts[1].length === 3) {
            cleaned = cleaned.replace(/,/g, '');
          } else {
            // Otherwise treat as decimal and take integer part
            cleaned = parts[0].replace(/[^\d]/g, '');
          }
        } else if (cleaned.includes('.')) {
          // Could be decimal (1.5) or thousand (1.234)
          const parts = cleaned.split('.');
          if (parts.length === 2 && parts[1].length === 3) {
            cleaned = cleaned.replace(/\./g, '');
          } else {
            cleaned = parts[0].replace(/[^\d]/g, '');
          }
        } else {
          cleaned = cleaned.replace(/[^\d]/g, '');
        }
        
        return parseInt(cleaned) || 0;
      };

      for (const row of dataRows) {
        if (row.length < 3) continue;

        const tanggalValue = row[idx.tanggal] || '';
        
        // Parse date for filtering using the new helper
        const rowDate = parseIndoDate(tanggalValue);
        const isValidDate = rowDate !== null;

        // Filter for selected year
        const shortYear = syncYear.slice(-2);
        const yearMatch = tanggalValue.includes(syncYear) || tanggalValue.includes(`/${shortYear}`) || tanggalValue.includes(`-${shortYear}`);
        
        if (!yearMatch) {
          skippedCount++;
          continue;
        }

        // Filter for selected month
        if (syncMonth !== 'Semua' && isValidDate) {
          const monthNum = parseInt(syncMonth);
          if (rowDate.getMonth() + 1 !== monthNum) {
            skippedCount++;
            continue;
          }
        }

        // Filter for selected day
        if (syncDay !== 'Semua' && isValidDate) {
          const dayNum = parseInt(syncDay);
          if (rowDate.getDate() !== dayNum) {
            skippedCount++;
            continue;
          }
        }

        const orderId = `order_${tanggalValue}_${row[idx.kurir] || ''}_${row[idx.lokasi] || Math.random().toString(36).substr(2, 9)}`.toLowerCase().replace(/[^a-z0-9]/g, '_');

        const order: Order = {
          id: orderId,
          tanggal: tanggalValue,
          namaKurir: row[idx.kurir] || '',
          namaLokasi: row[idx.lokasi] || '',
          tunaPedes: parseNum(row[idx.tunaPedes]),
          tunaMayo: parseNum(row[idx.tunaMayo]),
          ayamMayo: parseNum(row[idx.ayamMayo]),
          ayamPedes: parseNum(row[idx.ayamPedes]),
          menuBulanan: parseNum(row[idx.menuBulanan]),
          jumlahKirim: parseNum(row[idx.jumlahKirim]),
          hargaSikepal: parseNum(row[idx.hargaSikepal]),
          periodeBayar: row[idx.periodeBayar] || '',
          sisa: parseNum(row[idx.sisa]),
          jumlahPiutang: parseNum(row[idx.jumlahPiutang]),
          jumlahUang: parseNum(row[idx.jumlahUang]),
          pembayaran: row[idx.pembayaran] || '',
          tanggalBayar: row[idx.tanggalBayar] || '',
          diskon: parseNum(row[idx.diskon]),
          company,
          updatedAt: new Date().toISOString(),
        };

        // Log specific date for debugging if requested
        if (tanggalValue.includes('02/04/2026') || tanggalValue.includes('2/4/2026')) {
          console.log('Syncing row for 02/04/2026:', {
            lokasi: order.namaLokasi,
            kurir: order.namaKurir,
            jumlah: order.jumlahKirim,
            id: orderId
          });
        }

        await onSaveOrder(order);
        syncCount++;
      }

      const monthLabel = syncMonth === 'Semua' ? '' : ` bulan ${new Date(2000, parseInt(syncMonth) - 1).toLocaleString('id-ID', { month: 'long' })}`;
      const dayLabel = syncDay === 'Semua' ? '' : ` tanggal ${syncDay}`;
      alert(`Berhasil sinkronisasi ${syncCount} data orderan tahun ${syncYear}${monthLabel}${dayLabel}. (${skippedCount} data lain dilewati)`);
      setShowSyncSettings(false);
    } catch (error) {
      console.error('Sync error:', error);
      alert('Gagal sinkronisasi data. Pastikan URL spreadsheet benar dan dapat diakses publik.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-800 uppercase tracking-tight">Data Orderan</h2>
          <p className="text-sm text-stone-500 font-medium">Manajemen data pesanan harian</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {userRole === 'owner' && (
            <button 
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin menghapus SEMUA data orderan?')) {
                  onDeleteAllOrders();
                }
              }}
              className="px-3 md:px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] md:text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </button>
          )}
          {userRole !== 'kurir' && (
            <>
              <button 
                onClick={() => setShowSyncSettings(true)}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-bold text-[10px] md:text-sm transition-all shadow-sm ${
                  isSyncing ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-white text-primary border border-primary hover:bg-primary/5'
                }`}
              >
                <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
                <span>{isSyncing ? 'Syncing...' : (window.innerWidth < 640 ? 'Sync' : 'Sync Spreadsheet')}</span>
              </button>
              <button 
                onClick={() => {
                  setNewOrder({
                    tanggal: new Date().toISOString().split('T')[0],
                    namaKurir: '',
                    namaLokasi: '',
                    tunaPedes: 0,
                    tunaMayo: 0,
                    ayamMayo: 0,
                    ayamPedes: 0,
                    menuBulanan: 0,
                    jumlahKirim: 0,
                    hargaSikepal: 0,
                    periodeBayar: '',
                    sisa: 0,
                    jumlahPiutang: 0,
                    jumlahUang: 0,
                    pembayaran: '',
                    tanggalBayar: '',
                    diskon: 0,
                    company: company
                  });
                  setIsAdding(true);
                }}
                className="flex items-center gap-2 px-4 md:px-6 py-2 bg-primary text-on-primary rounded-xl font-bold text-[10px] md:text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span className="hidden sm:inline">Add Order</span>
                <span className="sm:hidden">Order</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50/50 space-y-4">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-sm">search</span>
              <input 
                type="text" 
                placeholder="Cari lokasi atau kurir..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[120px] flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Dari</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-medium outline-none bg-transparent w-full"
                />
              </div>
              <div className="flex-1 min-w-[120px] flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Sampai</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs font-medium outline-none bg-transparent w-full"
                />
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setStartDate(today);
                    setEndDate(today);
                    setCurrentPage(1);
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Today
                </button>
                {(startDate || endDate || filterKurir || filterLokasi || filterPembayaran || searchQuery) && (
                  <button 
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setFilterKurir('');
                      setFilterLokasi('');
                      setFilterPembayaran('');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select 
              value={filterKurir}
              onChange={(e) => setFilterKurir(e.target.value)}
              className="flex-1 min-w-[120px] px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Semua Kurir</option>
              {kurirOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>

            <select 
              value={filterLokasi}
              onChange={(e) => setFilterLokasi(e.target.value)}
              className="flex-1 min-w-[120px] px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Semua Lokasi</option>
              {lokasiOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            <select 
              value={filterPembayaran}
              onChange={(e) => setFilterPembayaran(e.target.value)}
              className="flex-1 min-w-[120px] px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Semua Pembayaran</option>
              {pembayaranOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Summary Section */}
        <div className="p-4 md:p-6 border-b border-stone-100 bg-white">
          <div className="hidden md:block min-w-[800px]">
            <div className="grid grid-cols-10 gap-4 mb-4">
              <div className="col-span-2 flex flex-col justify-center">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">TANGGAL</span>
                <span className="text-sm font-black text-stone-800">
                  {startDate === endDate && startDate ? formatDate(startDate) : 'Multiple Dates'}
                </span>
              </div>
              <div className="col-span-8 grid grid-cols-8 gap-2">
                <div className="text-center">
                  <span className="block text-[9px] font-black text-pink-500 uppercase leading-tight">TUNA<br/>PEDES</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-black text-blue-600 uppercase leading-tight">TUNA<br/>MAYO</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-black text-yellow-600 uppercase leading-tight">AYAM<br/>MAYO</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-black text-red-700 uppercase leading-tight">AYAM<br/>PEDES</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-black text-green-800 uppercase leading-tight">MENU<br/>BULANAN</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-black text-stone-800 uppercase leading-tight pt-2">JUMLAH</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-black text-stone-800 uppercase leading-tight pt-2">SISA</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-black text-stone-800 uppercase leading-tight pt-2">%</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-10 gap-4 items-center">
              <div className="col-span-2 flex flex-col justify-center">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">NAMA</span>
                <span className="text-sm font-black text-stone-800 uppercase">{filterKurir || 'SEMUA KURIR'}</span>
              </div>
              <div className="col-span-8 grid grid-cols-8 gap-2">
                <div className="text-center py-2 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-sm font-black text-stone-800">{summary.tunaPedes}</span>
                </div>
                <div className="text-center py-2 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-sm font-black text-stone-800">{summary.tunaMayo}</span>
                </div>
                <div className="text-center py-2 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-sm font-black text-stone-800">{summary.ayamMayo}</span>
                </div>
                <div className="text-center py-2 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-sm font-black text-stone-800">{summary.ayamPedes}</span>
                </div>
                <div className="text-center py-2 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-sm font-black text-stone-800">{summary.menuBulanan}</span>
                </div>
                <div className="text-center py-2 bg-stone-100 rounded-xl border border-stone-200">
                  <span className="text-sm font-black text-stone-900">{summary.jumlahKirim}</span>
                </div>
                <div className="text-center py-2 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-sm font-black text-stone-800">{summary.sisa}</span>
                </div>
                <div className="text-center py-2 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-sm font-black text-stone-800">{percentageSisa.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Summary */}
          <div className="md:hidden space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">RINGKASAN</span>
                <span className="text-lg font-black text-stone-800 uppercase">{filterKurir || 'SEMUA KURIR'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">TANGGAL</span>
                <span className="text-xs font-bold text-stone-600">
                  {startDate === endDate && startDate ? formatDate(startDate) : 'Multiple Dates'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="bg-pink-50 p-2.5 rounded-2xl border border-pink-100">
                <span className="text-[8px] font-black text-pink-500 uppercase block mb-0.5">Tuna Pedes</span>
                <span className="text-base font-black text-pink-700">{summary.tunaPedes}</span>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-2xl border border-blue-100">
                <span className="text-[8px] font-black text-blue-500 uppercase block mb-0.5">Tuna Mayo</span>
                <span className="text-base font-black text-blue-700">{summary.tunaMayo}</span>
              </div>
              <div className="bg-yellow-50 p-2.5 rounded-2xl border border-yellow-100">
                <span className="text-[8px] font-black text-yellow-600 uppercase block mb-0.5">Ayam Mayo</span>
                <span className="text-base font-black text-yellow-700">{summary.ayamMayo}</span>
              </div>
              <div className="bg-red-50 p-2.5 rounded-2xl border border-red-100">
                <span className="text-[8px] font-black text-red-500 uppercase block mb-0.5">Ayam Pedes</span>
                <span className="text-base font-black text-red-700">{summary.ayamPedes}</span>
              </div>
              <div className="bg-green-50 p-2.5 rounded-2xl border border-green-100">
                <span className="text-[8px] font-black text-green-600 uppercase block mb-0.5">Menu Bln</span>
                <span className="text-base font-black text-green-700">{summary.menuBulanan}</span>
              </div>
              <div className="bg-stone-100 p-2.5 rounded-2xl border border-stone-200">
                <span className="text-[8px] font-black text-stone-500 uppercase block mb-0.5">Total Kirim</span>
                <span className="text-base font-black text-stone-800">{summary.jumlahKirim}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 bg-stone-50 p-3 rounded-2xl border border-stone-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-stone-400 uppercase">Sisa</span>
                <span className="text-sm font-black text-stone-800">{summary.sisa}</span>
              </div>
              <div className="flex-1 bg-stone-50 p-3 rounded-2xl border border-stone-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-stone-400 uppercase">Persentase</span>
                <span className="text-sm font-black text-stone-800">{percentageSisa.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">TANGGAL</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">NAMA KURIR</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">NAMA LOKASI</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider text-center">TUNA PEDES</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider text-center">TUNA MAYO</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider text-center">AYAM MAYO</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider text-center">AYAM PEDES</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider text-center">MENU BULANAN</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider text-center">JUMLAH KIRIM</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">HARGA SIKEPAL</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">PERIODE BAYAR</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">SISA</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">JUMLAH PIUTANG</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">JUMLAH UANG</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">PEMBAYARAN</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">TANGGAL BAYAR</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">DISKON</th>
                <th className="px-4 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-4 py-4 text-xs text-stone-600">{formatDate(order.tanggal)}</td>
                    <td className="px-4 py-4 text-xs font-bold text-stone-800">{order.namaKurir}</td>
                    <td className="px-4 py-4 text-xs font-bold text-stone-800">
                      <button 
                        onClick={() => {
                          const store = stores.find(s => s.namaToko.toLowerCase() === order.namaLokasi.toLowerCase());
                          if (store) {
                            setSelectedStore(store);
                          } else {
                            // Fallback if not found in stores list
                            alert(`Data toko "${order.namaLokasi}" tidak ditemukan di database toko.`);
                          }
                        }}
                        className="hover:text-primary transition-colors text-left"
                      >
                        {order.namaLokasi}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-xs text-stone-600 text-center">{order.tunaPedes}</td>
                    <td className="px-4 py-4 text-xs text-stone-600 text-center">{order.tunaMayo}</td>
                    <td className="px-4 py-4 text-xs text-stone-600 text-center">{order.ayamMayo}</td>
                    <td className="px-4 py-4 text-xs text-stone-600 text-center">{order.ayamPedes}</td>
                    <td className="px-4 py-4 text-xs text-stone-600 text-center">{order.menuBulanan}</td>
                    <td className="px-4 py-4 text-xs font-bold text-primary text-center">{order.jumlahKirim}</td>
                    <td className="px-4 py-4 text-xs text-stone-600">Rp{order.hargaSikepal.toLocaleString()}</td>
                    <td className="px-4 py-4 text-xs text-stone-600">{order.periodeBayar}</td>
                    <td className="px-4 py-4 text-xs text-stone-600">{order.sisa.toLocaleString()}</td>
                    <td className="px-4 py-4 text-xs text-red-600 font-bold">{order.jumlahPiutang.toLocaleString()}</td>
                    <td className="px-4 py-4 text-xs text-green-600 font-bold">Rp{order.jumlahUang.toLocaleString()}</td>
                    <td className="px-4 py-4 text-xs text-stone-600">{order.pembayaran}</td>
                    <td className="px-4 py-4 text-xs text-stone-600">{formatDate(order.tanggalBayar)}</td>
                    <td className="px-4 py-4 text-xs text-stone-600">Rp{order.diskon.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">
                      {userRole !== 'kurir' && (
                        <button 
                          onClick={() => {
                            setNewOrder(order);
                            setIsAdding(true);
                          }}
                          className="text-stone-400 hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={18} className="px-6 py-12 text-center text-stone-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">receipt_long</span>
                    <p className="text-sm font-medium">Belum ada data orderan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-stone-100">
          {paginatedOrders.length > 0 ? (
            paginatedOrders.map((order) => (
              <div key={order.id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-black text-stone-400 uppercase tracking-wider mb-1">{formatDate(order.tanggal)}</div>
                    <button 
                      onClick={() => {
                        const store = stores.find(s => s.namaToko.toLowerCase() === order.namaLokasi.toLowerCase());
                        if (store) {
                          setSelectedStore(store);
                        } else {
                          alert(`Data toko "${order.namaLokasi}" tidak ditemukan di database toko.`);
                        }
                      }}
                      className="text-base font-black text-stone-800 uppercase text-left block hover:text-primary transition-colors"
                    >
                      {order.namaLokasi}
                    </button>
                    <div className="text-xs font-bold text-primary uppercase">{order.namaKurir}</div>
                  </div>
                  {userRole !== 'kurir' && (
                    <button 
                      onClick={() => {
                        setNewOrder(order);
                        setIsAdding(true);
                      }}
                      className="w-10 h-10 rounded-xl bg-stone-50 text-stone-400 flex items-center justify-center border border-stone-100"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                    <span className="text-[8px] font-black text-stone-400 uppercase block">Tuna Pds</span>
                    <span className="text-sm font-bold text-stone-800">{order.tunaPedes}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                    <span className="text-[8px] font-black text-stone-400 uppercase block">Tuna Myo</span>
                    <span className="text-sm font-bold text-stone-800">{order.tunaMayo}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                    <span className="text-[8px] font-black text-stone-400 uppercase block">Ayam Myo</span>
                    <span className="text-sm font-bold text-stone-800">{order.ayamMayo}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                    <span className="text-[8px] font-black text-stone-400 uppercase block">Ayam Pds</span>
                    <span className="text-sm font-bold text-stone-800">{order.ayamPedes}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                    <span className="text-[8px] font-black text-stone-400 uppercase block">Menu Bln</span>
                    <span className="text-sm font-bold text-stone-800">{order.menuBulanan}</span>
                  </div>
                  <div className="bg-primary/5 p-2 rounded-xl border border-primary/10">
                    <span className="text-[8px] font-black text-primary uppercase block">Total</span>
                    <span className="text-sm font-black text-primary">{order.jumlahKirim}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 bg-green-50 rounded-lg border border-green-100 flex items-center gap-2">
                    <span className="text-[9px] font-black text-green-600 uppercase">Uang</span>
                    <span className="text-xs font-bold text-green-700">Rp{order.jumlahUang.toLocaleString()}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
                    <span className="text-[9px] font-black text-red-600 uppercase">Piutang</span>
                    <span className="text-xs font-bold text-red-700">Rp{order.jumlahPiutang.toLocaleString()}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-stone-50 rounded-lg border border-stone-100 flex items-center gap-2">
                    <span className="text-[9px] font-black text-stone-400 uppercase">Sisa</span>
                    <span className="text-xs font-bold text-stone-600">{order.sisa}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2">
                    <span className="text-[9px] font-black text-blue-600 uppercase">Bayar</span>
                    <span className="text-xs font-bold text-blue-700">{order.pembayaran || '-'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-stone-400">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-20">receipt_long</span>
              <p className="text-sm font-medium">Belum ada data orderan</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <p className="text-xs text-stone-500 font-medium">
              Menampilkan {startIndex + 1} sampai {Math.min(startIndex + itemsPerPage, filteredOrders.length)} dari {filteredOrders.length} data
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg hover:bg-stone-200 disabled:opacity-30 transition-all"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                {getPaginationRange(currentPage, totalPages).map((page, i) => (
                  <button
                    key={i}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={page === '...'}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === page ? 'bg-primary text-on-primary' : 
                      page === '...' ? 'cursor-default text-stone-400' : 'hover:bg-stone-200 text-stone-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg hover:bg-stone-200 disabled:opacity-30 transition-all"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sync Settings Modal */}
      <AnimatePresence>
        {showSyncSettings && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSyncing && setShowSyncSettings(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="text-lg font-black text-stone-800 uppercase tracking-tight">Pengaturan Sinkronisasi</h3>
                <button 
                  onClick={() => setShowSyncSettings(false)}
                  disabled={isSyncing}
                  className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 transition-colors disabled:opacity-30"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tahun</label>
                    <select 
                      value={syncYear}
                      onChange={(e) => setSyncYear(e.target.value)}
                      disabled={isSyncing}
                      className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                    >
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Bulan</label>
                    <select 
                      value={syncMonth}
                      onChange={(e) => setSyncMonth(e.target.value)}
                      disabled={isSyncing}
                      className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                    >
                      <option value="Semua">Semua</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2000, i).toLocaleString('id-ID', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Hari</label>
                    <select 
                      value={syncDay}
                      onChange={(e) => setSyncDay(e.target.value)}
                      disabled={isSyncing}
                      className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                    >
                      <option value="Semua">Semua</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Sheet ID (GID)</label>
                  <input 
                    type="text" 
                    value={syncGid}
                    onChange={(e) => setSyncGid(e.target.value)}
                    disabled={isSyncing}
                    placeholder="Contoh: 0"
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                  />
                  <p className="text-[10px] text-stone-500 ml-1 italic">GID dari URL spreadsheet (biasanya 0 untuk sheet pertama).</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setShowSyncSettings(false)}
                    disabled={isSyncing}
                    className="flex-1 px-6 py-2 border border-stone-200 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-50 transition-all disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={syncFromSpreadsheet}
                    disabled={isSyncing}
                    className="flex-1 px-6 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSyncing ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        Syncing...
                      </>
                    ) : (
                      'Mulai Tarik Data'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="text-lg font-black text-stone-800 uppercase tracking-tight">
                  {newOrder.id ? 'Edit Order' : 'Tambah Order Baru'}
                </h3>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tanggal *</label>
                  <input 
                    type="date" 
                    value={newOrder.tanggal}
                    onChange={(e) => setNewOrder({...newOrder, tanggal: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nama Kurir</label>
                  <input 
                    type="text" 
                    value={newOrder.namaKurir}
                    onChange={(e) => setNewOrder({...newOrder, namaKurir: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nama Lokasi *</label>
                  <input 
                    type="text" 
                    value={newOrder.namaLokasi}
                    onChange={(e) => setNewOrder({...newOrder, namaLokasi: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tuna Pedes</label>
                  <input 
                    type="number" 
                    value={newOrder.tunaPedes}
                    onChange={(e) => setNewOrder({...newOrder, tunaPedes: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tuna Mayo</label>
                  <input 
                    type="number" 
                    value={newOrder.tunaMayo}
                    onChange={(e) => setNewOrder({...newOrder, tunaMayo: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Ayam Mayo</label>
                  <input 
                    type="number" 
                    value={newOrder.ayamMayo}
                    onChange={(e) => setNewOrder({...newOrder, ayamMayo: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Ayam Pedes</label>
                  <input 
                    type="number" 
                    value={newOrder.ayamPedes}
                    onChange={(e) => setNewOrder({...newOrder, ayamPedes: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Menu Bulanan</label>
                  <input 
                    type="number" 
                    value={newOrder.menuBulanan}
                    onChange={(e) => setNewOrder({...newOrder, menuBulanan: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Jumlah Kirim</label>
                  <input 
                    type="number" 
                    value={newOrder.jumlahKirim}
                    onChange={(e) => setNewOrder({...newOrder, jumlahKirim: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Harga Sikepal</label>
                  <input 
                    type="number" 
                    value={newOrder.hargaSikepal}
                    onChange={(e) => setNewOrder({...newOrder, hargaSikepal: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Periode Bayar</label>
                  <input 
                    type="text" 
                    value={newOrder.periodeBayar}
                    onChange={(e) => setNewOrder({...newOrder, periodeBayar: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Sisa</label>
                  <input 
                    type="number" 
                    value={newOrder.sisa}
                    onChange={(e) => setNewOrder({...newOrder, sisa: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Jumlah Piutang</label>
                  <input 
                    type="number" 
                    value={newOrder.jumlahPiutang}
                    onChange={(e) => setNewOrder({...newOrder, jumlahPiutang: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Jumlah Uang</label>
                  <input 
                    type="number" 
                    value={newOrder.jumlahUang}
                    onChange={(e) => setNewOrder({...newOrder, jumlahUang: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Pembayaran</label>
                  <input 
                    type="text" 
                    value={newOrder.pembayaran}
                    onChange={(e) => setNewOrder({...newOrder, pembayaran: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tanggal Bayar</label>
                  <input 
                    type="date" 
                    value={newOrder.tanggalBayar}
                    onChange={(e) => setNewOrder({...newOrder, tanggalBayar: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Diskon</label>
                  <input 
                    type="number" 
                    value={newOrder.diskon}
                    onChange={(e) => setNewOrder({...newOrder, diskon: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsAdding(false)}
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
      {/* Store Details Modal */}
      <AnimatePresence>
        {selectedStore && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStore(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden p-6"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm ${
                    selectedStore.grade === 'A' ? 'bg-green-500' :
                    selectedStore.grade === 'B' ? 'bg-blue-500' :
                    selectedStore.grade === 'C' ? 'bg-yellow-500' :
                    selectedStore.grade === 'D' ? 'bg-orange-500' :
                    selectedStore.grade === 'E' ? 'bg-red-500' :
                    'bg-stone-400'
                  }`}>
                    {selectedStore.grade || '-'}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-800 uppercase leading-tight">
                      {selectedStore.namaToko}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-bold uppercase">
                        {selectedStore.kategori || '-'}
                      </span>
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-bold uppercase">
                        {selectedStore.kurir || '-'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStore(null)}
                  className="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 transition-colors border border-stone-100 shadow-sm"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-stone-50/50 p-4 rounded-3xl border border-stone-100">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">PIC</span>
                  <div className="text-sm font-black text-stone-800 mb-1">{selectedStore.namaPIC || '-'}</div>
                  <div className="text-xs text-stone-500 font-bold">{selectedStore.nomorPIC || '-'}</div>
                </div>
                <div className="bg-stone-50/50 p-4 rounded-3xl border border-stone-100">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">Harga & Bayar</span>
                  <div className="text-sm font-black text-stone-800 mb-1">{selectedStore.harga || '-'}</div>
                  <div className="text-xs text-stone-500 font-bold uppercase">{selectedStore.pembayaran || '-'}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 px-4 py-3 bg-stone-50/50 rounded-2xl border border-stone-100">
                  <span className="material-symbols-outlined text-stone-400">schedule</span>
                  <span className="text-sm font-bold text-stone-700 uppercase">{selectedStore.operasional || '-'}</span>
                </div>

                {selectedStore.note && (
                  <div className="p-4 bg-stone-50/50 rounded-2xl border border-stone-100 text-xs text-stone-500 italic leading-relaxed">
                    {selectedStore.note}
                  </div>
                )}

                {selectedStore.linkGmaps && (
                  <a 
                    href={selectedStore.linkGmaps} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-stone-900 text-white rounded-2xl text-sm font-black transition-all hover:bg-stone-800 active:scale-95 shadow-lg shadow-stone-200"
                  >
                    <span className="material-symbols-outlined">location_on</span>
                    Buka di Google Maps
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderDatabase;
