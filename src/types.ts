import { LucideIcon } from 'lucide-react';

export type UserRole = 'owner' | 'admin' | 'employee';

export type ActiveTab = 
  | 'home' 
  | 'employee_database' 
  | 'store_database' 
  | 'order_database'
  | 'attendance' 
  | 'absen' 
  | 'submissions' 
  | 'inbox' 
  | 'schedule' 
  | 'minvis' 
  | 'settings' 
  | 'shift' 
  | 'live_map' 
  | 'finance' 
  | 'inventory' 
  | 'kpi' 
  | 'calendar' 
  | 'recruitment' 
  | 'mobile_history'
  | 'advertising'
  | 'sales'
  | 'report'
  | 'delivery'
  | 'client_monitor'
  | 'sales_report'
  | 'print_admin'
  | 'report_order'
  | 'daily_report'
  | 'billing_report'
  | 'piutang'
  | 'penagihan_kurir'
  | 'courier_cash'
  | 'accounting'
  | 'coa'
  | 'production';

export interface Employee {
  id: string;
  idKaryawan: string;
  nama: string;
  email: string;
  company: string;
  role: UserRole;
  jabatan: string;
  division: string;
  gender?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  alamat?: string;
  noKtp?: string;
  noHandphone?: string;
  tanggalMasuk: string;
  bank?: string;
  noRekening?: string;
  hutang: number;
  lokasiKerja?: string;
  branchLocationId?: string;
  statusKaryawan?: string;
  resigned_at?: string;
  resign_reason?: string;
  deleted_at?: string | null;
  lastLatitude?: number;
  lastLongitude?: number;
  lastLocationUpdate?: string;
  isTrackingActive?: boolean;
  photo_url?: string;
  salaryConfig?: {
    gapok: number;
    tunjanganMakan: number;
    tunjanganTransport: number;
    tunjanganKomunikasi: number;
    tunjanganKesehatan: number;
    tunjanganJabatan: number;
    bpjstk: number;
    pph21: number;
    lembur: number;
    bonus: number;
    thr: number;
    potonganHutang: number;
    potonganLain: number;
  };
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  company: string;
  date: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Cuti' | 'Alpa' | 'Lembur' | 'Libur';
  clockIn?: string;
  clockOut?: string;
  photoIn?: string;
  photoOut?: string;
  notes?: string;
  submittedAt: string;
}

export interface WorkSchedule {
  id: string;
  employeeId: string;
  company: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface LiveSchedule {
  id: string;
  employeeId: string;
  company: string;
  date: string;
  startTime: string;
  endTime: string;
  platform: string;
  account: string;
  hostName: string;
}

export type SubmissionType = 'Izin' | 'Sakit' | 'Cuti' | 'Lembur' | 'Overtime' | 'Leave' | 'Reimbursement' | 'Notification';

export interface Submission {
  id: string;
  employeeId: string;
  company: string;
  type: SubmissionType;
  startDate?: string;
  endDate?: string;
  reason?: string;
  notes?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  company: string;
  targetEmployeeIds: string[];
  sentAt: string;
  type?: 'info' | 'announcement';
}

export interface LiveReport {
  id: string;
  scheduleId: string;
  employeeId: string;
  company: string;
  tanggal: string;
  omzet: number;
  pesanan: number;
  viewers: number;
  notes?: string;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  company: string;
  date: string;
  shiftId: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  company: string;
}

export interface AdvertisingRecord {
  id: string;
  company: string;
  date: string;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface Store {
  id: string;
  namaToko: string;
  grade: string;
  namaPIC: string;
  nomorPIC?: string;
  alamat?: string;
  linkGmaps: string;
  kategori: string;
  harga: string;
  pembayaran: string;
  operasional: string;
  kurir?: string;
  note: string;
  company: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  tanggal: string;
  namaKurir: string;
  employeeId?: string;
  namaLokasi: string;
  tunaPedes: number;
  tunaMayo: number;
  ayamMayo: number;
  ayamPedes: number;
  menuBulanan: number;
  jumlahKirim: number;
  hargaSikepal: number;
  periodeBayar: string;
  sisa: number;
  jumlahPiutang: number;
  jumlahUang: number;
  pembayaran: string;
  tanggalBayar: string;
  nilaiPembayaran?: number;
  waste?: number;
  diskon: number;
  company: string;
  updatedAt: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
}

export interface DeliveryRecord {
  id: string;
  namaKurir: string;
  tanggal: string;
  namaLokasi: string;
  fotoBukti?: string;
  lokasiBukti?: string;
  jamBukti?: string;
  qtyPengiriman: number;
  sisa?: number;
  hargaSikepal?: number;
  keterangan?: string;
  company: string;
  status: 'Pending' | 'Active' | 'Completed';
  createdAt: string;
  orderId?: string;
  metodePembayaran?: string;
  buktiTransfer?: string;
  buktiSisa?: string;
  waste?: number;
  tanggalPiutang?: string;
}

export interface BillingRecord {
  id: string;
  namaKurir: string;
  tanggal: string;
  namaLokasi: string;
  fotoBukti?: string;
  lokasiBukti?: string;
  jamBukti?: string;
  qtyPengiriman: number;
  sisa?: number;
  hargaSikepal?: number;
  keterangan?: string;
  company: string;
  status: 'Pending' | 'Active' | 'Completed';
  createdAt: string;
  orderId?: string;
  metodePembayaran?: string;
  buktiTransfer?: string;
  buktiSisa?: string;
  waste?: number;
  tanggalPiutang?: string;
}

export interface CourierCashRecord {
  id: string;
  tanggal: string;
  namaKurir: string;
  tipe: 'Masuk' | 'Keluar';
  jumlah: number;
  keterangan: string;
  company: string;
  createdAt: string;
}

export interface COAAccount {
  id: string;
  code: string;
  name: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  type: 'Header' | 'Detail';
  parentId?: string;
  company: string;
  createdAt: string;
}

export interface JournalEntry {
  accountId: string;
  debit: number;
  credit: number;
}

export interface AccountingJournal {
  id: string;
  date: string;
  description: string;
  reference: string;
  entries: JournalEntry[];
  company: string;
  createdAt: string;
}

export interface Division {
  id: string;
  name: string;
  company: string;
}

export interface Position {
  id: string;
  name: string;
  company: string;
}

export interface BranchLocation {
  id: string;
  kodeCabang: string;
  namaCabang: string;
  alamatCabang: string;
  teleponCabang: string;
  radius: number;
  latitude: number;
  longitude: number;
  company: string;
}
