-- Create billing_reports table
create table if not exists public.billing_reports (
    id text primary key,
    "namaKurir" text not null,
    tanggal text not null,
    "namaLokasi" text not null,
    "fotoBukti" text,
    "lokasiBukti" text,
    "jamBukti" text,
    "qtyPengiriman" numeric default 0,
    "metodePembayaran" text,
    "buktiTransfer" text,
    "buktiSisa" text,
    waste numeric default 0,
    "tanggalPiutang" text,
    keterangan text,
    company text,
    status text default 'Pending',
    "orderId" text,
    "createdAt" timestamp with time zone default now()
);

-- Create indexes for performance
create index if not exists billing_reports_company_idx on public.billing_reports (company);
create index if not exists billing_reports_createdAt_idx on public.billing_reports ("createdAt" desc);
create index if not exists billing_reports_tanggal_idx on public.billing_reports (tanggal desc);

-- Enable RLS
alter table public.billing_reports enable row level security;

-- Drop policy if exists and create new one
drop policy if exists "Allow all access to billing_reports" on public.billing_reports;
create policy "Allow all access to billing_reports"
on public.billing_reports
for all
using (true)
with check (true);
