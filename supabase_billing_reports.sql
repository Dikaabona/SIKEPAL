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
    keterangan text,
    company text,
    status text check (status in ('Pending', 'Active', 'Completed')),
    "createdAt" timestamp with time zone default now(),
    "orderId" text references public.orders(id)
);

-- Enable RLS
alter table public.billing_reports enable row level security;

-- Drop policy if exists and create new one
drop policy if exists "Allow all access to billing_reports" on public.billing_reports;
create policy "Allow all access to billing_reports"
on public.billing_reports
for all
using (true)
with check (true);
