import React, { useState, useRef, useEffect } from 'react';
import { Employee, AttendanceRecord, UserRole, Shift } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

interface AttendanceModuleProps {
  employees: Employee[];
  records: AttendanceRecord[];
  onSaveRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userRole: UserRole;
  currentEmployee: Employee | null;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  weeklyHolidays: any;
  company: string;
  positionRates: any;
  shifts: Shift[];
  shiftAssignments: any[];
  initialSelfieMode?: boolean;
  onClose?: () => void;
  onFinish?: () => void;
}

const AttendanceModule: React.FC<AttendanceModuleProps> = ({ 
  employees, 
  records, 
  onSaveRecord, 
  onDeleteRecord, 
  searchQuery, 
  setSearchQuery, 
  currentEmployee, 
  company, 
  initialSelfieMode, 
  onClose, 
  onFinish,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isSelfieActive, setIsSelfieActive] = useState(initialSelfieMode || false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationStatus, setLocationStatus] = useState<{ status: string, distance: string }>({ status: 'DI AREA KANTOR', distance: '10M' });
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isSelfieActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isSelfieActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Mirror the image for the capture as well
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoData = canvas.toDataURL('image/jpeg');
        handleAttendance(photoData);
      }
    }
  };

  const handleAttendance = (photo: string) => {
    if (!currentEmployee) return;

    const today = new Date().toISOString().split('T')[0];
    const existingRecord = records.find(r => r.employeeId === currentEmployee.id && r.date === today);

    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (existingRecord) {
      // Clock out
      onSaveRecord({
        ...existingRecord,
        clockOut: timeString,
        photoOut: photo,
        status: 'Hadir'
      });
    } else {
      // Clock in
      onSaveRecord({
        id: Math.random().toString(36).substr(2, 9),
        employeeId: currentEmployee.id,
        company: company,
        date: today,
        clockIn: timeString,
        photoIn: photo,
        status: 'Hadir',
        submittedAt: new Date().toISOString()
      });
    }
    setIsSelfieActive(false);
    if (onFinish) onFinish();
  };

  const filteredEmployees = employees.filter(emp => 
    emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.jabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.division.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayStr = new Date().toISOString().split('T')[0];

  if (isSelfieActive && currentEmployee) {
    const today = new Date();
    const dayName = today.toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase();
    const dateStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }).toUpperCase();
    const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const existingRecord = records.find(r => r.employeeId === currentEmployee.id && r.date === todayStr);
    const actionLabel = existingRecord ? 'PULANG' : 'MASUK';

    return (
      <div className="fixed inset-0 z-[200] bg-white overflow-hidden font-sans flex flex-col items-center">
        {/* Decorative Background Element */}
        <div className="absolute top-0 left-0 w-full h-48 bg-yellow-400 rounded-b-[2.5rem] -z-10 shadow-lg" />
        
        <div className="w-full max-w-md flex flex-col h-full py-4 px-6 relative">
          {/* Header */}
          <div className="flex justify-between items-center">
            <button 
              onClick={() => onClose ? onClose() : setIsSelfieActive(false)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-yellow-200 rounded-xl text-[9px] font-black text-yellow-700 uppercase tracking-widest hover:bg-white transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">home</span>
              TUTUP
            </button>
            <div className="w-20 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-yellow-100">
              <img 
                src="https://lh3.googleusercontent.com/d/1b-hkPOsHZ8_rW1f9aqABu7R5bw_ZJM0y" 
                alt="Sikepal Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* User Info Card */}
          <div className="mt-4 bg-white rounded-[2rem] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-stone-50 text-center space-y-2 relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-900 rounded-full shadow-lg">
                <div className={`w-1.5 h-1.5 rounded-full ${existingRecord ? 'bg-orange-400' : 'bg-green-400'} animate-pulse`} />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">
                  {existingRecord ? 'Absen Pulang' : 'Absen Masuk'}
                </span>
              </div>
            </div>
            
            <div className="pt-1">
              <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight leading-tight">{currentEmployee.nama}</h2>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{currentEmployee.jabatan} • {currentEmployee.division}</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 border border-yellow-100 rounded-xl">
                <span className="material-symbols-outlined text-xs text-yellow-600 animate-bounce">location_on</span>
                <span className="text-[9px] font-black text-yellow-700 uppercase tracking-wider">
                  {locationStatus.status} ({locationStatus.distance})
                </span>
              </div>
            </div>
          </div>

          {/* Camera Preview */}
          <div className="mt-4 flex justify-center relative">
            <div className="w-52 h-52 rounded-[2.5rem] border-6 border-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden relative bg-stone-100 group">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Camera Overlay */}
              <div className="absolute inset-0 border-[1.5px] border-white/30 rounded-[2rem] pointer-events-none m-3" />
              <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-yellow-400 rounded-tl-md" />
              <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-yellow-400 rounded-tr-md" />
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-yellow-400 rounded-bl-md" />
              <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-yellow-400 rounded-br-md" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -z-10 top-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-100/50 rounded-full blur-3xl" />
          </div>

          {/* Time & Date */}
          <div className="mt-4 text-center space-y-0.5">
            <div className="inline-block relative">
              <h3 className="text-5xl font-black text-stone-900 tracking-tighter tabular-nums">{timeStr}</h3>
              <div className="absolute -right-3 -top-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
            </div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em]">{dayName}, {dateStr}</p>
          </div>

          {/* Action Button Section */}
          <div className="mt-auto mb-4 flex flex-col items-center gap-4">
            {existingRecord && (
              <div className="flex items-center gap-2.5 bg-stone-50 px-4 py-1.5 rounded-xl border border-stone-100 shadow-sm">
                <div className="text-left">
                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Waktu Masuk</p>
                  <p className="text-xs font-black text-stone-900 tracking-tight">{existingRecord.clockIn}</p>
                </div>
                <div className="w-[1px] h-5 bg-stone-200" />
                <span className="material-symbols-outlined text-orange-500 text-base">login</span>
              </div>
            )}
            
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center">
                <div className={`px-6 py-2.5 rounded-2xl ${existingRecord ? 'bg-orange-500 shadow-orange-200' : 'bg-green-500 shadow-green-200'} text-white shadow-lg transform -rotate-1`}>
                  <span className="text-sm font-black uppercase tracking-[0.15em]">{actionLabel}</span>
                </div>
              </div>

              <button 
                onClick={capturePhoto}
                className="w-20 h-20 bg-yellow-400 rounded-[2rem] flex items-center justify-center text-stone-900 shadow-[0_12px_30px_rgba(250,204,21,0.35)] hover:scale-105 active:scale-95 transition-all group relative border-4 border-white"
              >
                <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">photo_camera</span>
                <div className="absolute -bottom-1.5 bg-stone-900 text-white text-[7px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-md">
                  AMBIL FOTO
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const handleDownloadTemplate = () => {
    const headers = [
      ['Employee ID', 'Date (YYYY-MM-DD)', 'Clock In (HH:mm)', 'Clock Out (HH:mm)', 'Status', 'Notes']
    ];
    const sampleData = [
      ['1', new Date().toISOString().split('T')[0], '08:00', '17:00', 'Hadir', 'Sample note']
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Template');
    XLSX.writeFile(wb, 'attendance_template.xlsx');
  };

  const handleExport = () => {
    const exportData = filteredRecords.map(record => {
      const emp = employees.find(e => e.id === record.employeeId);
      return {
        'Date': record.date,
        'Employee Name': emp?.nama || 'Unknown',
        'Jabatan': emp?.jabatan || '',
        'Division': emp?.division || '',
        'Clock In': record.clockIn || '',
        'Clock Out': record.clockOut || '',
        'Status': record.status,
        'Notes': record.notes || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance History');
    XLSX.writeFile(wb, `attendance_export_${startDate}_to_${endDate}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      data.forEach(row => {
        const empId = String(row['Employee ID'] || '');
        const date = String(row['Date (YYYY-MM-DD)'] || '');
        const clockIn = String(row['Clock In (HH:mm)'] || '');
        const clockOut = String(row['Clock Out (HH:mm)'] || '');
        const status = String(row['Status'] || 'Hadir') as any;
        const notes = String(row['Notes'] || '');

        if (empId && date) {
          onSaveRecord({
            id: Math.random().toString(36).substr(2, 9),
            employeeId: empId,
            company: company,
            date: date,
            clockIn: clockIn,
            clockOut: clockOut,
            status: status,
            notes: notes,
            submittedAt: new Date().toISOString()
          });
        }
      });
      alert('Import berhasil!');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const filteredRecords = records.filter(r => {
    const dateMatch = r.date >= startDate && r.date <= endDate;
    const employee = employees.find(e => e.id === r.employeeId);
    const searchMatch = !searchQuery || (employee && (
      employee.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.jabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.division.toLowerCase().includes(searchQuery.toLowerCase())
    ));
    return dateMatch && searchMatch;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-surface-container-highest/30 p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-1.5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">From</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-1.5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">To</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium cursor-pointer"
            />
          </div>
          
          <div className="h-8 w-[1px] bg-stone-200 mx-1 hidden md:block" />
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all"
            >
              <span className="material-symbols-outlined text-sm">description</span>
              Template
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all"
            >
              <span className="material-symbols-outlined text-sm">upload</span>
              Import
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx, .xls"
              onChange={handleImport}
            />
            <button 
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Ekspor
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
           <div className="flex-1 lg:flex-none flex items-center bg-white rounded-lg px-3 py-1.5 gap-2 border border-outline-variant/20 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <span className="material-symbols-outlined text-stone-400 text-sm">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm w-full lg:w-48 font-body" 
              placeholder="Search staff..." 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden border border-stone-100 shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest font-label">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest font-label">Employee</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest font-label">Department</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest font-label">Clock In</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest font-label">Clock Out</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest font-label text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest font-label text-center">Selfie</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => {
                  const emp = employees.find(e => e.id === record.employeeId);
                  if (!emp) return null;
                  
                  return (
                    <tr key={record.id} className="hover:bg-stone-50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-stone-900">{new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-stone-200 overflow-hidden border border-stone-100">
                            <img
                              alt={emp.nama}
                              src={`https://picsum.photos/seed/${emp.nama}/100/100`}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <p className="font-black text-sm text-stone-900">{emp.nama}</p>
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{emp.jabatan}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                          emp.division === 'Kitchen' ? 'bg-orange-50 text-orange-700' :
                          emp.division === 'Logistics' ? 'bg-blue-50 text-blue-700' :
                          'bg-stone-100 text-stone-500'
                        }`}>
                          {emp.division}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-orange-600">login</span>
                          <span className="text-sm font-black text-stone-700">{record.clockIn || '--:--'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-stone-400">logout</span>
                          <span className="text-sm font-black text-stone-400">{record.clockOut || '--:--'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            record.status === 'Hadir' ? 'bg-green-50 text-green-700' :
                            record.status === 'Alpa' ? 'bg-red-50 text-red-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {record.photoIn ? (
                            <button 
                              onClick={() => setSelectedPhoto(record.photoIn!)}
                              className="w-10 h-10 rounded-xl overflow-hidden border-2 border-orange-100 hover:border-orange-400 transition-all shadow-sm"
                              title="View Clock In Photo"
                            >
                              <img src={record.photoIn} alt="In" className="w-full h-full object-cover scale-x-[-1]" />
                            </button>
                          ) : null}
                          {record.photoOut ? (
                            <button 
                              onClick={() => setSelectedPhoto(record.photoOut!)}
                              className="w-10 h-10 rounded-xl overflow-hidden border-2 border-amber-100 hover:border-amber-400 transition-all shadow-sm"
                              title="View Clock Out Photo"
                            >
                              <img src={record.photoOut} alt="Out" className="w-full h-full object-cover scale-x-[-1]" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => onDeleteRecord(record.id)}
                          className="text-stone-300 hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-stone-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">event_busy</span>
                    <p className="text-sm font-bold uppercase tracking-widest">No records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-stone-100">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => {
              const emp = employees.find(e => e.id === record.employeeId);
              if (!emp) return null;

              return (
                <div key={record.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-stone-100 overflow-hidden border border-stone-200">
                        <img
                          alt={emp.nama}
                          src={`https://picsum.photos/seed/${emp.nama}/100/100`}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="font-black text-sm text-stone-900">{emp.nama}</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      record.status === 'Hadir' ? 'bg-green-50 text-green-700' :
                      record.status === 'Alpa' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {record.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-stone-50 p-3 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-sm text-orange-600">login</span>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">In</p>
                        <p className="text-xs font-black text-stone-700">{record.clockIn || '--:--'}</p>
                      </div>
                    </div>
                    <div className="bg-stone-50 p-3 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-sm text-stone-400">logout</span>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Out</p>
                        <p className="text-xs font-black text-stone-400">{record.clockOut || '--:--'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {record.photoIn && (
                        <button onClick={() => setSelectedPhoto(record.photoIn!)} className="w-8 h-8 rounded-lg overflow-hidden border border-orange-100 shadow-sm">
                          <img src={record.photoIn} className="w-full h-full object-cover scale-x-[-1]" />
                        </button>
                      )}
                      {record.photoOut && (
                        <button onClick={() => setSelectedPhoto(record.photoOut!)} className="w-8 h-8 rounded-lg overflow-hidden border border-amber-100 shadow-sm">
                          <img src={record.photoOut} className="w-full h-full object-cover scale-x-[-1]" />
                        </button>
                      )}
                    </div>
                    <button onClick={() => onDeleteRecord(record.id)} className="p-2 text-stone-300 hover:text-red-500">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-stone-400">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-20">event_busy</span>
              <p className="text-xs font-black uppercase tracking-widest">No records found</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Preview Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-lg w-full aspect-square rounded-3xl overflow-hidden border-8 border-white/10 shadow-2xl"
            >
              <img src={selectedPhoto} alt="Attendance Selfie" className="w-full h-full object-cover scale-x-[-1]" />
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors backdrop-blur-sm"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceModule;
