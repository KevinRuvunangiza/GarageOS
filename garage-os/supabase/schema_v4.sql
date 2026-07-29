-- ============================================
-- GarageOS v4 — Complete Schema Update & Migrations
-- Paste this into Supabase SQL Editor
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Update CLIENTS Table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- 2. Update VEHICLES Table
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS vin TEXT DEFAULT '';

-- 3. Update JOBS Table
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS odometer_km INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parts_cost_total NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labor_cost_total NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grand_total NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Trigger to automatically calculate grand_total and set closed_at on status = 'paid' or 'done'
CREATE OR REPLACE FUNCTION handle_job_status_and_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- If total_estimated_cost is set but grand_total is not, set grand_total
  IF NEW.grand_total = 0 OR NEW.grand_total IS NULL THEN
    NEW.grand_total = COALESCE(NEW.total_estimated_cost, 0);
  END IF;

  -- Set closed_at timestamp when status transitions to paid or done
  IF (NEW.status IN ('done', 'paid')) AND (OLD.status NOT IN ('done', 'paid') OR NEW.closed_at IS NULL) THEN
    NEW.closed_at = timezone('utc'::text, now());
  ELSIF (NEW.status NOT IN ('done', 'paid')) THEN
    NEW.closed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_status_and_totals ON jobs;
CREATE TRIGGER trg_job_status_and_totals
  BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION handle_job_status_and_totals();

-- 4. Update PRESET SERVICES Table (alias compatibility)
ALTER TABLE preset_services
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('part', 'labor')),
  ADD COLUMN IF NOT EXISTS default_price NUMERIC(10,2);

-- Populate title/category/default_price from name/type/default_cost if missing
UPDATE preset_services 
SET 
  title = COALESCE(title, name),
  category = COALESCE(category, type),
  default_price = COALESCE(default_price, default_cost)
WHERE title IS NULL OR category IS NULL OR default_price IS NULL;

-- 5. CASCADE ACCOUNT DELETION FUNCTION (POPIA/GDPR Compliance)
CREATE OR REPLACE FUNCTION delete_garage_account()
RETURNS VOID AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from garages table (Cascades to clients, vehicles, jobs, job_items, preset_services)
  DELETE FROM garages WHERE id = current_user_id;

  -- Delete auth user
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION delete_garage_account() TO authenticated;
