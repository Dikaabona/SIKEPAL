import React, { useState, useMemo, useRef } from 'react';
import { Order } from '../types';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';

interface PrintAdminProps {
  company: string;
  orders: Order[];
}

const PrintAdmin: React.FC<PrintAdminProps> = ({ orders }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const couriers = useMemo(() => {
    const uniqueCouriers = Array.from(new Set(orders.map(o => o.namaKurir))).filter(Boolean);
    return uniqueCouriers.sort();
  }, [orders]);

  const locations = useMemo(() => {
    const uniqueLocations = Array.from(new Set(
      orders
        .filter(o => o.namaKurir === selectedCourier || selectedCourier === '')
        .map(o => o.namaLokasi)
    )).filter(Boolean);
    return uniqueLocations.sort();
  }, [orders, selectedCourier]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.tanggal === selectedDate && 
      (selectedCourier === '' || o.namaKurir === selectedCourier) &&
      (selectedLocation === '' || o.namaLokasi === selectedLocation)
    );
  }, [orders, selectedDate, selectedCourier, selectedLocation]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNG = async () => {
    if (printRef.current) {
      setIsCapturing(true);
      // Small delay to ensure state update renders the hidden div if needed
      // Actually we'll use a clone or just toggle visibility
      setTimeout(async () => {
        const element = printRef.current!;
        const originalStyle = element.style.display;
        const originalClassName = element.className;
        
        // Force visibility for capture
        element.style.display = 'block';
        element.style.position = 'relative';
        element.style.left = '0';
        element.className = 'bg-white text-black font-sans p-4 w-[210mm]'; // A4 width

        try {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1200
          });
          
          const link = document.createElement('a');
          link.download = `Laporan_Print_Admin_${selectedDate}_${selectedCourier || 'Semua'}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        } catch (error) {
          console.error('PNG Capture error:', error);
          alert('Gagal mengunduh PNG. Silakan coba lagi.');
        } finally {
          element.style.display = originalStyle;
          element.style.position = '';
          element.style.left = '';
          element.className = originalClassName;
          setIsCapturing(false);
        }
      }, 100);
    }
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
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
    <div className="border-[1.5px] border-black flex-1">
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
    <div className="space-y-2">
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
            <div className="text-[8px] font-bold uppercase">KURIR</div>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse border-[1px] border-black">
        <thead>
          <tr className="text-[7px] font-bold">
            <th className="border-[1px] border-black p-0.5 text-left">Varian</th>
            <th className="border-[1px] border-black p-0.5 text-center">Jumlah</th>
            <th className="border-[1px] border-black p-0.5 text-center">Real</th>
            <th className="border-[1px] border-black p-0.5 text-center">Sisa</th>
            <th className="border-[1px] border-black p-0.5 text-center">Harga</th>
            <th className="border-[1px] border-black p-0.5 text-center">Total</th>
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
              <td className="border-[1px] border-black p-0.5 font-medium">{item.label}</td>
              <td className="border-[1px] border-black p-0.5 text-center font-bold">{item.val || ''}</td>
              <td className="border-[1px] border-black p-0.5"></td>
              <td className="border-[1px] border-black p-0.5"></td>
              <td className="border-[1px] border-black p-0.5"></td>
              <td className="border-[1px] border-black p-0.5"></td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="border-[1px] border-black p-0.5">Jumlah</td>
            <td className="border-[1px] border-black p-0.5 text-center">{order.jumlahKirim}</td>
            <td className="border-[1px] border-black p-0.5"></td>
            <td className="border-[1px] border-black p-0.5"></td>
            <td className="border-[1px] border-black p-0.5"></td>
            <td className="border-[1px] border-black p-0.5"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const TotalSummary: React.FC = () => {
    const totals = useMemo(() => {
      return filteredOrders.reduce((acc, order) => {
        acc.tunaPedes += order.tunaPedes || 0;
        acc.tunaMayo += order.tunaMayo || 0;
        acc.ayamMayo += order.ayamMayo || 0;
        acc.ayamPedes += order.ayamPedes || 0;
        acc.menuBulanan += order.menuBulanan || 0;
        acc.total += order.jumlahKirim || 0;
        return acc;
      }, { tunaPedes: 0, tunaMayo: 0, ayamMayo: 0, ayamPedes: 0, menuBulanan: 0, total: 0 });
    }, [filteredOrders]);

    return (
      <div className="space-y-2 mt-4 border-t-[1.5px] border-black pt-6">
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
                <div className="uppercase text-[8px] mt-0.5">{selectedLocation || 'SEMUA LOKASI'}</div>
              </div>
              <div className="text-[8px] font-bold uppercase">TOTAL</div>
            </div>
          </div>
        </div>

        <table className="w-full border-collapse border-[1px] border-black">
          <thead>
            <tr className="text-[7px] font-bold">
              <th className="border-[1px] border-black p-0.5 text-left">Varian</th>
              <th className="border-[1px] border-black p-0.5 text-center">Jumlah</th>
              <th className="border-[1px] border-black p-0.5 text-center">Real</th>
              <th className="border-[1px] border-black p-0.5 text-center">Sisa</th>
              <th className="border-[1px] border-black p-0.5 text-center">Harga</th>
              <th className="border-[1px] border-black p-0.5 text-center">Total</th>
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
                <td className="border-[1px] border-black p-0.5 font-medium">{item.label}</td>
                <td className="border-[1px] border-black p-0.5 text-center font-bold">{item.val || ''}</td>
                <td className="border-[1px] border-black p-0.5"></td>
                <td className="border-[1px] border-black p-0.5"></td>
                <td className="border-[1px] border-black p-0.5"></td>
                <td className="border-[1px] border-black p-0.5"></td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="border-[1px] border-black p-0.5">Jumlah</td>
              <td className="border-[1px] border-black p-0.5 text-center">{totals.total}</td>
              <td className="border-[1px] border-black p-0.5"></td>
              <td className="border-[1px] border-black p-0.5"></td>
              <td className="border-[1px] border-black p-0.5"></td>
              <td className="border-[1px] border-black p-0.5"></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* UI Controls - Hidden on Print */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-3xl font-black uppercase tracking-tight">Print Admin</h2>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPNG}
              disabled={isCapturing}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-stone-900 border border-stone-200 rounded-2xl font-black text-sm hover:bg-stone-50 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
            >
              <span className="material-symbols-outlined">image</span>
              {isCapturing ? 'Processing...' : 'Download PNG'}
            </button>
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
      <div className="bg-white text-black font-sans shadow-2xl mx-auto overflow-x-auto rounded-sm p-4" style={{ width: '100%', maxWidth: '210mm' }}>
        <div className="bg-white mx-auto overflow-hidden" style={{ width: '210mm', minHeight: '297mm' }} ref={printRef}>
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: A4;
                margin: 5mm;
              }
              body {
                -webkit-print-color-adjust: exact;
                background: white !important;
              }
              .print-hidden {
                display: none !important;
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

            {/* Individual Slips Grid - 4 Columns */}
            <div className="grid grid-cols-4 gap-x-4 gap-y-6">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <OrderSlip key={order.id} order={order} />
                ))
              ) : null}
            </div>

            {/* Total Summary Section */}
            <TotalSummary />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintAdmin;
