-- ============================================================
-- GarageOS: Signup Trigger + CASCADE Deletion Migration
-- Run this in Supabase SQL Editor (requires SUPERUSER / service role)
-- ============================================================

-- ===========================================================
-- PART 1: Database Trigger — Auto-create garage on signup
-- ===========================================================

-- This function fires on INSERT into auth.users.
-- It reads garage metadata from raw_user_meta_data and
-- creates a corresponding row in public.garages atomically.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
BEGIN
  -- Safely coalesce metadata to empty object to prevent null reference errors
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  INSERT INTO public.garages (
    id,
    garage_name,
    garage_address,
    personal_phone,
    garage_phone,
    subscription_status
  ) VALUES (
    NEW.id,
    COALESCE(meta->>'garage_name',    'My Garage'),
    COALESCE(meta->>'garage_address', ''),
    COALESCE(meta->>'personal_phone', ''),
    COALESCE(meta->>'garage_phone',   ''),
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If something fails (e.g. constraints), log it but DO NOT crash auth.users insert
    RAISE LOG 'Garage insert failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Attach the trigger to auth.users (drop first to make idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ===========================================================
-- PART 2: CASCADE Deletion — POPIA compliance
-- ===========================================================
-- Drop and recreate each FK with ON DELETE CASCADE so that
-- deleting a row in auth.users or garages cascades cleanly.

-- ── garages (parent: auth.users) ──────────────────────────
ALTER TABLE public.garages
  DROP CONSTRAINT IF EXISTS garages_id_fkey;

ALTER TABLE public.garages
  ADD CONSTRAINT garages_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- ── clients (parent: garages) ─────────────────────────────
ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_garage_id_fkey;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_garage_id_fkey
  FOREIGN KEY (garage_id)
  REFERENCES public.garages(id)
  ON DELETE CASCADE;

-- ── vehicles (parents: garages + clients) ─────────────────
ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_garage_id_fkey;

ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_garage_id_fkey
  FOREIGN KEY (garage_id)
  REFERENCES public.garages(id)
  ON DELETE CASCADE;

ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_client_id_fkey;

ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES public.clients(id)
  ON DELETE CASCADE;

-- ── jobs (parents: garages + vehicles) ────────────────────
ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_garage_id_fkey;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_garage_id_fkey
  FOREIGN KEY (garage_id)
  REFERENCES public.garages(id)
  ON DELETE CASCADE;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_vehicle_id_fkey;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_vehicle_id_fkey
  FOREIGN KEY (vehicle_id)
  REFERENCES public.vehicles(id)
  ON DELETE CASCADE;

-- ── job_items (parents: garages + jobs) ───────────────────
ALTER TABLE public.job_items
  DROP CONSTRAINT IF EXISTS job_items_garage_id_fkey;

ALTER TABLE public.job_items
  ADD CONSTRAINT job_items_garage_id_fkey
  FOREIGN KEY (garage_id)
  REFERENCES public.garages(id)
  ON DELETE CASCADE;

ALTER TABLE public.job_items
  DROP CONSTRAINT IF EXISTS job_items_job_id_fkey;

ALTER TABLE public.job_items
  ADD CONSTRAINT job_items_job_id_fkey
  FOREIGN KEY (job_id)
  REFERENCES public.jobs(id)
  ON DELETE CASCADE;

-- ── preset_services (parent: garages) ─────────────────────
ALTER TABLE public.preset_services
  DROP CONSTRAINT IF EXISTS preset_services_garage_id_fkey;

ALTER TABLE public.preset_services
  ADD CONSTRAINT preset_services_garage_id_fkey
  FOREIGN KEY (garage_id)
  REFERENCES public.garages(id)
  ON DELETE CASCADE;

