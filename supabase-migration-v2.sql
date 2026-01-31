-- Clozer v2 Database Migration
-- Run this in Supabase SQL Editor after the initial schema

-- ==================== NEW TABLE: USER ADDRESSES ====================
-- Stores personal addresses for commercials (home, secondary office, etc.)
CREATE TABLE IF NOT EXISTS clozer_user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES clozer_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Domicile", "Bureau Lyon", etc.
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON clozer_user_addresses(user_id);

-- ==================== NEW TABLE: TOUR NOTES ====================
-- Field notes taken during a tour (carnet de bord)
CREATE TABLE IF NOT EXISTS clozer_tour_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES clozer_tours(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_notes_tour_id ON clozer_tour_notes(tour_id);

-- ==================== NEW TABLE: REACTIVATION REQUESTS ====================
-- Requests from commercials to reactivate inactive clients
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

CREATE INDEX IF NOT EXISTS idx_reactivation_requests_client_id ON clozer_reactivation_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_reactivation_requests_status ON clozer_reactivation_requests(status);

-- ==================== NEW TABLE: USER SUPERVISORS ====================
-- Links commercials to their supervisors (for report emails)
CREATE TABLE IF NOT EXISTS clozer_user_supervisors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES clozer_users(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES clozer_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, supervisor_id)
);

CREATE INDEX IF NOT EXISTS idx_user_supervisors_user_id ON clozer_user_supervisors(user_id);

-- ==================== MODIFY CLIENTS TABLE ====================
-- Add status and availability profile columns
ALTER TABLE clozer_clients 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

ALTER TABLE clozer_clients 
ADD COLUMN IF NOT EXISTS availability_profile TEXT CHECK (availability_profile IN ('retired', 'working') OR availability_profile IS NULL);

ALTER TABLE clozer_clients 
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

ALTER TABLE clozer_clients 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

ALTER TABLE clozer_clients 
ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES clozer_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_status ON clozer_clients(status);

-- ==================== MODIFY TOURS TABLE ====================
-- Add fields for report and custom start address
ALTER TABLE clozer_tours 
ADD COLUMN IF NOT EXISTS start_address_id UUID REFERENCES clozer_user_addresses(id) ON DELETE SET NULL;

ALTER TABLE clozer_tours 
ADD COLUMN IF NOT EXISTS final_report TEXT;

ALTER TABLE clozer_tours 
ADD COLUMN IF NOT EXISTS report_validated_at TIMESTAMPTZ;

ALTER TABLE clozer_tours 
ADD COLUMN IF NOT EXISTS report_sent_at TIMESTAMPTZ;

-- ==================== MODIFY SETTINGS TABLE ====================
-- Add headquarters and configuration fields
ALTER TABLE clozer_settings 
ADD COLUMN IF NOT EXISTS working_profile_hour TEXT DEFAULT '17:30';

ALTER TABLE clozer_settings 
ADD COLUMN IF NOT EXISTS headquarters_address TEXT DEFAULT '22 avenue de la République';

ALTER TABLE clozer_settings 
ADD COLUMN IF NOT EXISTS headquarters_city TEXT DEFAULT 'Le Gond-Pontouvre';

ALTER TABLE clozer_settings 
ADD COLUMN IF NOT EXISTS headquarters_postal_code TEXT DEFAULT '16160';

ALTER TABLE clozer_settings 
ADD COLUMN IF NOT EXISTS headquarters_lat DOUBLE PRECISION DEFAULT 45.6685;

ALTER TABLE clozer_settings 
ADD COLUMN IF NOT EXISTS headquarters_lng DOUBLE PRECISION DEFAULT 0.1512;

ALTER TABLE clozer_settings 
ADD COLUMN IF NOT EXISTS confirmation_words TEXT[] DEFAULT ARRAY['TERMINER', 'VALIDER', 'CONFIRMER', 'ORANGE', 'ACCORD', 'CLOTURER', 'FINI'];

-- ==================== ENABLE RLS ON NEW TABLES ====================
ALTER TABLE clozer_user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_tour_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_reactivation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_user_supervisors ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Allow all on user_addresses" ON clozer_user_addresses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tour_notes" ON clozer_tour_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on reactivation_requests" ON clozer_reactivation_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on user_supervisors" ON clozer_user_supervisors FOR ALL USING (true) WITH CHECK (true);

-- ==================== TRIGGERS FOR NEW TABLES ====================
CREATE TRIGGER update_user_addresses_updated_at 
BEFORE UPDATE ON clozer_user_addresses 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_notes_updated_at 
BEFORE UPDATE ON clozer_tour_notes 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== UPDATE DEFAULT SETTINGS WITH HEADQUARTERS ====================
UPDATE clozer_settings 
SET 
  headquarters_address = '22 avenue de la République',
  headquarters_city = 'Le Gond-Pontouvre',
  headquarters_postal_code = '16160',
  headquarters_lat = 45.6685,
  headquarters_lng = 0.1512
WHERE id = '00000000-0000-0000-0000-000000000001';
