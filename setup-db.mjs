import postgres from 'postgres';

const connectionString = 'postgres://postgres.loxrbavxiwraisbzbtat:Supermedia123!@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require';

const sql = postgres(connectionString);

async function setupDatabase() {
  console.log('Connecting to Supabase...');
  
  try {
    // Enable UUID extension
    console.log('1. Enabling UUID extension...');
    await sql.unsafe(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('   ✓ Done');

    // Create users table
    console.log('2. Creating users table...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS clozer_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'commercial')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✓ Done');

    // Insert default admin
    console.log('3. Inserting default admin...');
    await sql.unsafe(`
      INSERT INTO clozer_users (id, name, email, role) 
      VALUES ('00000000-0000-0000-0000-000000000001', 'Administrateur', 'admin@clozer.fr', 'admin')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('   ✓ Done');

    // Create clients table
    console.log('4. Creating clients table...');
    await sql.unsafe(`
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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✓ Done');

    // Create tours table
    console.log('5. Creating tours table...');
    await sql.unsafe(`
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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✓ Done');

    // Create visits table
    console.log('6. Creating visits table...');
    await sql.unsafe(`
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
      )
    `);
    console.log('   ✓ Done');

    // Create quotes table
    console.log('7. Creating quotes table...');
    await sql.unsafe(`
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
      )
    `);
    console.log('   ✓ Done');

    // Create visit_reports table
    console.log('8. Creating visit_reports table...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS clozer_visit_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        visit_id UUID NOT NULL REFERENCES clozer_visits(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES clozer_clients(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_by UUID REFERENCES clozer_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✓ Done');

    // Create settings table
    console.log('9. Creating settings table...');
    await sql.unsafe(`
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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✓ Done');

    // Insert default settings
    console.log('10. Inserting default settings...');
    await sql.unsafe(`
      INSERT INTO clozer_settings (id, user_id) 
      VALUES ('00000000-0000-0000-0000-000000000001', NULL)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('   ✓ Done');

    // Create indexes
    console.log('11. Creating indexes...');
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_clozer_clients_assigned_to ON clozer_clients(assigned_to)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_clozer_tours_user_id ON clozer_tours(user_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_clozer_visits_tour_id ON clozer_visits(tour_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_clozer_visits_client_id ON clozer_visits(client_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_clozer_quotes_client_id ON clozer_quotes(client_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_clozer_visit_reports_visit_id ON clozer_visit_reports(visit_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_clozer_visit_reports_client_id ON clozer_visit_reports(client_id)`);
    console.log('   ✓ Done');

    // Enable RLS
    console.log('12. Enabling Row Level Security...');
    await sql.unsafe(`ALTER TABLE clozer_users ENABLE ROW LEVEL SECURITY`);
    await sql.unsafe(`ALTER TABLE clozer_clients ENABLE ROW LEVEL SECURITY`);
    await sql.unsafe(`ALTER TABLE clozer_tours ENABLE ROW LEVEL SECURITY`);
    await sql.unsafe(`ALTER TABLE clozer_visits ENABLE ROW LEVEL SECURITY`);
    await sql.unsafe(`ALTER TABLE clozer_quotes ENABLE ROW LEVEL SECURITY`);
    await sql.unsafe(`ALTER TABLE clozer_visit_reports ENABLE ROW LEVEL SECURITY`);
    await sql.unsafe(`ALTER TABLE clozer_settings ENABLE ROW LEVEL SECURITY`);
    console.log('   ✓ Done');

    // Create RLS policies
    console.log('13. Creating RLS policies...');
    try {
      await sql.unsafe(`CREATE POLICY "Allow all on clozer_users" ON clozer_users FOR ALL USING (true) WITH CHECK (true)`);
    } catch (e) { /* ignore if exists */ }
    try {
      await sql.unsafe(`CREATE POLICY "Allow all on clozer_clients" ON clozer_clients FOR ALL USING (true) WITH CHECK (true)`);
    } catch (e) { /* ignore if exists */ }
    try {
      await sql.unsafe(`CREATE POLICY "Allow all on clozer_tours" ON clozer_tours FOR ALL USING (true) WITH CHECK (true)`);
    } catch (e) { /* ignore if exists */ }
    try {
      await sql.unsafe(`CREATE POLICY "Allow all on clozer_visits" ON clozer_visits FOR ALL USING (true) WITH CHECK (true)`);
    } catch (e) { /* ignore if exists */ }
    try {
      await sql.unsafe(`CREATE POLICY "Allow all on clozer_quotes" ON clozer_quotes FOR ALL USING (true) WITH CHECK (true)`);
    } catch (e) { /* ignore if exists */ }
    try {
      await sql.unsafe(`CREATE POLICY "Allow all on clozer_visit_reports" ON clozer_visit_reports FOR ALL USING (true) WITH CHECK (true)`);
    } catch (e) { /* ignore if exists */ }
    try {
      await sql.unsafe(`CREATE POLICY "Allow all on clozer_settings" ON clozer_settings FOR ALL USING (true) WITH CHECK (true)`);
    } catch (e) { /* ignore if exists */ }
    console.log('   ✓ Done');

    console.log('\n✅ Database setup complete!');
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'clozer_%'
      ORDER BY table_name
    `;
    
    console.log('\nClozer tables created:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

setupDatabase();
