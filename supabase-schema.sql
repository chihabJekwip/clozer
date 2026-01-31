-- Clozer Database Schema for Supabase
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/loxrbavxiwraisbzbtat/sql)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS ====================
CREATE TABLE IF NOT EXISTS clozer_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'commercial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin
INSERT INTO clozer_users (id, name, email, role) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Administrateur', 'admin@clozer.fr', 'admin')
ON CONFLICT (id) DO NOTHING;

-- ==================== CLIENTS ====================
CREATE TABLE IF NOT EXISTS clozer_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  civilite TEXT NOT NULL DEFAULT '',
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL DEFAULT '',
  tel_domicile TEXT,
  portable_m TEXT,
  portable_mme TEXT,
  adresse TEXT NOT NULL,
  code_postal TEXT NOT NULL,
  ville TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  assigned_to UUID REFERENCES clozer_users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  availability_profile TEXT CHECK (availability_profile IN ('retired', 'working') OR availability_profile IS NULL),
  deactivation_reason TEXT,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES clozer_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== USER ADDRESSES ====================
CREATE TABLE IF NOT EXISTS clozer_user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES clozer_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== TOURS ====================
CREATE TABLE IF NOT EXISTS clozer_tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_lat DOUBLE PRECISION NOT NULL,
  start_lng DOUBLE PRECISION NOT NULL,
  start_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'paused')),
  total_distance DOUBLE PRECISION,
  total_duration DOUBLE PRECISION,
  user_id UUID REFERENCES clozer_users(id) ON DELETE SET NULL,
  start_address_id UUID REFERENCES clozer_user_addresses(id) ON DELETE SET NULL,
  final_report TEXT,
  report_validated_at TIMESTAMPTZ,
  report_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== VISITS ====================
CREATE TABLE IF NOT EXISTS clozer_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES clozer_tours(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clozer_clients(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'absent', 'postponed', 'skipped')),
  visited_at TIMESTAMPTZ,
  notes TEXT,
  absent_strategy TEXT CHECK (absent_strategy IN ('after_next', 'on_return', 'another_day')),
  estimated_arrival TIMESTAMPTZ,
  estimated_duration INTEGER NOT NULL DEFAULT 30,
  distance_from_previous DOUBLE PRECISION,
  duration_from_previous DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== QUOTES ====================
