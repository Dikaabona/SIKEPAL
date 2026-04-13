-- SQL Script to create or update stores table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.stores (
    id TEXT PRIMARY KEY,
    "namaToko" TEXT NOT NULL,
    grade TEXT,
    "namaPIC" TEXT,
    "nomorPIC" TEXT,
    alamat TEXT,
    "linkGmaps" TEXT,
    kategori TEXT,
    harga TEXT,
    pembayaran TEXT,
    operasional TEXT,
    kurir TEXT,
    note TEXT,
    company TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- If the table already exists, ensure the 'alamat' and 'kurir' columns are present
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='alamat') THEN
        ALTER TABLE public.stores ADD COLUMN alamat TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='kurir') THEN
        ALTER TABLE public.stores ADD COLUMN kurir TEXT;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow all access to stores" ON public.stores;
CREATE POLICY "Allow all access to stores"
ON public.stores
FOR ALL
USING (true)
WITH CHECK (true);
