import React, { useState, useMemo, useRef } from 'react';
import { Order } from '../types';
import { motion } from 'motion/react';

interface PrintAdminProps {
  company: string;
  orders: Order[];
}

const parseIndoDate = (dateStr: string) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();

  // Handle YYYY-MM-DD (from input date) - Parse as local time to avoid timezone mismatch
  if (cleanStr.includes('-') && cleanStr.split('-')[0].length === 4) {
    const parts = cleanStr.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY (possibly with DayName prefix like "Kamis, 02/04/2026")
  const datePattern = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/;
  const match = cleanStr.match(datePattern);
  if (match) {
    const d = parseInt(match[1]);
    const m = parseInt(match[2]) - 1;
    let y = parseInt(match[3]);
    if (y < 100) y += 2000;
    return new Date(y, m, d);
  }

  // Handle "Rabu, 1 April 2026" or "Rabu, 1, April, 2026" format
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

  const d = new Date(cleanStr);
  return isNaN(d.getTime()) ? null : d;
};

const PrintAdmin: React.FC<PrintAdminProps> = ({ orders }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const couriers = useMemo(() => {
    const targetDate = parseIndoDate(selectedDate);
    if (!targetDate) return [];
    const targetTime = targetDate.getTime();

    const uniqueCouriers = Array.from(new Set(
      orders
        .filter(o => {
          const orderDate = parseIndoDate(o.tanggal);
          return orderDate && orderDate.getTime() === targetTime;
        })
        .map(o => o.namaKurir)
    )).filter(Boolean);
    return uniqueCouriers.sort();
  }, [orders, selectedDate]);

  const locations = useMemo(() => {
    const targetDate = parseIndoDate(selectedDate);
    if (!targetDate) return [];
    const targetTime = targetDate.getTime();

    const uniqueLocations = Array.from(new Set(
      orders
        .filter(o => {
          const orderDate = parseIndoDate(o.tanggal);
          return orderDate && orderDate.getTime() === targetTime && 
                 (o.namaKurir === selectedCourier || selectedCourier === '');
        })
        .map(o => o.namaLokasi)
    )).filter(Boolean);
    return uniqueLocations.sort();
  }, [orders, selectedCourier, selectedDate]);

  const filteredOrders = useMemo(() => {
    const targetDate = parseIndoDate(selectedDate);
    if (!targetDate) return [];
    const targetTime = targetDate.getTime();

    return orders.filter(o => {
      const orderDate = parseIndoDate(o.tanggal);
      return orderDate && orderDate.getTime() === targetTime && 
             (selectedCourier === '' || o.namaKurir === selectedCourier) &&
             (selectedLocation === '' || o.namaLokasi === selectedLocation);
    });
  }, [orders, selectedDate, selectedCourier, selectedLocation]);

  const handlePrint = () => {
    if (!printRef.current) return;
    
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const content = printRef.current.innerHTML;
    const doc = iframe.contentWindow?.document;
    
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Print Report</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page {
                size: A4 landscape;
                margin: 5mm;
              }
              body {
                margin: 0;
                padding: 0;
                background: white;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-hidden, .print\\:hidden {
                display: none !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-card {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .print-container {
                width: 287mm; /* 297mm - 10mm (5mm each side) */
                margin: 0 auto;
                padding: 5mm 0;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${content}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  setTimeout(() => {
                    window.frameElement.remove();
                  }, 100);
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
    } else {
      // Fallback
      window.print();
    }
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '';
    const date = parseIndoDate(dateStr);
    if (!date) return dateStr;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${dayName}, ${day}/${month}/${year}`;
  };

  const CashSummary: React.FC = () => (
    <div className="border-[1.5px] border-black flex-1 print-card">
      <div className="flex border-b-[1.5px] border-black">
        <div className="w-1/2 p-2 border-r-[1.5px] border-black flex items-center gap-2">
          <img 
            src="https://lh3.googleusercontent.com/d/1b-hkPOsHZ8_rW1f9aqABu7R5bw_ZJM0y" 
            alt="Logo" 
            className="w-10 h-10 object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="leading-tight">
            <div className="font-bold text-[9px]">{formatDateIndo(selectedDate)}</div>
            <div className="font-bold text-[9px] uppercase">{selectedCourier || 'RULI'}</div>
          </div>
        </div>
        <div className="w-1/2 flex flex-col">
          <div className="h-1/2 p-1 border-b-[1.5px] border-black text-center font-bold text-[8px] uppercase flex items-center justify-center">
            JUMLAH NOTA
          </div>
          <div className="h-1/2"></div>
        </div>
      </div>

      <div className="flex">
        <div className="w-1/2 border-r-[1.5px] border-black">
          {[
            'Rp100.000', 'Rp50.000', 'Rp20.000', 'Rp10.000', 
            'Rp5.000', 'Rp2.000', 'Rp1.000', 'Rp500'
          ].map((denom, idx) => (
            <div key={denom} className={`flex border-b-[1.5px] border-black ${idx === 7 ? 'border-b-0' : ''}`}>
              <div className="w-1/3 p-1 border-r-[1.5px] border-black text-[8px] font-bold text-right pr-2">{denom}</div>
              <div className="w-2/3 p-1"></div>
            </div>
          ))}
          <div className="flex border-t-[1.5px] border-black">
            <div className="w-1/3 p-1 border-r-[1.5px] border-black text-[8px] font-bold text-right pr-2 uppercase">JUMLAH</div>
            <div className="w-2/3 p-1"></div>
          </div>
        </div>
        <div className="w-1/2 flex flex-col">
          <div className="p-1 border-b-[1.5px] border-black text-center font-bold text-[8px] uppercase">
            CATATAN
          </div>
          <div className="flex-1"></div>
        </div>
      </div>
    </div>
  );

  const OrderSlip: React.FC<{ order: Order }> = ({ order }) => (
    <div className="space-y-2 border-[1px] border-black p-2 print-card">
      <div className="flex items-start gap-2">
        <img 
          src="https://lh3.googleusercontent.com/d/1b-hkPOsHZ8_rW1f9aqABu7R5bw_ZJM0y" 
          alt="Logo" 
          className="w-8 h-8 object-contain"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="text-[7px] font-bold leading-tight">
              <div>{formatDateIndo(order.tanggal)}</div>
              <div className="uppercase">{order.namaKurir}</div>
              <div className="uppercase text-[8px] mt-0.5">{order.namaLokasi}</div>
            </div>
            <div className="text-[7px] font-bold uppercase">KURIR</div>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse border-[1px] border-black">
        <thead>
          <tr className="text-[7px] font-bold bg-[#fafaf9]">
            <th className="border-[1px] border-black p-1 text-left">Varian</th>
            <th className="border-[1px] border-black p-1 text-center">Jml</th>
            <th className="border-[1px] border-black p-1 text-center">R</th>
            <th className="border-[1px] border-black p-1 text-center">S</th>
            <th className="border-[1px] border-black p-1 text-center">H</th>
            <th className="border-[1px] border-black p-1 text-center">T</th>
          </tr>
        </thead>
        <tbody className="text-[7px]">
          {[
            { label: 'Tuna Pedes', val: order.tunaPedes },
            { label: 'Tuna Mayo', val: order.tunaMayo },
            { label: 'Ayam Mayo', val: order.ayamMayo },
            { label: 'Ayam Pedes', val: order.ayamPedes },
            { label: 'Menu Bulanan', val: order.menuBulanan },
          ].map((item) => (
            <tr key={item.label}>
              <td className="border-[1px] border-black p-1 font-medium">{item.label}</td>
              <td className="border-[1px] border-black p-1 text-center font-bold">{item.val || ''}</td>
              <td className="border-[1px] border-black p-1"></td>
              <td className="border-[1px] border-black p-1"></td>
              <td className="border-[1px] border-black p-1"></td>
              <td className="border-[1px] border-black p-1"></td>
            </tr>
          ))}
          <tr className="font-bold bg-[#fafaf9]">
            <td className="border-[1px] border-black p-1">Jumlah</td>
            <td className="border-[1px] border-black p-1 text-center">{order.jumlahKirim}</td>
            <td className="border-[1px] border-black p-1"></td>
            <td className="border-[1px] border-black p-1"></td>
            <td className="border-[1px] border-black p-1"></td>
            <td className="border-[1px] border-black p-1"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const LocationSummary: React.FC<{ locationName: string; orders: Order[] }> = ({ locationName, orders }) => {
    const totals = useMemo(() => {
      return orders.reduce((acc, order) => {
        acc.tunaPedes += order.tunaPedes || 0;
        acc.tunaMayo += order.tunaMayo || 0;
        acc.ayamMayo += order.ayamMayo || 0;
        acc.ayamPedes += order.ayamPedes || 0;
        acc.menuBulanan += order.menuBulanan || 0;
        acc.total += order.jumlahKirim || 0;
        return acc;
      }, { tunaPedes: 0, tunaMayo: 0, ayamMayo: 0, ayamPedes: 0, menuBulanan: 0, total: 0 });
    }, [orders]);

    return (
      <div className="space-y-2 border-[1px] border-black p-2 bg-white print-card">
        <div className="flex items-start gap-2">
          <img 
            src="https://lh3.googleusercontent.com/d/1b-hkPOsHZ8_rW1f9aqABu7R5bw_ZJM0y" 
            alt="Logo" 
            className="w-8 h-8 object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="text-[7px] font-bold leading-tight">
                <div>{formatDateIndo(selectedDate)}</div>
                <div className="uppercase">{selectedCourier || 'SEMUA KURIR'}</div>
                <div className="uppercase text-[8px] mt-0.5">{locationName}</div>
              </div>
              <div className="text-[7px] font-bold uppercase">TOTAL</div>
            </div>
          </div>
        </div>

        <table className="w-full border-collapse border-[1px] border-black">
          <thead>
            <tr className="text-[7px] font-bold bg-[#fafaf9]">
              <th className="border-[1px] border-black p-1 text-left">Varian</th>
              <th className="border-[1px] border-black p-1 text-center">Jml</th>
              <th className="border-[1px] border-black p-1 text-center">R</th>
              <th className="border-[1px] border-black p-1 text-center">S</th>
              <th className="border-[1px] border-black p-1 text-center">H</th>
              <th className="border-[1px] border-black p-1 text-center">T</th>
            </tr>
          </thead>
          <tbody className="text-[7px]">
            {[
              { label: 'Tuna Pedes', val: totals.tunaPedes },
              { label: 'Tuna Mayo', val: totals.tunaMayo },
              { label: 'Ayam Mayo', val: totals.ayamMayo },
              { label: 'Ayam Pedes', val: totals.ayamPedes },
              { label: 'Menu Bulanan', val: totals.menuBulanan },
            ].map((item) => (
              <tr key={item.label}>
                <td className="border-[1px] border-black p-1 font-medium">{item.label}</td>
                <td className="border-[1px] border-black p-1 text-center font-bold">{item.val || ''}</td>
                <td className="border-[1px] border-black p-1"></td>
                <td className="border-[1px] border-black p-1"></td>
                <td className="border-[1px] border-black p-1"></td>
                <td className="border-[1px] border-black p-1"></td>
              </tr>
            ))}
            <tr className="font-bold bg-[#fafaf9]">
              <td className="border-[1px] border-black p-1">Jumlah</td>
              <td className="border-[1px] border-black p-1 text-center">{totals.total}</td>
              <td className="border-[1px] border-black p-1"></td>
              <td className="border-[1px] border-black p-1"></td>
              <td className="border-[1px] border-black p-1"></td>
              <td className="border-[1px] border-black p-1"></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const summariesToShow = useMemo(() => {
    const baseLocs = selectedLocation 
      ? [selectedLocation] 
      : locations;

    if (baseLocs.length === 0) {
      // If no locations at all for this courier, show 8 empty placeholders
      return Array.from({ length: 8 }).map((_, idx) => ({
        name: `LOKASI ${idx + 1}`,
        orders: []
      }));
    }

    // Fill at least 8 slots by repeating the available locations
    const displayCount = Math.max(8, baseLocs.length);
    return Array.from({ length: displayCount }).map((_, idx) => {
      const locName = baseLocs[idx % baseLocs.length];
      return {
        name: locName,
        orders: filteredOrders.filter(o => o.namaLokasi === locName)
      };
    });
  }, [selectedLocation, locations, filteredOrders]);

  return (
    <div className="space-y-8">
      {/* UI Controls - Hidden on Print */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-3xl font-black uppercase tracking-tight">Print Admin</h2>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-2xl font-black text-sm hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-stone-200"
            >
              <span className="material-symbols-outlined">print</span>
              Cetak Laporan (A4)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tanggal</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Kurir</label>
            <select
              value={selectedCourier}
              onChange={(e) => {
                setSelectedCourier(e.target.value);
                setSelectedLocation(''); // Reset location when courier changes
              }}
              className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all appearance-none"
            >
              <option value="">Pilih Kurir</option>
              {couriers.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Lokasi</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all appearance-none"
            >
              <option value="">Semua Lokasi</option>
              {locations.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        </div>

      {/* Live Preview / Print Layout */}
      <div className="bg-white text-black font-sans shadow-2xl mx-auto overflow-x-auto rounded-sm p-4 print:p-0 print:shadow-none print:overflow-visible" style={{ width: '100%', maxWidth: '297mm' }}>
        <div className="bg-white mx-auto overflow-hidden print:overflow-visible" style={{ width: '100%', minHeight: '210mm' }} ref={printRef}>
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: A4 landscape;
                margin: 0;
              }
              body {
                -webkit-print-color-adjust: exact;
                background: white !important;
                margin: 0;
                padding: 0;
              }
              .print-hidden, .print\:hidden {
                display: none !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}} />

          {/* Always render the layout structure to allow printing/PNG even if empty */}
          <div className="space-y-6 p-6">
            {/* Cash Summary Section - 2 Columns */}
            <div className="flex gap-4">
              <CashSummary />
              <CashSummary />
            </div>

            {/* Individual Slips - 4x2 Grid (8 copies) */}
            <div className="grid grid-cols-4 gap-4">
              {filteredOrders.length > 0 && (
                // If we have orders, we repeat them to fill at least 8 copies as requested
                Array.from({ length: Math.max(8, filteredOrders.length) }).map((_, idx) => {
                  const order = filteredOrders[idx % filteredOrders.length];
                  return <OrderSlip key={`${order.id}-${idx}`} order={order} />;
                })
              )}
            </div>

            {/* Location Summaries Section - 4x2 Grid */}
            <div className="grid grid-cols-4 gap-4 mt-8 border-t-[2px] border-black pt-8">
              {summariesToShow.map((summary, idx) => (
                <LocationSummary 
                  key={`${summary.name}-${idx}`} 
                  locationName={summary.name} 
                  orders={summary.orders} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintAdmin;
