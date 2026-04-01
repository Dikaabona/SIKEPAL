import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '../types';
import { supabase } from '../lib/supabase';

interface OrderDatabaseProps {
  orders: Order[];
  onSaveOrder: (order: Order) => Promise<void>;
  onDeleteAllOrders: () => Promise<void>;
  company: string;
}

const OrderDatabase: React.FC<OrderDatabaseProps> = ({ 
  orders, 
  onSaveOrder, 
  onDeleteAllOrders,
  company 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
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

  const filteredOrders = useMemo(() => {
    return orders.filter(order => 
      order.namaLokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.namaKurir.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [orders, searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

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
      const sheetUrl = "https://docs.google.com/spreadsheets/d/1FdhqqzioWvySOgK0o4mw6q9-DTUJdLwoDToYr1xKgwA/export?format=csv&gid=0";
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
        const cleaned = val.replace(/[^\d]/g, '');
        return parseInt(cleaned) || 0;
      };

      for (const row of dataRows) {
        if (row.length < 3) continue;

        const tanggalValue = row[idx.tanggal] || '';
        
        // Filter for year 2026 only
        if (!tanggalValue.includes('2026') && !tanggalValue.includes('/26') && !tanggalValue.includes('-26')) {
          skippedCount++;
          continue;
        }

        const orderId = `order_${tanggalValue}_${row[idx.lokasi] || Math.random().toString(36).substr(2, 9)}`.toLowerCase().replace(/[^a-z0-9]/g, '_');

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

        await onSaveOrder(order);
        syncCount++;
      }

      alert(`Berhasil sinkronisasi ${syncCount} data orderan tahun 2026. (${skippedCount} data tahun lain dilewati)`);
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
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin menghapus SEMUA data orderan?')) {
                onDeleteAllOrders();
              }
            }}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            Clear All
          </button>
          <button 
            onClick={syncFromSpreadsheet}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm ${
              isSyncing ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-white text-primary border border-primary hover:bg-primary/5'
            }`}
          >
            <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
            {isSyncing ? 'Syncing...' : 'Sync Spreadsheet'}
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
            className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Order
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-sm">search</span>
            <input 
              type="text" 
              placeholder="Cari lokasi atau kurir..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
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
                    <td className="px-4 py-4 text-xs text-stone-600">{order.tanggal}</td>
                    <td className="px-4 py-4 text-xs font-bold text-stone-800">{order.namaKurir}</td>
                    <td className="px-4 py-4 text-xs font-bold text-stone-800">{order.namaLokasi}</td>
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
                    <td className="px-4 py-4 text-xs text-stone-600">{order.tanggalBayar}</td>
                    <td className="px-4 py-4 text-xs text-stone-600">Rp{order.diskon.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">
                      <button 
                        onClick={() => {
                          setNewOrder(order);
                          setIsAdding(true);
                        }}
                        className="text-stone-400 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
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
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === i + 1 ? 'bg-primary text-on-primary' : 'hover:bg-stone-200 text-stone-600'
                    }`}
                  >
                    {i + 1}
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
    </div>
  );
};

export default OrderDatabase;
