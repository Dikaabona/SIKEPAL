import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { Store, UserRole } from '../types';
import { Icons } from '../constants';
import { getPaginationRange } from '../lib/utils';

interface StoreDatabaseProps {
  stores: Store[];
  onSaveStore: (store: Store) => void;
  onDeleteAllStores: () => void;
  company: string;
  userRole: UserRole;
}

const StoreDatabase: React.FC<StoreDatabaseProps> = ({ stores, onSaveStore, onDeleteAllStores, company, userRole }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedStoreForDetail, setSelectedStoreForDetail] = useState<Store | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;

  const [newStore, setNewStore] = useState<Partial<Store>>({
    namaToko: '',
    grade: '',
    namaPIC: '',
    nomorPIC: '',
    linkGmaps: '',
    kategori: '',
    harga: '',
    pembayaran: '',
    operasional: '',
    kurir: '',
    note: '',
  });

  const filteredStores = stores.filter(store => 
    store.namaToko.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.namaPIC.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStores = filteredStores.slice(startIndex, startIndex + itemsPerPage);

  const handleSave = () => {
    if (!newStore.namaToko) {
      alert('Nama Toko wajib diisi');
      return;
    }

    const store: Store = {
      id: (newStore as Store).id || Math.random().toString(36).substring(2, 15),
      namaToko: newStore.namaToko || '',
      grade: newStore.grade || '',
      namaPIC: newStore.namaPIC || '',
      nomorPIC: newStore.nomorPIC || '',
      linkGmaps: newStore.linkGmaps || '',
      kategori: newStore.kategori || '',
      harga: newStore.harga || '',
      pembayaran: newStore.pembayaran || '',
      operasional: newStore.operasional || '',
      kurir: newStore.kurir || '',
      note: newStore.note || '',
      company,
      updatedAt: new Date().toISOString(),
    };

    onSaveStore(store);
    setIsAdding(false);
    setNewStore({
      namaToko: '',
      grade: '',
      namaPIC: '',
      nomorPIC: '',
      linkGmaps: '',
      kategori: '',
      harga: '',
      pembayaran: '',
      operasional: '',
      kurir: '',
      note: '',
    });
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Nama Toko': 'Contoh Toko A',
        'Grade': 'A',
        'Nama PIC': 'Budi',
        'Nomor PIC': '08123456789',
        'Link Gmaps': 'https://goo.gl/maps/...',
        'Kategori': 'Sekolah',
        'Harga': 'Rp7.500',
        'Pembayaran': 'Harian',
        'Operasional': 'Senin - Jumat',
        'Kurir': 'Adol',
        'Note': '-'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Store");
    XLSX.writeFile(wb, "Template_Store_Database.xlsx");
  };

  const handleExport = () => {
    if (stores.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }
    const exportData = stores.map(store => ({
      'Nama Toko': store.namaToko,
      'Grade': store.grade,
      'Nama PIC': store.namaPIC,
      'Nomor PIC': store.nomorPIC,
      'Link Gmaps': store.linkGmaps,
      'Kategori': store.kategori,
      'Harga': store.harga,
      'Pembayaran': store.pembayaran,
      'Operasional': store.operasional,
      'Kurir': store.kurir,
      'Note': store.note
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Store Database");
    XLSX.writeFile(wb, `Store_Database_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          alert('File kosong atau format tidak sesuai');
          return;
        }

        let importCount = 0;
        for (const row of jsonData) {
          const storeName = row['Nama Toko'] || row['namaToko'];
          if (!storeName) continue;

          const storeId = `store_${storeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const store: Store = {
            id: storeId,
            namaToko: storeName,
            grade: row['Grade'] || row['grade'] || '',
            namaPIC: row['Nama PIC'] || row['namaPIC'] || '',
            nomorPIC: row['Nomor PIC'] || row['nomorPIC'] || '',
            linkGmaps: row['Link Gmaps'] || row['linkGmaps'] || '',
            kategori: row['Kategori'] || row['kategori'] || '',
            harga: row['Harga'] || row['harga'] || '',
            pembayaran: row['Pembayaran'] || row['pembayaran'] || '',
            operasional: row['Operasional'] || row['operasional'] || '',
            kurir: row['Kurir'] || row['kurir'] || '',
            note: row['Note'] || row['note'] || '',
            company,
            updatedAt: new Date().toISOString(),
          };
          await onSaveStore(store);
          importCount++;
        }
        alert(`Import berhasil! ${importCount} data toko telah ditambahkan/diperbarui.`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Gagal mengimpor file. Pastikan format file benar.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const syncFromSpreadsheet = async () => {
    setIsSyncing(true);
    try {
      // URL CSV export dari Google Sheets
      const sheetId = '1FdhqqzioWvySOgK0o4mw6q9-DTUJdLwoDToYr1xKgwA';
      const gid = '268786141';
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
      
      const response = await fetch(url);
      const csvText = await response.text();
      
      // Improved CSV parser to handle empty columns and quoted values correctly
      const rows = csvText.split('\n').map(row => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
      });

      // Skip header row
      const dataRows = rows.slice(1);
      
      let syncCount = 0;
      for (const row of dataRows) {
        if (row.length < 2 || !row[0]) continue; // Skip empty rows or rows without name

        const storeName = row[0].trim();
        // Gunakan nama toko sebagai basis ID agar data tidak double (upsert)
        // Kita slugify nama toko untuk ID yang konsisten
        const storeId = `store_${storeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        // Debug log untuk memastikan data terbaca
        console.log(`Syncing store: ${storeName}, No PIC: ${row[3]}`);

        // Mapping based on provided image:
        // A (0): Nama Lokasi
        // B (1): Grade
        // C (2): Nama PIC
        // D (3): Nomor PIC
        // E (4): Link Gmap
        // F (5): Kategori
        // G (6): Harga Sikepal
        // H (7): Pembayaran
        // I (8): Hari Operasional
        // J (9): Pengirim (Kurir)
        // K (10): Note
        const store: Store = {
          id: storeId,
          namaToko: storeName,
          grade: row[1] || '',
          namaPIC: row[2] || '',
          nomorPIC: row[3] || '',
          linkGmaps: row[4] || '',
          kategori: row[5] || '',
          harga: row[6] || '',
          pembayaran: row[7] || '',
          operasional: row[8] || '',
          kurir: row[9] || '', 
          note: row[10] || '', 
          company,
          updatedAt: new Date().toISOString(),
        };

        await onSaveStore(store);
        syncCount++;
      }

      alert(`Sinkronisasi berhasil! ${syncCount} data toko telah diperbarui.`);
    } catch (error) {
      console.error('Sync error:', error);
      alert('Gagal sinkronisasi data dari spreadsheet. Pastikan spreadsheet dapat diakses publik.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-800 uppercase tracking-tight">Store Database</h2>
          <p className="text-stone-500 text-sm font-medium">Manage and sync store information</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {userRole === 'owner' && (
            <button 
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin menghapus SEMUA data toko? Tindakan ini tidak dapat dibatalkan.')) {
                  onDeleteAllStores();
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
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImport} 
                accept=".xlsx, .xls" 
                className="hidden" 
              />
              
              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white text-stone-600 border border-stone-200 rounded-xl font-bold text-[10px] md:text-sm hover:bg-stone-50 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">description</span>
                <span>Template</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white text-stone-600 border border-stone-200 rounded-xl font-bold text-[10px] md:text-sm hover:bg-stone-50 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">upload</span>
                <span>Import</span>
              </button>

              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-[10px] md:text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                <span>Ekspor</span>
              </button>
              
              <button 
                onClick={() => {
                  setNewStore({
                    namaToko: '',
                    grade: '',
                    namaPIC: '',
                    nomorPIC: '',
                    linkGmaps: '',
                    kategori: '',
                    harga: '',
                    pembayaran: '',
                    operasional: '',
                    kurir: '',
                    note: '',
                  });
                  setIsAdding(true);
                }}
                className="flex items-center gap-2 bg-primary text-on-primary font-bold text-[10px] md:text-sm px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined text-lg">add_business</span>
                <span className="hidden sm:inline">Add New Store</span>
                <span className="sm:hidden">Add Store</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search stores or PIC..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap">Nama Toko</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap text-center">Grade</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap">PIC</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap">No PIC</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap">Kategori</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap">Harga</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap">Pembayaran</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap">Operasional</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap">Kurir</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap">Note</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedStores.length > 0 ? (
                paginatedStores.map((store) => (
                  <tr key={store.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedStoreForDetail(store)}
                        className="text-left group/name"
                      >
                        <div className="font-black text-stone-800 text-sm group-hover/name:text-primary transition-colors">{store.namaToko}</div>
                        {store.linkGmaps && (
                          <div className="text-[9px] font-bold text-primary flex items-center gap-1 mt-0.5 opacity-70">
                            <span className="material-symbols-outlined text-[11px]">location_on</span>
                            View on Maps
                          </div>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[11px] font-black shadow-sm ${
                        store.grade === 'A' ? 'bg-green-500 text-white' :
                        store.grade === 'B' ? 'bg-blue-500 text-white' :
                        store.grade === 'C' ? 'bg-yellow-500 text-white' :
                        store.grade === 'D' ? 'bg-orange-500 text-white' :
                        store.grade === 'E' ? 'bg-red-500 text-white' :
                        'bg-stone-200 text-stone-600'
                      }`}>
                        {store.grade || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-stone-700 font-bold uppercase tracking-tight">{store.namaPIC || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-stone-500 font-medium">{store.nomorPIC || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded-md text-[10px] font-bold uppercase">{store.kategori || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-stone-600 font-bold">{store.harga || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-stone-500 font-medium uppercase">{store.pembayaran || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-stone-500 font-medium uppercase">{store.operasional || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-stone-700 font-bold uppercase">{store.kurir || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500 font-medium max-w-[200px] truncate" title={store.note}>{store.note || '-'}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {userRole !== 'kurir' && (
                        <button 
                          onClick={() => {
                            setNewStore(store);
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
                  <td colSpan={11} className="px-6 py-12 text-center text-stone-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">storefront</span>
                    <p className="text-sm font-medium">No stores found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-stone-100">
          {paginatedStores.length > 0 ? (
            paginatedStores.map((store) => (
              <div key={store.id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <button 
                      onClick={() => setSelectedStoreForDetail(store)}
                      className="text-left w-full"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[9px] font-black shadow-sm ${
                          store.grade === 'A' ? 'bg-green-500 text-white' :
                          store.grade === 'B' ? 'bg-blue-500 text-white' :
                          store.grade === 'C' ? 'bg-yellow-500 text-white' :
                          store.grade === 'D' ? 'bg-orange-500 text-white' :
                          store.grade === 'E' ? 'bg-red-500 text-white' :
                          'bg-stone-200 text-stone-600'
                        }`}>
                          {store.grade || '-'}
                        </span>
                        <div className="font-black text-stone-800 text-base uppercase">{store.namaToko}</div>
                      </div>
                    </button>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[9px] font-bold uppercase">{store.kategori || '-'}</span>
                      <span className="px-2 py-0.5 bg-primary/5 text-primary rounded-md text-[9px] font-bold uppercase">{store.kurir || '-'}</span>
                    </div>
                  </div>
                  {userRole !== 'kurir' && (
                    <button 
                      onClick={() => {
                        setNewStore(store);
                        setIsAdding(true);
                      }}
                      className="w-10 h-10 rounded-xl bg-stone-50 text-stone-400 flex items-center justify-center border border-stone-100"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">PIC</span>
                    <div className="text-sm font-bold text-stone-800">{store.namaPIC || '-'}</div>
                    <div className="text-[10px] text-stone-500 font-medium">{store.nomorPIC || '-'}</div>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">Harga & Bayar</span>
                    <div className="text-sm font-bold text-stone-800">{store.harga || '-'}</div>
                    <div className="text-[10px] text-stone-500 font-medium uppercase">{store.pembayaran || '-'}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-stone-600">
                    <span className="material-symbols-outlined text-sm text-stone-400">schedule</span>
                    <span className="font-medium uppercase">{store.operasional || '-'}</span>
                  </div>
                  {store.note && (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-500 italic">
                      {store.note}
                    </div>
                  )}
                  {store.linkGmaps && (
                    <a 
                      href={store.linkGmaps} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      Buka di Google Maps
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-stone-400">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-20">storefront</span>
              <p className="text-sm font-medium">No stores found</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <p className="text-xs text-stone-500 font-medium">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStores.length)} of {filteredStores.length} stores
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

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedStoreForDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStoreForDetail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden p-6"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black shadow-sm ${
                    selectedStoreForDetail.grade === 'A' ? 'bg-green-500 text-white' :
                    selectedStoreForDetail.grade === 'B' ? 'bg-blue-500 text-white' :
                    selectedStoreForDetail.grade === 'C' ? 'bg-yellow-500 text-white' :
                    selectedStoreForDetail.grade === 'D' ? 'bg-orange-500 text-white' :
                    selectedStoreForDetail.grade === 'E' ? 'bg-red-500 text-white' :
                    'bg-stone-200 text-stone-600'
                  }`}>
                    {selectedStoreForDetail.grade || '-'}
                  </span>
                  <h3 className="text-2xl font-black text-stone-800 uppercase tracking-tight">
                    {selectedStoreForDetail.namaToko}
                  </h3>
                </div>
                {userRole !== 'kurir' && (
                  <button 
                    onClick={() => {
                      setNewStore(selectedStoreForDetail);
                      setSelectedStoreForDetail(null);
                      setIsAdding(true);
                    }}
                    className="w-12 h-12 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 hover:text-primary transition-all"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-4 py-1.5 bg-stone-100 text-stone-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  {selectedStoreForDetail.kategori || '-'}
                </span>
                <span className="px-4 py-1.5 bg-orange-50 text-orange-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  {selectedStoreForDetail.kurir || '-'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-stone-50/50 p-5 rounded-[32px] border border-stone-100">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">PIC</span>
                  <div className="text-lg font-black text-stone-800 mb-1">{selectedStoreForDetail.namaPIC || '-'}</div>
                  <div className="text-xs text-stone-500 font-bold">{selectedStoreForDetail.nomorPIC || '-'}</div>
                </div>
                <div className="bg-stone-50/50 p-5 rounded-[32px] border border-stone-100">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">Harga & Bayar</span>
                  <div className="text-lg font-black text-stone-800 mb-1">{selectedStoreForDetail.harga || '-'}</div>
                  <div className="text-xs text-stone-500 font-bold uppercase">{selectedStoreForDetail.pembayaran || '-'}</div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 text-stone-600">
                  <span className="material-symbols-outlined text-2xl text-stone-400">schedule</span>
                  <span className="text-sm font-black uppercase tracking-tight">{selectedStoreForDetail.operasional || '-'}</span>
                </div>

                {selectedStoreForDetail.linkGmaps && (
                  <a 
                    href={selectedStoreForDetail.linkGmaps} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-5 bg-stone-900 text-white rounded-[24px] text-sm font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-stone-900/20"
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
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="text-lg font-black text-stone-800 uppercase tracking-tight">
                  {newStore.id ? 'Edit Store' : 'Add New Store'}
                </h3>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nama Toko *</label>
                  <input 
                    type="text" 
                    value={newStore.namaToko}
                    onChange={(e) => setNewStore({...newStore, namaToko: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Grade</label>
                  <select 
                    value={newStore.grade}
                    onChange={(e) => setNewStore({...newStore, grade: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Grade</option>
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                    <option value="D">Grade D</option>
                    <option value="E">Grade E</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nama PIC</label>
                  <input 
                    type="text" 
                    value={newStore.namaPIC}
                    onChange={(e) => setNewStore({...newStore, namaPIC: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nomor PIC</label>
                  <input 
                    type="text" 
                    value={newStore.nomorPIC}
                    onChange={(e) => setNewStore({...newStore, nomorPIC: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Link Gmaps</label>
                  <input 
                    type="text" 
                    value={newStore.linkGmaps}
                    onChange={(e) => setNewStore({...newStore, linkGmaps: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Kategori</label>
                  <input 
                    type="text" 
                    value={newStore.kategori}
                    onChange={(e) => setNewStore({...newStore, kategori: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Harga</label>
                  <input 
                    type="text" 
                    value={newStore.harga}
                    onChange={(e) => setNewStore({...newStore, harga: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Pembayaran</label>
                  <input 
                    type="text" 
                    value={newStore.pembayaran}
                    onChange={(e) => setNewStore({...newStore, pembayaran: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Operasional</label>
                  <input 
                    type="text" 
                    value={newStore.operasional}
                    onChange={(e) => setNewStore({...newStore, operasional: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Kurir</label>
                  <input 
                    type="text" 
                    value={newStore.kurir}
                    onChange={(e) => setNewStore({...newStore, kurir: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Note</label>
                  <textarea 
                    value={newStore.note}
                    onChange={(e) => setNewStore({...newStore, note: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 bg-stone-50 border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-2 text-stone-500 font-bold text-sm hover:bg-stone-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-8 py-2 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  Save Store
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoreDatabase;
