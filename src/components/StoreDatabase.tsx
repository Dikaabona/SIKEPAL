import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store } from '../types';
import { Icons } from '../constants';
import { getPaginationRange } from '../lib/utils';

interface StoreDatabaseProps {
  stores: Store[];
  onSaveStore: (store: Store) => void;
  onDeleteAllStores: () => void;
  company: string;
}

const StoreDatabase: React.FC<StoreDatabaseProps> = ({ stores, onSaveStore, onDeleteAllStores, company }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin menghapus SEMUA data toko? Tindakan ini tidak dapat dibatalkan.')) {
                onDeleteAllStores();
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
              isSyncing ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
            }`}
          >
            <span className={`material-symbols-outlined text-lg ${isSyncing ? 'animate-spin' : ''}`}>
              sync
            </span>
            {isSyncing ? 'Syncing...' : 'Sync Spreadsheet'}
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
            className="flex items-center gap-2 bg-primary text-on-primary font-bold text-sm px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">add_business</span>
            Add New Store
          </button>
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

        <div className="overflow-x-auto custom-scrollbar">
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
                      <div className="font-black text-stone-800 text-sm">{store.namaToko}</div>
                      {store.linkGmaps && (
                        <a 
                          href={store.linkGmaps} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1 mt-0.5 opacity-70 hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[11px]">location_on</span>
                          View on Maps
                        </a>
                      )}
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
                      <button 
                        onClick={() => {
                          setNewStore(store);
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
                  <td colSpan={11} className="px-6 py-12 text-center text-stone-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">storefront</span>
                    <p className="text-sm font-medium">No stores found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
