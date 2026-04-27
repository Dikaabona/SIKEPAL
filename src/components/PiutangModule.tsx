import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, UserRole, Store } from '../types';
import { parseIndoDate } from '../lib/utils';

interface PiutangModuleProps {
  orders: Order[];
  onNavigate: (tab: any) => void;
  company: string;
  stores: Store[];
}

const PiutangModule: React.FC<PiutangModuleProps> = ({ orders, onNavigate, company, stores }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const piutangData = useMemo(() => {
    if (!orders) return [];
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return orders
      .filter(order => 
        order.company === company && 
        order.pembayaran?.toUpperCase() === 'FALSE' &&
        order.status === 'Approved'
      )
      .map(order => {
        const orderDate = parseIndoDate(order.tanggal);
        if (!orderDate) return null;

        let daysToAdd = 0;
        const periode = order.periodeBayar?.toUpperCase() || '';

        if (periode === 'HARIAN') {
          daysToAdd = 1;
        } else if (periode.includes('MINGGUAN')) {
          daysToAdd = 7;
        } else if (periode === 'BULANAN') {
          daysToAdd = 30;
        }

        const dueDate = new Date(orderDate);
        dueDate.setDate(dueDate.getDate() + daysToAdd);
        dueDate.setHours(0, 0, 0, 0);

        if (now >= dueDate) {
          return {
            ...order,
            dueDate,
            daysOverdue: Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          };
        }
        return null;
      })
      .filter((n): n is any => n !== null)
      .filter(p => 
        p.namaLokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.namaKurir.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
  }, [orders, company, searchQuery]);

  const totalPages = Math.ceil(piutangData.length / ITEMS_PER_PAGE);
  const paginatedData = piutangData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleItemClick = (p: any) => {
    const store = stores.find(s => s.namaToko === p.namaLokasi);
    if (store) {
      onNavigate({ tab: 'order_database', storeId: store.id });
    } else {
      onNavigate('order_database');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-800 uppercase tracking-tight">Tagihan Piutang</h2>
          <p className="text-sm text-stone-500 font-medium">Monitoring invoice jatuh tempo</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-sm">search</span>
          <input 
            type="text" 
            placeholder="Cari lokasi..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        {paginatedData.length > 0 ? (
          paginatedData.map((p, i) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleItemClick(p)}
              className="group bg-white p-5 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div>
                  <h4 className="font-headline font-black text-stone-800 text-lg uppercase">{p.namaLokasi}</h4>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    Rp{p.jumlahUang.toLocaleString()} • {p.periodeBayar}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:text-right gap-6 px-2 sm:px-0">
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none mb-1">Jatuh Tempo</p>
                  <p className="text-sm font-black text-red-600 uppercase">
                    {p.daysOverdue === 0 ? 'Hari Ini' : `${p.daysOverdue} Hari Lewat`}
                  </p>
                </div>
                <div className="h-10 w-[1px] bg-stone-100 hidden sm:block"></div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest leading-none mb-1">Status</p>
                  <p className="text-sm font-black text-stone-800 uppercase">Terlambat</p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-stone-100 border-dashed">
            <div className="w-20 h-20 rounded-full bg-stone-50 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-stone-200">check_circle</span>
            </div>
            <h3 className="text-stone-800 font-bold uppercase tracking-wider">Semua Aman!</h3>
            <p className="text-stone-400 text-sm mt-1">Tidak ada tagihan piutang jatuh tempo.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-stone-200 text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                  currentPage === page 
                    ? 'bg-primary text-on-primary shadow-sm' 
                    : 'text-stone-400 hover:bg-stone-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-stone-200 text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PiutangModule;
