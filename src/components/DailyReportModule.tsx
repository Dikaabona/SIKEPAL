import React, { useState, useMemo } from 'react';
import { Order, DeliveryRecord } from '../types';
import { motion } from 'motion/react';
import { parseIndoDate, formatDate } from '../lib/utils';

interface DailyReportModuleProps {
  orders: Order[];
  deliveries: DeliveryRecord[];
  company: string;
}

const DailyReportModule: React.FC<DailyReportModuleProps> = ({ orders, deliveries, company }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const reportData = useMemo(() => {
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

    // Get all unique (date, courier) pairs
    const pairs = new Set<string>();
    
    const normalizeDate = (dateStr: string) => {
      const d = parseIndoDate(dateStr);
      if (!d) return dateStr;
      return d.toISOString().split('T')[0];
    };

    filteredOrders.forEach(o => pairs.add(`${normalizeDate(o.tanggal)}|${o.namaKurir}`));
    filteredDeliveries.forEach(d => pairs.add(`${normalizeDate(d.tanggal)}|${d.namaKurir}`));

    return Array.from(pairs).map(pair => {
      const [tanggalNormalized, namaKurir] = pair.split('|');
      
      const dayOrders = filteredOrders.filter(o => normalizeDate(o.tanggal) === tanggalNormalized && o.namaKurir === namaKurir);
      const dayDeliveries = filteredDeliveries.filter(d => normalizeDate(d.tanggal) === tanggalNormalized && d.namaKurir === namaKurir);

      const jumlahLokasi = new Set(dayOrders.map(o => o.namaLokasi)).size;
      const jumlahKurirVisit = new Set(dayDeliveries.map(d => d.namaLokasi)).size;
      
      // Calculate totalKiriman as the sum of items to match "Jumlah" column in Order Database
      const totalKiriman = dayOrders.reduce((sum, o) => 
        sum + (o.tunaPedes || 0) + (o.tunaMayo || 0) + (o.ayamMayo || 0) + (o.ayamPedes || 0) + (o.menuBulanan || 0), 0);
      
      const totalKirimanKurir = dayDeliveries.reduce((sum, d) => sum + (d.qtyPengiriman || 0), 0);

      return {
        tanggal: tanggalNormalized,
        namaKurir,
        jumlahLokasi,
        jumlahKurirVisit,
        totalKiriman,
        totalKirimanKurir
      };
    }).sort((a, b) => {
      const dateA = parseIndoDate(a.tanggal);
      const dateB = parseIndoDate(b.tanggal);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0) || a.namaKurir.localeCompare(b.namaKurir);
    });
  }, [orders, deliveries, company, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-stone-100">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-stone-900 uppercase">Daily Delivery Report</h2>
          <p className="text-stone-500 font-medium">Monitoring performance harian kurir</p>
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
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Nama Kurir</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest text-center">Jumlah Lokasi</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest text-center">Jumlah Kurir Visit</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest text-center">Selisih (Lokasi)</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest text-center">Total Kiriman</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest text-center">Total Kiriman Kurir</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest text-center">Selisih QTY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {reportData.length > 0 ? (
                reportData.map((row, idx) => {
                  const selisih = row.totalKirimanKurir - row.totalKiriman;
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={`${row.tanggal}-${row.namaKurir}`} 
                      className="hover:bg-stone-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-stone-600">{formatDate(row.tanggal)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                            {row.namaKurir.charAt(0)}
                          </div>
                          <span className="font-bold text-stone-900">{row.namaKurir}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-stone-600">{row.jumlahLokasi}</td>
                      <td className="px-6 py-4 text-center font-black text-stone-600">{row.jumlahKurirVisit}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg font-black text-xs ${
                          (row.jumlahKurirVisit - row.jumlahLokasi) === 0 ? 'bg-green-100 text-green-600' : 
                          (row.jumlahKurirVisit - row.jumlahLokasi) > 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {(row.jumlahKurirVisit - row.jumlahLokasi) > 0 ? `+${row.jumlahKurirVisit - row.jumlahLokasi}` : row.jumlahKurirVisit - row.jumlahLokasi}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-stone-600">{row.totalKiriman}</td>
                      <td className="px-6 py-4 text-center font-black text-stone-600">{row.totalKirimanKurir}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg font-black text-xs ${
                          selisih === 0 ? 'bg-green-100 text-green-600' : 
                          selisih > 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {selisih > 0 ? `+${selisih}` : selisih}
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
      </div>
    </div>
  );
};

export default DailyReportModule;
