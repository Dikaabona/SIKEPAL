-- Create deliveries table
create table if not exists public.deliveries (
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
    "createdAt" timestamp with time zone default now()
);

-- Enable RLS
alter table public.deliveries enable row level security;

-- Create policy to allow all access for now
create policy "Allow all access to deliveries"
on public.deliveries
for all
using (true)
with check (true);
