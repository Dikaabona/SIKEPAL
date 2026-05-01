-- Create orders table
create table if not exists public.orders (
    id text primary key,
    tanggal text,
    "namaKurir" text,
    "namaLokasi" text,
    "tunaPedes" numeric default 0,
    "tunaMayo" numeric default 0,
    "ayamMayo" numeric default 0,
    "ayamPedes" numeric default 0,
    "menuBulanan" numeric default 0,
    "jumlahKirim" numeric default 0,
    "hargaSikepal" numeric default 0,
    "periodeBayar" text,
    sisa numeric default 0,
    "jumlahPiutang" numeric default 0,
    "jumlahUang" numeric default 0,
    pembayaran text,
    "tanggalBayar" text,
    diskon numeric default 0,
    company text,
    "updatedAt" timestamp with time zone default now()
);

-- Create indexes for performance
create index if not exists orders_company_idx on public.orders (company);
create index if not exists orders_tanggal_idx on public.orders (tanggal desc);
create index if not exists orders_pembayaran_idx on public.orders (pembayaran);

-- Enable RLS
alter table public.orders enable row level security;

-- Create policy to allow all access for now (or adjust as needed)
create policy "Allow all access to orders"
on public.orders
for all
using (true)
with check (true);
