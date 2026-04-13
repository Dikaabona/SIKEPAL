import React, { useState, useMemo } from 'react';
import { Order, DeliveryRecord, BillingRecord } from '../types';
import { motion } from 'motion/react';
import { parseIndoDate, formatDate, getLocalDateString } from '../lib/utils';

interface DailyReportModuleProps {
  orders: Order[];
  deliveries: DeliveryRecord[];
  billingReports: BillingRecord[];
  company: string;
}

const ITEMS_PER_PAGE = 10;

const DailyReportModule: React.FC<DailyReportModuleProps> = ({ orders, deliveries, billingReports, company }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [currentPage, setCurrentPage] = useState(1);

  const normalizeDate = (dateStr: string) => {
    const d = parseIndoDate(dateStr);
    if (!d) return dateStr;
    return getLocalDateString(d);
  };

  const combinedReportData = useMemo(() => {
    const start = parseIndoDate(startDate);
    const end = parseIndoDate(endDate);

    const filteredOrders = orders.filter(o => {
      if (o.company !== company) return false;
      const orderDate = parseIndoDate(o.tanggal);
      if (!orderDate) return false;
      return (!start || orderDate >= start) && (!end || orderDate <= end);
    });

    const filteredDeliveries = deliveries.filter(d => {
      if (d.company !== company) return false;
      const deliveryDate = parseIndoDate(d.tanggal);
      if (!deliveryDate) return false;
      return (!start || deliveryDate >= start) && (!end || deliveryDate <= end);
    });

    const filteredBilling = billingReports.filter(b => {
      if (b.company !== company) return false;
      const billingDate = parseIndoDate(b.tanggal);
      if (!billingDate) return false;
      return (!start || billingDate >= start) && (!end || billingDate <= end);
    });

    const pairs = new Set<string>();
    filteredOrders.forEach(o => pairs.add(`${normalizeDate(o.tanggal)}|${o.namaKurir}`));
    filteredDeliveries.forEach(d => pairs.add(`${normalizeDate(d.tanggal)}|${d.namaKurir}`));
    filteredBilling.forEach(b => pairs.add(`${normalizeDate(b.tanggal)}|${b.namaKurir}`));

    return Array.from(pairs).map(pair => {
      const [tanggalNormalized, namaKurir] = pair.split('|');
      
      const dayOrders = filteredOrders.filter(o => normalizeDate(o.tanggal) === tanggalNormalized && o.namaKurir === namaKurir);
      const dayDeliveries = filteredDeliveries.filter(d => normalizeDate(d.tanggal) === tanggalNormalized && d.namaKurir === namaKurir);
      const dayBilling = filteredBilling.filter(b => normalizeDate(b.tanggal) === tanggalNormalized && b.namaKurir === namaKurir);

      const jumlahLokasi = new Set(dayOrders.map(o => o.namaLokasi)).size;
      const jumlahKurirVisit = new Set(dayDeliveries.map(d => d.namaLokasi)).size;
      
      const totalKiriman = dayOrders.reduce((sum, o) => 
        sum + (o.tunaPedes || 0) + (o.tunaMayo || 0) + (o.ayamMayo || 0) + (o.ayamPedes || 0) + (o.menuBulanan || 0), 0);
      const totalKirimanKurir = dayDeliveries.reduce((sum, d) => sum + (d.qtyPengiriman || 0), 0);
      
      const totalTagihan = dayOrders.reduce((sum, o) => sum + (o.jumlahUang || 0), 0);
      const totalSetoran = dayBilling.reduce((sum, b) => sum + (b.qtyPengiriman || 0), 0);

      return { 
        tanggal: tanggalNormalized, 
        namaKurir, 
        jumlahLokasi, 
        jumlahKurirVisit, 
        totalKiriman, 
        totalKirimanKurir,
        totalTagihan,
        totalSetoran
      };
    }).sort((a, b) => {
      const dateA = parseIndoDate(a.tanggal);
      const dateB = parseIndoDate(b.tanggal);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0) || a.namaKurir.localeCompare(b.namaKurir);
    });
  }, [orders, deliveries, billingReports, company, startDate, endDate]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  const totalPages = Math.ceil(combinedReportData.length / ITEMS_PER_PAGE);
  const paginatedData = combinedReportData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-stone-100">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-stone-900 uppercase">
              Daily Report
            </h2>
            <p className="text-stone-500 font-medium">
              Monitoring performance dan setoran harian kurir
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-stone-100 p-2 rounded-2xl w-full md:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-stone-600 px-2 py-1"
          />
          <span className="text-stone-400 font-black">TO</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-stone-600 px-2 py-1"
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Nama Kurir</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Lokasi (Plan/Visit)</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Selisih Lokasi</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Qty (Plan/Real)</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Selisih Qty</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Tagihan</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Setoran</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Selisih Rp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, idx) => {
                  const selisihQty = row.totalKirimanKurir - row.totalKiriman;
                  const selisihRp = row.totalSetoran - row.totalTagihan;
                  const selisihLokasi = row.jumlahKurirVisit - row.jumlahLokasi;
                  
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={`${row.tanggal}-${row.namaKurir}`} 
                      className="hover:bg-stone-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-xs font-bold text-stone-600 whitespace-nowrap">{formatDate(row.tanggal)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                            {row.namaKurir.charAt(0)}
                          </div>
                          <span className="font-bold text-stone-900 text-xs">{row.namaKurir}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-black text-stone-700">{row.jumlahLokasi} / {row.jumlahKurirVisit}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                          selisihLokasi === 0 ? 'bg-green-100 text-green-600' : 
                          selisihLokasi > 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {selisihLokasi > 0 ? `+${selisihLokasi}` : selisihLokasi}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-black text-stone-700">{row.totalKiriman} / {row.totalKirimanKurir}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                          selisihQty === 0 ? 'bg-green-100 text-green-600' : 
                          selisihQty > 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {selisihQty > 0 ? `+${selisihQty}` : selisihQty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-black text-stone-600">
                        Rp {row.totalTagihan.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-black text-stone-600">
                        Rp {row.totalSetoran.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                          selisihRp === 0 ? 'bg-green-100 text-green-600' : 
                          selisihRp > 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {selisihRp > 0 ? `+${selisihRp.toLocaleString('id-ID')}` : selisihRp.toLocaleString('id-ID')}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-stone-400 font-bold">
                    Tidak ada data untuk periode ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Showing <span className="text-stone-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-stone-900">{Math.min(currentPage * ITEMS_PER_PAGE, combinedReportData.length)}</span> of <span className="text-stone-900">{combinedReportData.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <span className="material-symbols-outlined text-stone-600 text-sm">chevron_left</span>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${
                      currentPage === page 
                        ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20' 
                        : 'text-stone-400 hover:bg-white hover:text-stone-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <span className="material-symbols-outlined text-stone-600 text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReportModule;
