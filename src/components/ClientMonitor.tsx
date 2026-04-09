import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, Order } from '../types';
import { formatDate, getPaginationRange } from '../lib/utils';

interface ClientMonitorProps {
  stores: Store[];
  orders: Order[];
  company: string;
}

const ClientMonitor: React.FC<ClientMonitorProps> = ({ stores, orders, company }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'namaToko' | 'totalPiutang' | 'lastDelivery'>('namaToko');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  const clientData = useMemo(() => {
    return stores.map(store => {
      const storeOrders = orders.filter(o => o.namaLokasi === store.namaToko);
      
      // Pengiriman terakhir
      const lastOrder = storeOrders.length > 0 
        ? storeOrders.reduce((latest, current) => {
            const dateA = new Date(current.tanggal.split('/').reverse().join('-'));
            const dateB = new Date(latest.tanggal.split('/').reverse().join('-'));
            return dateA > dateB ? current : latest;
          })
        : null;

      // Piutang Orders (FALSE status)
      const unpaidOrders = storeOrders.filter(o => o.pembayaran?.toUpperCase() === 'FALSE');
      
      // Jumlah Piutang (Sum of values)
      const totalPiutang = unpaidOrders.reduce((sum, o) => sum + (o.jumlahUang || 0), 0);

      return {
        ...store,
        lastDelivery: lastOrder ? lastOrder.tanggal : '-',
        totalPiutang,
        unpaidOrders
      };
    });
  }, [stores, orders]);

  const filteredData = useMemo(() => {
    const filtered = clientData.filter(item => 
      item.namaToko.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.namaPIC && item.namaPIC.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'namaToko') {
        comparison = a.namaToko.localeCompare(b.namaToko);
      } else if (sortBy === 'totalPiutang') {
        comparison = a.totalPiutang - b.totalPiutang;
      } else if (sortBy === 'lastDelivery') {
        const dateA = a.lastDelivery === '-' ? 0 : new Date(a.lastDelivery.split('/').reverse().join('-')).getTime();
        const dateB = b.lastDelivery === '-' ? 0 : new Date(b.lastDelivery.split('/').reverse().join('-')).getTime();
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [clientData, searchQuery, sortBy, sortOrder]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when searching
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field: 'namaToko' | 'totalPiutang' | 'lastDelivery') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Client Monitor</h2>
          <p className="text-xs md:text-sm text-stone-500 font-medium">
            Pantau status dan piutang pelanggan Anda untuk {company}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400">search</span>
            <input
              type="text"
              placeholder="Cari nama toko atau PIC..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-3 bg-stone-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-stone-900 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value as any)}
              className="bg-stone-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-stone-600 focus:ring-2 focus:ring-stone-900 cursor-pointer"
            >
              <option value="namaToko">Nama Toko</option>
              <option value="totalPiutang">Jumlah Piutang</option>
              <option value="lastDelivery">Pengiriman Terakhir</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-stone-50 rounded-xl text-stone-600 hover:bg-stone-100 transition-all"
            >
              <span className="material-symbols-outlined text-sm">
                {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            </button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th 
                  className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest cursor-pointer hover:text-stone-900 transition-colors"
                  onClick={() => handleSort('namaToko')}
                >
                  <div className="flex items-center gap-1">
                    Nama Toko & Alamat
                    {sortBy === 'namaToko' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">PIC</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Nomor Whatsapp</th>
                <th 
                  className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center cursor-pointer hover:text-stone-900 transition-colors"
                  onClick={() => handleSort('lastDelivery')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Pengiriman Terakhir
                    {sortBy === 'lastDelivery' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right cursor-pointer hover:text-stone-900 transition-colors"
                  onClick={() => handleSort('totalPiutang')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Jumlah Piutang
                    {sortBy === 'totalPiutang' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-stone-900 text-sm">{item.namaToko}</div>
                    <div className="text-stone-500 text-[10px] mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">location_on</span>
                      {item.alamat || '-'}
                      {item.linkGmaps && (
                        <a href={item.linkGmaps} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          Maps
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-stone-900 text-sm">{item.namaPIC || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-stone-600 text-sm">{item.nomorPIC || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-stone-600 text-sm">{item.lastDelivery}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => item.totalPiutang > 0 && setSelectedClient(item)}
                      className={`font-bold text-sm px-3 py-1 rounded-lg transition-all ${
                        item.totalPiutang > 0 
                          ? 'text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer' 
                          : 'text-green-600 bg-green-50'
                      }`}
                    >
                      Rp {item.totalPiutang.toLocaleString('id-ID')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-stone-100">
          {paginatedData.map((item) => (
            <div key={item.id} className="p-4 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="font-black text-stone-900 text-base leading-tight uppercase tracking-tight">{item.namaToko}</div>
                  <div className="text-stone-500 text-[10px] mt-1 flex items-start gap-1">
                    <span className="material-symbols-outlined text-[14px] mt-0.5">location_on</span>
                    <span className="flex-1">
                      {item.alamat || '-'}
                      {item.linkGmaps && (
                        <a href={item.linkGmaps} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold ml-1">
                          MAPS
                        </a>
                      )}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => item.totalPiutang > 0 && setSelectedClient(item)}
                  className={`font-black text-xs px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                    item.totalPiutang > 0 
                      ? 'text-red-600 bg-red-50 active:scale-95' 
                      : 'text-green-600 bg-green-50'
                  }`}
                >
                  Rp {item.totalPiutang.toLocaleString('id-ID')}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">PIC & WhatsApp</p>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-stone-800">{item.namaPIC || '-'}</span>
                    <span className="text-[10px] text-stone-500">{item.nomorPIC || '-'}</span>
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Last Delivery</p>
                  <p className="text-xs font-bold text-stone-800">{item.lastDelivery}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="px-6 py-12 text-center text-stone-400">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">person_search</span>
            <p className="text-sm font-medium">Tidak ada data ditemukan</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <p className="text-xs text-stone-500 font-medium">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} clients
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
                      currentPage === page ? 'bg-stone-900 text-white' : 
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

      {/* Piutang Detail Modal */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClient(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div>
                  <h3 className="text-lg font-black text-stone-800 uppercase tracking-tight">Rincian Piutang</h3>
                  <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">{selectedClient.namaToko}</p>
                </div>
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="w-10 h-10 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="pb-3 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tanggal</th>
                      <th className="pb-3 text-[10px] font-black text-stone-400 uppercase tracking-widest">Kurir</th>
                      <th className="pb-3 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Qty</th>
                      <th className="pb-3 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Nilai Piutang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {selectedClient.unpaidOrders.map((order: Order) => (
                      <tr key={order.id}>
                        <td className="py-3 text-sm text-stone-600">{order.tanggal}</td>
                        <td className="py-3 text-sm text-stone-600">{order.namaKurir}</td>
                        <td className="py-3 text-sm text-stone-600 text-center">{order.jumlahKirim}</td>
                        <td className="py-3 text-sm font-bold text-red-600 text-right">
                          Rp {(order.jumlahUang || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-stone-100">
                      <td colSpan={3} className="pt-4 text-sm font-black text-stone-800 uppercase tracking-widest">Total Piutang</td>
                      <td className="pt-4 text-lg font-black text-red-600 text-right">
                        Rp {selectedClient.totalPiutang.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="p-6 bg-stone-50/50 border-t border-stone-100">
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientMonitor;
