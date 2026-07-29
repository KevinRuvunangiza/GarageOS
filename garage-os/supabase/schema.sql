-- ============================================
-- GarageOS - Supabase Database Schema
-- Paste this directly into the Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

COMMENT ON TABLE clients IS 'Garage clients / vehicle owners';

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

COMMENT ON TABLE vehicles IS 'Vehicles belonging to clients';

-- ============================================
-- JOBS TABLE
-- ============================================
CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'done', 'paid')),
  issue_description TEXT NOT NULL,
  total_estimated_cost NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

COMMENT ON TABLE jobs IS 'Service jobs / repair tickets';

-- ============================================
-- JOB ITEMS TABLE
-- ============================================
CREATE TABLE job_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('part', 'labor')),
  description TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

COMMENT ON TABLE job_items IS 'Individual line items (parts & labor) for each job';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_items ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- CLIENTS POLICIES
-- --------------------------------------------
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------
-- VEHICLES POLICIES
-- --------------------------------------------
CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
  ON vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
  ON vehicles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
  ON vehicles FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------
-- JOBS POLICIES
-- --------------------------------------------
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------
-- JOB ITEMS POLICIES
-- --------------------------------------------
CREATE POLICY "Users can view own job items"
  ON job_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job items"
  ON job_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job items"
  ON job_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job items"
  ON job_items FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- INDEXES (Performance)
-- ============================================
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_jobs_vehicle_id ON jobs(vehicle_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_job_items_job_id ON job_items(job_id);
CREATE INDEX idx_job_items_user_id ON job_items(user_id);
