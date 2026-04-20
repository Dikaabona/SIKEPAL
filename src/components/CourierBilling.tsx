import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Order, Employee, Store, BillingRecord } from '../types';
import { getLocalDateString } from '../lib/utils';

interface CourierBillingProps {
  orders: Order[];
  employees: Employee[];
  billingReports: BillingRecord[];
  company: string;
}

const CourierBilling: React.FC<CourierBillingProps> = ({ orders, employees, company }) => {
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [searchQuery, setSearchQuery] = useState('');

  const courierStats = useMemo(() => {
    const stats: Record<string, {
      nama: string;
      totalOrders: number;
      totalQty: number;
      totalNilai: number;
      totalLunas: number;
      totalPiutang: number;
      totalWaste: number;
    }> = {};

    // Filter orders by date range
    const filteredOrders = orders.filter(order => {
      const orderDate = order.tanggal;
      return orderDate >= startDate && orderDate <= endDate;
    });

    filteredOrders.forEach(order => {
      const courierName = order.namaKurir || 'Tanpa Kurir';
      if (!stats[courierName]) {
        stats[courierName] = {
          nama: courierName,
          totalOrders: 0,
          totalQty: 0,
          totalNilai: 0,
          totalLunas: 0,
          totalPiutang: 0,
          totalWaste: 0
        };
      }

      const s = stats[courierName];
      s.totalOrders += 1;
      s.totalQty += order.jumlahKirim || 0;
      
      const totalNilaiOrder = (order.jumlahKirim || 0) * (order.hargaSikepal || 0);
      s.totalNilai += totalNilaiOrder;
      
      if (order.pembayaran === 'TRUE') {
        s.totalLunas += totalNilaiOrder;
      } else {
        s.totalPiutang += order.sisa || totalNilaiOrder;
      }
      
      s.totalWaste += order.waste || 0;
    });

    return Object.values(stats).filter(s => 
      s.nama.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => b.totalNilai - a.totalNilai);
  }, [orders, startDate, endDate, searchQuery]);

  const totals = useMemo(() => {
    return courierStats.reduce((acc, curr) => ({
      orders: acc.orders + curr.totalOrders,
      qty: acc.qty + curr.totalQty,
      nilai: acc.nilai + curr.totalNilai,
      lunas: acc.lunas + curr.totalLunas,
      piutang: acc.piutang + curr.totalPiutang,
      waste: acc.waste + curr.totalWaste
    }), { orders: 0, qty: 0, nilai: 0, lunas: 0, piutang: 0, waste: 0 });
  }, [courierStats]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Penagihan Kurir</h2>
          <p className="text-xs md:text-sm text-stone-500 font-medium">
            Monitor penagihan dan setoran kurir untuk {company}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl p-1 shadow-sm">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold text-stone-600 focus:outline-none bg-transparent"
            />
            <span className="text-stone-300">/</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold text-stone-600 focus:outline-none bg-transparent"
            />
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari kurir..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full md:w-64 transition-all"
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-sm">search</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Penjualan</p>
          <h3 className="text-2xl font-black text-stone-800">{formatCurrency(totals.nilai)}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{totals.qty} Porsi</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Sudah Lunas</p>
          <h3 className="text-2xl font-black text-green-600">{formatCurrency(totals.lunas)}</h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-green-500 h-full transition-all duration-1000" 
                style={{ width: `${totals.nilai > 0 ? (totals.lunas / totals.nilai) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Piutang</p>
          <h3 className="text-2xl font-black text-orange-600">{formatCurrency(totals.piutang)}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-black px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">Outstanding</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Waste</p>
          <h3 className="text-2xl font-black text-red-600">{totals.waste} Porsi</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-black px-2 py-0.5 bg-red-50 text-red-600 rounded-full">Kehilangan/Rusak</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">Nama Kurir</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">Orderan</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">Total Qty</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-right">Nilai Jual</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-right">Lunas</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-right">Piutang</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">Waste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {courierStats.length > 0 ? (
                courierStats.map((stat, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-xs uppercase">
                          {stat.nama.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-stone-800">{stat.nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded-lg">
                        {stat.totalOrders}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-medium text-sm text-stone-600">
                      {stat.totalQty}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="text-sm font-black text-stone-800">
                        {formatCurrency(stat.totalNilai)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(stat.totalLunas)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="text-sm font-bold text-orange-600">
                        {formatCurrency(stat.totalPiutang)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.totalWaste > 0 ? 'bg-red-50 text-red-600' : 'bg-stone-50 text-stone-400'}`}>
                        {stat.totalWaste}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">payments</span>
                    <p className="text-sm font-medium">Tidak ada data penagihan pada periode ini</p>
                  </td>
                </tr>
              )}
            </tbody>
            {courierStats.length > 0 && (
              <tfoot className="bg-stone-50/50 font-black">
                <tr>
                  <td className="px-6 py-4 text-sm text-stone-800">TOTAL</td>
                  <td className="px-6 py-4 text-center text-sm text-stone-800">{totals.orders}</td>
                  <td className="px-6 py-4 text-center text-sm text-stone-800">{totals.qty}</td>
                  <td className="px-6 py-4 text-right text-sm text-stone-800">{formatCurrency(totals.nilai)}</td>
                  <td className="px-6 py-4 text-right text-sm text-green-600">{formatCurrency(totals.lunas)}</td>
                  <td className="px-6 py-4 text-right text-sm text-orange-600">{formatCurrency(totals.piutang)}</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">{totals.waste}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default CourierBilling;