CREATE TABLE IF NOT EXISTS clozer_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID REFERENCES clozer_visits(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clozer_clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  client_name TEXT NOT NULL,
  client_address TEXT NOT NULL,
  client_phone TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  total_ht DOUBLE PRECISION NOT NULL DEFAULT 0,
  tva DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_ttc DOUBLE PRECISION NOT NULL DEFAULT 0,
  signature_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== VISIT REPORTS ====================
CREATE TABLE IF NOT EXISTS clozer_visit_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES clozer_visits(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clozer_clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES clozer_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== TOUR NOTES ====================
CREATE TABLE IF NOT EXISTS clozer_tour_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES clozer_tours(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== REACTIVATION REQUESTS ====================
CREATE TABLE IF NOT EXISTS clozer_reactivation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clozer_clients(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES clozer_users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES clozer_users(id) ON DELETE SET NULL,
  review_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ==================== USER SUPERVISORS ====================
CREATE TABLE IF NOT EXISTS clozer_user_supervisors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES clozer_users(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES clozer_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, supervisor_id)
);

-- ==================== SETTINGS ====================
CREATE TABLE IF NOT EXISTS clozer_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES clozer_users(id) ON DELETE CASCADE,
  start_lat DOUBLE PRECISION NOT NULL DEFAULT 45.6486,
  start_lng DOUBLE PRECISION NOT NULL DEFAULT 0.1556,
  start_address TEXT NOT NULL DEFAULT 'Angoulême, France',
  work_start_time TEXT NOT NULL DEFAULT '08:30',
  work_end_time TEXT NOT NULL DEFAULT '18:00',
  lunch_break_start TEXT DEFAULT '12:00',
  lunch_break_end TEXT DEFAULT '13:30',
  default_visit_duration INTEGER NOT NULL DEFAULT 30,
  company_name TEXT NOT NULL DEFAULT 'Mon Entreprise',
  company_address TEXT NOT NULL DEFAULT 'Angoulême, France',
  company_phone TEXT NOT NULL DEFAULT '',
  company_siret TEXT NOT NULL DEFAULT '',
  working_profile_hour TEXT DEFAULT '17:30',
  headquarters_address TEXT DEFAULT '22 avenue de la République',
  headquarters_city TEXT DEFAULT 'Le Gond-Pontouvre',
  headquarters_postal_code TEXT DEFAULT '16160',
  headquarters_lat DOUBLE PRECISION DEFAULT 45.6685,
  headquarters_lng DOUBLE PRECISION DEFAULT 0.1512,
  confirmation_words TEXT[] DEFAULT ARRAY['TERMINER', 'VALIDER', 'CONFIRMER', 'ORANGE', 'ACCORD', 'CLOTURER', 'FINI'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO clozer_settings (id, user_id) 
VALUES ('00000000-0000-0000-0000-000000000001', NULL)
ON CONFLICT (id) DO NOTHING;

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_clozer_clients_assigned_to ON clozer_clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_clozer_clients_status ON clozer_clients(status);
CREATE INDEX IF NOT EXISTS idx_clozer_tours_user_id ON clozer_tours(user_id);
CREATE INDEX IF NOT EXISTS idx_clozer_visits_tour_id ON clozer_visits(tour_id);
CREATE INDEX IF NOT EXISTS idx_clozer_visits_client_id ON clozer_visits(client_id);
CREATE INDEX IF NOT EXISTS idx_clozer_quotes_client_id ON clozer_quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_clozer_visit_reports_visit_id ON clozer_visit_reports(visit_id);
CREATE INDEX IF NOT EXISTS idx_clozer_visit_reports_client_id ON clozer_visit_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_clozer_tour_notes_tour_id ON clozer_tour_notes(tour_id);
CREATE INDEX IF NOT EXISTS idx_clozer_user_addresses_user_id ON clozer_user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_clozer_reactivation_requests_client_id ON clozer_reactivation_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_clozer_reactivation_requests_status ON clozer_reactivation_requests(status);
CREATE INDEX IF NOT EXISTS idx_clozer_user_supervisors_user_id ON clozer_user_supervisors(user_id);

-- ==================== ROW LEVEL SECURITY ====================
ALTER TABLE clozer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_visit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_tour_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_reactivation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_user_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (using anon key)
CREATE POLICY "Allow all on clozer_users" ON clozer_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clozer_clients" ON clozer_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clozer_tours" ON clozer_tours FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clozer_visits" ON clozer_visits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clozer_quotes" ON clozer_quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clozer_visit_reports" ON clozer_visit_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clozer_tour_notes" ON clozer_tour_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clozer_user_addresses" ON clozer_user_addresses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clozer_reactivation_requests" ON clozer_reactivation_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clozer_user_supervisors" ON clozer_user_supervisors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clozer_settings" ON clozer_settings FOR ALL USING (true) WITH CHECK (true);

-- ==================== TRIGGERS FOR UPDATED_AT ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_clozer_users_updated_at BEFORE UPDATE ON clozer_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clozer_clients_updated_at BEFORE UPDATE ON clozer_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clozer_tours_updated_at BEFORE UPDATE ON clozer_tours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clozer_visits_updated_at BEFORE UPDATE ON clozer_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clozer_quotes_updated_at BEFORE UPDATE ON clozer_quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clozer_visit_reports_updated_at BEFORE UPDATE ON clozer_visit_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clozer_tour_notes_updated_at BEFORE UPDATE ON clozer_tour_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clozer_user_addresses_updated_at BEFORE UPDATE ON clozer_user_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clozer_settings_updated_at BEFORE UPDATE ON clozer_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
