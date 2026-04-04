-- SQL Script to automatically create an employee record when a new user signs up
-- Run this in the Supabase SQL Editor

-- 1. Create a function that inserts a new row into public.employees
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.employees (
    id, 
    "idKaryawan", 
    nama, 
    email, 
    company, 
    role, 
    jabatan, 
    division, 
    "tanggalMasuk", 
    hutang
  )
  VALUES (
    new.id, 
    'EMP' || floor(random() * 9000 + 1000)::text, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Employee'), 
    new.email, 
    'Sikepal', 
    'employee', 
    'Staff', 
    'General', 
    CURRENT_DATE::text, 
    0
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error if needed, but don't block auth.users insert if possible
    -- However, for this app, we want the employee record to be created
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger that calls the function after a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
