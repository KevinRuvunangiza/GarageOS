-- ============================================================
-- GarageOS: Garages Table RLS Policies
-- Run this in Supabase SQL Editor to allow authenticated users
-- to SELECT and INSERT their own garage row.
-- This is required for the auto-create / onboarding fallback.
-- ============================================================

-- Enable RLS on garages (safe if already enabled)
ALTER TABLE public.garages ENABLE ROW LEVEL SECURITY;

-- SELECT: each user can read only their own row
DROP POLICY IF EXISTS "Garage owners can view own garage" ON public.garages;
CREATE POLICY "Garage owners can view own garage"
  ON public.garages
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: authenticated users can create their own garage row
-- (id must match auth.uid() to prevent impersonation)
DROP POLICY IF EXISTS "Garage owners can insert own garage" ON public.garages;
CREATE POLICY "Garage owners can insert own garage"
  ON public.garages
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: users can update only their own row
DROP POLICY IF EXISTS "Garage owners can update own garage" ON public.garages;
CREATE POLICY "Garage owners can update own garage"
  ON public.garages
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: users can delete only their own row
-- (actual cascade deletion goes through the delete_garage_account() function)
DROP POLICY IF EXISTS "Garage owners can delete own garage" ON public.garages;
CREATE POLICY "Garage owners can delete own garage"
  ON public.garages
  FOR DELETE
  USING (auth.uid() = id);
