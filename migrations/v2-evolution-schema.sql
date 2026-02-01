-- ============================================================
-- CLOZER V2 EVOLUTION - Database Migration
-- Run this AFTER the base schema is in place
-- ============================================================

-- ==================== CLIENT NOTES (Notes persistantes par client) ====================
CREATE TABLE IF NOT EXISTS clozer_client_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clozer_clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES clozer_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clozer_client_notes_client_id ON clozer_client_notes(client_id);

-- ==================== CLIENT INTERACTIONS (Timeline) ====================
CREATE TABLE IF NOT EXISTS clozer_client_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clozer_clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('visit', 'call', 'email', 'quote_sent', 'quote_accepted', 'quote_rejected', 'note', 'status_change', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Pour stocker des données spécifiques au type
  created_by UUID REFERENCES clozer_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clozer_client_interactions_client_id ON clozer_client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_clozer_client_interactions_type ON clozer_client_interactions(type);
CREATE INDEX IF NOT EXISTS idx_clozer_client_interactions_created_at ON clozer_client_interactions(created_at DESC);

-- ==================== CLIENT PHOTOS ====================
CREATE TABLE IF NOT EXISTS clozer_client_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clozer_clients(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES clozer_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clozer_client_photos_client_id ON clozer_client_photos(client_id);

-- ==================== CLIENT EXTENDED INFO (Anniversaires, événements personnels) ====================
ALTER TABLE clozer_clients ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE clozer_clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE clozer_clients ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE clozer_clients ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE clozer_clients ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE clozer_clients ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT CHECK (preferred_contact_method IN ('phone', 'email', 'sms', 'visit'));
ALTER TABLE clozer_clients ADD COLUMN IF NOT EXISTS best_contact_time TEXT; -- Ex: "matin", "après-midi", "17h-19h"
ALTER TABLE clozer_clients ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMPTZ;
ALTER TABLE clozer_clients ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;
ALTER TABLE clozer_clients ADD COLUMN IF NOT EXISTS total_revenue DOUBLE PRECISION DEFAULT 0;
ALTER TABLE clozer_clients ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 50; -- 0-100

-- ==================== PRODUCTS CATALOG ====================
CREATE TABLE IF NOT EXISTS clozer_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price_ht DOUBLE PRECISION NOT NULL DEFAULT 0,
  tva_rate DOUBLE PRECISION NOT NULL DEFAULT 20,
  sku TEXT UNIQUE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  features TEXT[],
  competitor_comparison JSONB DEFAULT '{}', -- {"concurrent": "avantage"}
  sales_pitch TEXT, -- Argumentaire commercial
  objection_handlers JSONB DEFAULT '[]', -- [{"objection": "...", "response": "..."}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clozer_products_category ON clozer_products(category);
CREATE INDEX IF NOT EXISTS idx_clozer_products_is_active ON clozer_products(is_active);

-- ==================== CLIENT PRODUCTS (Produits achetés par client) ====================
CREATE TABLE IF NOT EXISTS clozer_client_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clozer_clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES clozer_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchase_date DATE NOT NULL,
  price_paid DOUBLE PRECISION NOT NULL,
  quote_id UUID REFERENCES clozer_quotes(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clozer_client_products_client_id ON clozer_client_products(client_id);
CREATE INDEX IF NOT EXISTS idx_clozer_client_products_product_id ON clozer_client_products(product_id);

-- ==================== SALES PIPELINE (Opportunités) ====================
CREATE TABLE IF NOT EXISTS clozer_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clozer_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  estimated_value DOUBLE PRECISION DEFAULT 0,
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  loss_reason TEXT,
  products JSONB DEFAULT '[]', -- [{product_id, quantity, price}]
  next_action TEXT,
  next_action_date DATE,
  assigned_to UUID REFERENCES clozer_users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES clozer_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clozer_opportunities_client_id ON clozer_opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_clozer_opportunities_stage ON clozer_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_clozer_opportunities_assigned_to ON clozer_opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_clozer_opportunities_expected_close_date ON clozer_opportunities(expected_close_date);

-- ==================== USER OBJECTIVES (Objectifs commerciaux) ====================
CREATE TABLE IF NOT EXISTS clozer_user_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES clozer_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('visits', 'revenue', 'quotes', 'conversions', 'new_clients')),
  target_value DOUBLE PRECISION NOT NULL,
  current_value DOUBLE PRECISION DEFAULT 0,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clozer_user_objectives_user_id ON clozer_user_objectives(user_id);
CREATE INDEX IF NOT EXISTS idx_clozer_user_objectives_period ON clozer_user_objectives(period_start, period_end);

-- ==================== USER ACHIEVEMENTS (Badges & Gamification) ====================
CREATE TABLE IF NOT EXISTS clozer_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- 'first_visit', 'streak_7', 'revenue_10k', etc.
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji ou nom d'icône
  category TEXT NOT NULL CHECK (category IN ('visits', 'revenue', 'streak', 'conversion', 'special')),
  condition_type TEXT NOT NULL, -- 'count', 'streak', 'amount', 'percentage'
  condition_value DOUBLE PRECISION NOT NULL,
  points INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default achievements
INSERT INTO clozer_achievements (code, name, description, icon, category, condition_type, condition_value, points) VALUES
  ('first_visit', 'Première visite', 'Réalisez votre première visite', '🎯', 'visits', 'count', 1, 10),
  ('visits_10', 'Démarrage', '10 visites réalisées', '🚀', 'visits', 'count', 10, 25),
  ('visits_50', 'Commercial actif', '50 visites réalisées', '⭐', 'visits', 'count', 50, 50),
  ('visits_100', 'Expert terrain', '100 visites réalisées', '🏆', 'visits', 'count', 100, 100),
  ('visits_500', 'Légende', '500 visites réalisées', '👑', 'visits', 'count', 500, 250),
  ('streak_3', 'Constance', '3 jours consécutifs avec visites', '🔥', 'streak', 'streak', 3, 15),
  ('streak_7', 'Semaine parfaite', '7 jours consécutifs avec visites', '💪', 'streak', 'streak', 7, 35),
  ('streak_30', 'Machine', '30 jours consécutifs avec visites', '🤖', 'streak', 'streak', 30, 100),
  ('revenue_1k', 'Premier millier', '1000€ de CA généré', '💰', 'revenue', 'amount', 1000, 20),
  ('revenue_10k', 'Performeur', '10 000€ de CA généré', '💎', 'revenue', 'amount', 10000, 75),
  ('revenue_50k', 'Top vendeur', '50 000€ de CA généré', '🌟', 'revenue', 'amount', 50000, 150),
  ('conversion_50', 'Closer', '50% de taux de conversion', '🎯', 'conversion', 'percentage', 50, 50),
  ('conversion_75', 'Elite', '75% de taux de conversion', '💯', 'conversion', 'percentage', 75, 100),
  ('early_bird', 'Lève-tôt', 'Première visite avant 9h', '🌅', 'special', 'count', 1, 15),
  ('night_owl', 'Travailleur', 'Visite après 18h', '🦉', 'special', 'count', 1, 15)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS clozer_user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES clozer_users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES clozer_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_clozer_user_achievements_user_id ON clozer_user_achievements(user_id);

-- ==================== USER STATS (Statistiques agrégées) ====================
CREATE TABLE IF NOT EXISTS clozer_user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES clozer_users(id) ON DELETE CASCADE,
  total_visits INTEGER DEFAULT 0,
  total_completed_visits INTEGER DEFAULT 0,
  total_absent_visits INTEGER DEFAULT 0,
  total_tours INTEGER DEFAULT 0,
  total_completed_tours INTEGER DEFAULT 0,
  total_quotes INTEGER DEFAULT 0,
  total_accepted_quotes INTEGER DEFAULT 0,
  total_revenue DOUBLE PRECISION DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_visit_date DATE,
  total_distance_km DOUBLE PRECISION DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== NOTIFICATIONS ====================
CREATE TABLE IF NOT EXISTS clozer_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES clozer_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'achievement', 'alert', 'info', 'objective', 'birthday', 'quote_expiring', 'client_inactive')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Données supplémentaires (client_id, quote_id, etc.)
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  action_url TEXT, -- Lien vers l'action à effectuer
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clozer_notifications_user_id ON clozer_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_clozer_notifications_is_read ON clozer_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_clozer_notifications_created_at ON clozer_notifications(created_at DESC);

-- ==================== ACTIVITY LOG (Pour analytics) ====================
CREATE TABLE IF NOT EXISTS clozer_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES clozer_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'visit_completed', 'quote_created', 'tour_started', etc.
  entity_type TEXT, -- 'client', 'tour', 'quote', etc.
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clozer_activity_log_user_id ON clozer_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_clozer_activity_log_action ON clozer_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_clozer_activity_log_created_at ON clozer_activity_log(created_at DESC);

-- ==================== QUOTE VALIDITY & REMINDERS ====================
ALTER TABLE clozer_quotes ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE clozer_quotes ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
ALTER TABLE clozer_quotes ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE clozer_quotes ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE clozer_quotes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES clozer_users(id) ON DELETE SET NULL;

-- ==================== USER EXTENDED INFO ====================
ALTER TABLE clozer_users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE clozer_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE clozer_users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}';
ALTER TABLE clozer_users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system'));
ALTER TABLE clozer_users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr';
ALTER TABLE clozer_users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- ==================== ROW LEVEL SECURITY FOR NEW TABLES ====================
ALTER TABLE clozer_client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_client_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_client_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_user_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clozer_activity_log ENABLE ROW LEVEL SECURITY;

-- Politiques permissives (à renforcer avec Supabase Auth)
CREATE POLICY IF NOT EXISTS "Allow all on clozer_client_notes" ON clozer_client_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on clozer_client_interactions" ON clozer_client_interactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on clozer_client_photos" ON clozer_client_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on clozer_products" ON clozer_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on clozer_client_products" ON clozer_client_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on clozer_opportunities" ON clozer_opportunities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on clozer_user_objectives" ON clozer_user_objectives FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on clozer_achievements" ON clozer_achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on clozer_user_achievements" ON clozer_user_achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on clozer_user_stats" ON clozer_user_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on clozer_notifications" ON clozer_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on clozer_activity_log" ON clozer_activity_log FOR ALL USING (true) WITH CHECK (true);

-- ==================== TRIGGERS FOR NEW TABLES ====================
CREATE OR REPLACE TRIGGER update_clozer_client_notes_updated_at BEFORE UPDATE ON clozer_client_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clozer_products_updated_at BEFORE UPDATE ON clozer_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clozer_opportunities_updated_at BEFORE UPDATE ON clozer_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clozer_user_objectives_updated_at BEFORE UPDATE ON clozer_user_objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clozer_user_stats_updated_at BEFORE UPDATE ON clozer_user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== FUNCTIONS FOR AUTO-UPDATING STATS ====================

-- Function to update client stats when visit is completed
CREATE OR REPLACE FUNCTION update_client_on_visit_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE clozer_clients 
    SET 
      last_visited_at = NOW(),
      visit_count = visit_count + 1,
      updated_at = NOW()
    WHERE id = NEW.client_id;
    
    -- Add to interactions
    INSERT INTO clozer_client_interactions (client_id, type, title, description, metadata)
    VALUES (NEW.client_id, 'visit', 'Visite effectuée', NEW.notes, jsonb_build_object('visit_id', NEW.id, 'tour_id', NEW.tour_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_on_visit ON clozer_visits;
CREATE TRIGGER trigger_update_client_on_visit
  AFTER INSERT OR UPDATE ON clozer_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_client_on_visit_complete();

-- Function to update client revenue when quote is accepted
CREATE OR REPLACE FUNCTION update_client_on_quote_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    UPDATE clozer_clients 
    SET 
      total_revenue = total_revenue + NEW.total_ttc,
      updated_at = NOW()
    WHERE id = NEW.client_id;
    
    -- Add to interactions
    INSERT INTO clozer_client_interactions (client_id, type, title, description, metadata)
    VALUES (NEW.client_id, 'quote_accepted', 'Devis accepté', 
      'Montant: ' || NEW.total_ttc || '€', 
      jsonb_build_object('quote_id', NEW.id, 'amount', NEW.total_ttc));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_on_quote ON clozer_quotes;
CREATE TRIGGER trigger_update_client_on_quote
  AFTER INSERT OR UPDATE ON clozer_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_client_on_quote_accepted();

-- Function to calculate client priority score
CREATE OR REPLACE FUNCTION calculate_client_priority_score(p_client_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 50;
  v_days_since_visit INTEGER;
  v_revenue DOUBLE PRECISION;
  v_visit_count INTEGER;
BEGIN
  SELECT 
    COALESCE(EXTRACT(DAY FROM NOW() - last_visited_at), 365),
    COALESCE(total_revenue, 0),
    COALESCE(visit_count, 0)
  INTO v_days_since_visit, v_revenue, v_visit_count
  FROM clozer_clients
  WHERE id = p_client_id;
  
  -- Score based on recency (0-30 points)
  IF v_days_since_visit <= 7 THEN
    v_score := v_score + 5;
  ELSIF v_days_since_visit <= 30 THEN
    v_score := v_score + 15;
  ELSIF v_days_since_visit <= 60 THEN
    v_score := v_score + 25;
  ELSIF v_days_since_visit > 60 THEN
    v_score := v_score + 30;
  END IF;
  
  -- Score based on revenue (0-30 points)
  IF v_revenue > 10000 THEN
    v_score := v_score - 10; -- Already a good client, lower priority
  ELSIF v_revenue > 5000 THEN
    v_score := v_score + 10;
  ELSIF v_revenue > 1000 THEN
    v_score := v_score + 20;
  ELSE
    v_score := v_score + 30; -- New potential
  END IF;
  
  -- Score based on engagement (0-20 points)
  IF v_visit_count = 0 THEN
    v_score := v_score + 20; -- Never visited
  ELSIF v_visit_count < 3 THEN
    v_score := v_score + 15;
  ELSIF v_visit_count < 10 THEN
    v_score := v_score + 10;
  END IF;
  
  -- Clamp between 0 and 100
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql;
