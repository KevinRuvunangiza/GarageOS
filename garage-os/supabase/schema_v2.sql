-- ============================================
-- GarageOS v2 — Expanded Schema
-- Paste this into Supabase SQL Editor
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- GARAGES TABLE (Onboarding Profile)
-- ============================================
CREATE TABLE garages (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  garage_name TEXT NOT NULL,
  garage_address TEXT NOT NULL,
  personal_phone TEXT NOT NULL,
  garage_phone TEXT NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'trial', 'active', 'active_lifetime')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE garages IS 'Garage profile linked to auth user';

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- JOBS TABLE
-- ============================================
CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'done', 'paid')),
  issue_description TEXT NOT NULL,
  total_estimated_cost NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- JOB ITEMS TABLE
-- ============================================
CREATE TABLE job_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('part', 'labor')),
  description TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_items ENABLE ROW LEVEL SECURITY;

-- GARAGES: users manage their own profile
CREATE POLICY "Users can manage own garage"
  ON garages FOR ALL USING (auth.uid() = id);

-- CLIENTS: garage-scoped
CREATE POLICY "Garage can manage own clients"
  ON clients FOR ALL USING (auth.uid() = garage_id);

-- VEHICLES: garage-scoped
CREATE POLICY "Garage can manage own vehicles"
  ON vehicles FOR ALL USING (auth.uid() = garage_id);

-- JOBS: garage-scoped
CREATE POLICY "Garage can manage own jobs"
  ON jobs FOR ALL USING (auth.uid() = garage_id);

-- JOB ITEMS: garage-scoped
CREATE POLICY "Garage can manage own job items"
  ON job_items FOR ALL USING (auth.uid() = garage_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_clients_garage_id ON clients(garage_id);
CREATE INDEX idx_vehicles_garage_id ON vehicles(garage_id);
CREATE INDEX idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX idx_jobs_garage_id ON jobs(garage_id);
CREATE INDEX idx_jobs_vehicle_id ON jobs(vehicle_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_job_items_garage_id ON job_items(garage_id);
CREATE INDEX idx_job_items_job_id ON job_items(job_id);
