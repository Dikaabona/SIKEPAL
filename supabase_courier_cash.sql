-- Create courier_cash_records table
create table if not exists public.courier_cash_records (
    id text primary key,
    tanggal text not null,
    nama_kurir text not null,
    tipe text check (tipe in ('Masuk', 'Keluar')),
    jumlah numeric not null default 0,
    keterangan text,
    jurnal text,
    debit_account text,
    credit_account text,
    bukti_url text,
    status text check (status in ('Pending', 'Approved', 'Rejected')) default 'Pending',
    company text,
    created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.courier_cash_records enable row level security;

-- Policy
drop policy if exists "Allow all access to courier_cash_records" on public.courier_cash_records;
create policy "Allow all access to courier_cash_records"
on public.courier_cash_records
for all
using (true)
with check (true);
