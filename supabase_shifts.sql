-- SQL Script to create shifts and shift_assignments tables
-- Run this in the Supabase SQL Editor

-- Shifts Table
CREATE TABLE IF NOT EXISTS public.shifts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    color TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Shift Assignments Table
CREATE TABLE IF NOT EXISTS public.shift_assignments (
    id TEXT PRIMARY KEY,
    "employeeId" UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    date TEXT NOT NULL,
    "shiftId" TEXT REFERENCES public.shifts(id) ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access to shifts" ON public.shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to shift_assignments" ON public.shift_assignments FOR ALL USING (true) WITH CHECK (true);
