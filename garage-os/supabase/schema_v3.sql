-- ============================================
-- GarageOS v3 — Migration Script
-- Run this in the Supabase SQL Editor
-- (requires schema_v2 to already be applied)
-- ============================================

-- ============================================
-- 1. VEHICLE INTAKE FIELDS ON JOBS
-- ============================================

-- Fuel level enum-like constraint
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS fuel_level TEXT
    CHECK (fuel_level IN ('E', '1/4', '1/2', '3/4', 'F'));

-- Pre-existing damage as a Postgres text array
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS pre_existing_damage TEXT[] DEFAULT '{}';

-- updated_at for retention queries
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_set_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Backfill updated_at with created_at for existing rows
UPDATE jobs SET updated_at = created_at WHERE updated_at IS NULL;

-- Index for retention queries
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at ON jobs(updated_at);


-- ============================================
-- 2. PRESET SERVICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS preset_services (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  garage_id   UUID REFERENCES garages(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  default_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  type        TEXT NOT NULL DEFAULT 'labor'
                CHECK (type IN ('part', 'labor')),
  created_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE preset_services IS 'Garage-specific canned service presets for quick job entry';

-- RLS
ALTER TABLE preset_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Garage can manage own preset services"
  ON preset_services FOR ALL
  USING (auth.uid() = garage_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_preset_services_garage_id ON preset_services(garage_id);

-- ============================================
-- 3. SEED DEFAULT PRESETS
--    Inserts for all existing garages.
--    Safe to run multiple times (uses ON CONFLICT DO NOTHING via unique constraint).
--    For new garages you can call the INSERT directly after signup.
-- ============================================

-- Optional: seed a starter set for all existing garages
INSERT INTO preset_services (garage_id, name, default_cost, type)
SELECT
  g.id,
  s.name,
  s.default_cost,
  s.type
FROM garages g
CROSS JOIN (
  VALUES
    ('Major Service',        1500.00, 'labor'),
    ('Minor Service',         800.00, 'labor'),
    ('Brake Pad Change',      650.00, 'labor'),
    ('Brake Disc Replacement',900.00, 'part'),
    ('Wheel Alignment',       350.00, 'labor'),
    ('Tyre Rotation',         200.00, 'labor'),
    ('Battery Replacement',   950.00, 'part'),
    ('Air Filter',            180.00, 'part'),
    ('Oil Filter',            120.00, 'part'),
    ('Spark Plugs (set)',      380.00, 'part'),
    ('Diagnostic Scan',       350.00, 'labor'),
    ('Clutch Replacement',   2800.00, 'labor')
) AS s(name, default_cost, type)
ON CONFLICT DO NOTHING;
