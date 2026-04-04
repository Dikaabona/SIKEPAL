-- SQL Script to create employees table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "idKaryawan" TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    company TEXT DEFAULT 'Sikepal',
    role TEXT DEFAULT 'employee',
    jabatan TEXT DEFAULT 'Staff',
    division TEXT DEFAULT 'General',
    gender TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" TEXT,
    alamat TEXT,
    "noKtp" TEXT,
    "noHandphone" TEXT,
    "tanggalMasuk" TEXT,
    bank TEXT,
    "noRekening" TEXT,
    hutang NUMERIC DEFAULT 0,
    "lokasiKerja" TEXT,
    "branchLocationId" TEXT,
    "statusKaryawan" TEXT,
    photo_url TEXT,
    "isTrackingActive" BOOLEAN DEFAULT false,
    "lastLatitude" DOUBLE PRECISION,
    "lastLongitude" DOUBLE PRECISION,
    "lastLocationUpdate" TIMESTAMP WITH TIME ZONE,
    "salaryConfig" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access to employees"
ON public.employees
FOR ALL
USING (true)
WITH CHECK (true);
