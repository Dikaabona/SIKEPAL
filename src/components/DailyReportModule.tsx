import React, { useState, useMemo } from 'react';
import { Order, DeliveryRecord } from '../types';
import { motion } from 'motion/react';

interface DailyReportModuleProps {
  orders: Order[];
  deliveries: DeliveryRecord[];
  company: string;
}

const DailyReportModule: React.FC<DailyReportModuleProps> = ({ orders, deliveries, company }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const reportData = useMemo(() => {
    const filteredOrders = orders.filter(o => 
      o.company === company && 
      o.tanggal >= startDate && 
      o.tanggal <= endDate
    );
    const filteredDeliveries = deliveries.filter(d => 
      d.company === company && 
      d.tanggal >= startDate && 
      d.tanggal <= endDate
    );

    // Get all unique (date, courier) pairs
    const pairs = new Set<string>();
    filteredOrders.forEach(o => pairs.add(`${o.tanggal}|${o.namaKurir}`));
    filteredDeliveries.forEach(d => pairs.add(`${d.tanggal}|${d.namaKurir}`));

    return Array.from(pairs).map(pair => {
      const [tanggal, namaKurir] = pair.split('|');
      
      const dayOrders = filteredOrders.filter(o => o.tanggal === tanggal && o.namaKurir === namaKurir);
      const dayDeliveries = filteredDeliveries.filter(d => d.tanggal === tanggal && d.namaKurir === namaKurir);

      const jumlahLokasi = new Set(dayOrders.map(o => o.namaLokasi)).size;
      const jumlahKurirVisit = new Set(dayDeliveries.map(d => d.namaLokasi)).size;
      const totalKiriman = dayOrders.reduce((sum, o) => sum + (o.jumlahKirim || 0), 0);
      const totalKirimanKurir = dayDeliveries.reduce((sum, d) => sum + (d.qtyPengiriman || 0), 0);

      return {
        tanggal,
        namaKurir,
        jumlahLokasi,
        jumlahKurirVisit,
        totalKiriman,
        totalKirimanKurir
      };
    }).sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.namaKurir.localeCompare(b.namaKurir));
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
                      <td className="px-6 py-4 font-bold text-stone-600">{row.tanggal}</td>
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
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-400 font-bold">
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
