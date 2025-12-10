import postgres from 'postgres';
import bcrypt from 'bcryptjs';

export async function initializeDatabase(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.log('⚠️  No DATABASE_URL found, skipping database initialization');
    return;
  }

  console.log('🔄 Checking database initialization...');
  
  const sql = postgres(connectionString);

  try {
    // Test connection
    await sql`SELECT 1 as test`;
    
    // Check if users table exists
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `;

    if (tablesResult.length === 0) {
      console.log('📋 Creating database tables...');
      await createAllTables(sql);
      await insertDefaultData(sql);
      console.log('✅ Database initialized successfully');
    } else {
      console.log('✅ Database already initialized');
      // Run migrations for new features
      await runMigrations(sql);
    }

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't throw - let the app start anyway
  } finally {
    await sql.end();
  }
}

async function createAllTables(sql: any): Promise<void> {
  // Create all tables in correct order
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      email TEXT,
      theme TEXT DEFAULT 'original',
      password_change_required INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS genres (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS beats (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      title TEXT NOT NULL,
      producer TEXT NOT NULL,
      bpm INTEGER NOT NULL,
      genre TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      image_url TEXT NOT NULL,
      audio_url TEXT,
      is_exclusive BOOLEAN DEFAULT false NOT NULL,
      is_hidden BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      country TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL,
      beat_id TEXT NOT NULL,
      beat_title TEXT,
      beat_producer TEXT,
      beat_audio_url TEXT,
      beat_image_url TEXT,
      price DOUBLE PRECISION NOT NULL,
      is_exclusive TEXT DEFAULT 'false' NOT NULL,
      status TEXT DEFAULT 'completed' NOT NULL,
      purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_at TIMESTAMP,
      approved_by TEXT,
      notes TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cart (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL,
      beat_id TEXT NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      purchase_id TEXT,
      customer_id TEXT,
      amount DOUBLE PRECISION NOT NULL,
      payment_method TEXT NOT NULL,
      bank_reference TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS analytics (
      id TEXT PRIMARY KEY DEFAULT 'default',
      site_visits INTEGER DEFAULT 0,
      total_downloads INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS home_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      title TEXT NOT NULL DEFAULT 'Premium Beats for Your Next Hit',
      description TEXT NOT NULL DEFAULT 'Discover high-quality beats crafted by professional producers.',
      feature1 TEXT NOT NULL DEFAULT 'Instant download after purchase',
      feature2 TEXT NOT NULL DEFAULT 'High-quality WAV & MP3 files',
      feature3 TEXT NOT NULL DEFAULT 'Professional mixing and mastering',
      image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

async function insertDefaultData(sql: any): Promise<void> {
  // Insert default analytics
  await sql`
    INSERT INTO analytics (id, site_visits, total_downloads)
    VALUES ('default', 0, 0)
    ON CONFLICT (id) DO NOTHING
  `;

  // Insert default home settings
  await sql`
    INSERT INTO home_settings (id, title, description, feature1, feature2, feature3, image_url)
    VALUES (
      'default',
      'Premium Beats for Your Next Hit',
      'Discover high-quality beats crafted by professional producers.',
      'Instant download after purchase',
      'High-quality WAV & MP3 files',
      'Professional mixing and mastering',
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop'
    )
    ON CONFLICT (id) DO NOTHING
  `;

  // Insert default genres
  const defaultGenres = [
    { name: 'Hip-Hop', description: 'Hip-hop and rap beats' },
    { name: 'Trap', description: 'Trap style beats' },
    { name: 'R&B', description: 'Rhythm and blues beats' },
    { name: 'Pop', description: 'Pop music beats' },
    { name: 'Electronic', description: 'Electronic and EDM beats' },
    { name: 'Lo-Fi', description: 'Lo-fi and chill beats' },
    { name: 'Jazz', description: 'Jazz influenced beats' },
    { name: 'Drill', description: 'Drill style beats' }
  ];

  for (const genre of defaultGenres) {
    await sql`
      INSERT INTO genres (name, description)
      VALUES (${genre.name}, ${genre.description})
      ON CONFLICT (name) DO NOTHING
    `;
  }

  // Create admin user
  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await sql`
    INSERT INTO users (username, password, role, email, password_change_required)
    VALUES (
      'admin',
      ${hashedPassword},
      'admin',
      'admin@beatbazaar.com',
      ${1}
    )
    ON CONFLICT (username) DO NOTHING
  `;

  console.log('✅ Default admin user created (admin/admin123)');
}

async function runMigrations(sql: any): Promise<void> {
  try {
    // Check for exclusive purchase columns
    const purchaseColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'purchases' 
      AND column_name IN ('beat_audio_url', 'beat_image_url', 'notes')
    `;

    if (purchaseColumns.length < 3) {
      console.log('🔄 Adding exclusive purchase columns...');
      await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS beat_audio_url TEXT`;
      await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS beat_image_url TEXT`;
      await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS notes TEXT`;
    }

    // Check for exclusive beat columns
    const beatColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'beats' 
      AND column_name IN ('is_exclusive', 'is_hidden')
    `;

    if (beatColumns.length < 2) {
      console.log('🔄 Adding exclusive beat columns...');
      await sql`ALTER TABLE beats ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false NOT NULL`;
      await sql`ALTER TABLE beats ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false NOT NULL`;
    }

    // Ensure home_settings table exists
    const homeSettingsTable = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'home_settings'
    `;

    if (homeSettingsTable.length === 0) {
      console.log('🔄 Creating home_settings table...');
      await sql`
        CREATE TABLE home_settings (
          id TEXT PRIMARY KEY DEFAULT 'default',
          title TEXT NOT NULL DEFAULT 'Premium Beats for Your Next Hit',
          description TEXT NOT NULL DEFAULT 'Discover high-quality beats crafted by professional producers.',
          feature1 TEXT NOT NULL DEFAULT 'Instant download after purchase',
          feature2 TEXT NOT NULL DEFAULT 'High-quality WAV & MP3 files',
          feature3 TEXT NOT NULL DEFAULT 'Professional mixing and mastering',
          image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await sql`
        INSERT INTO home_settings (id, title, description, feature1, feature2, feature3, image_url)
        VALUES (
          'default',
          'Premium Beats for Your Next Hit',
          'Discover high-quality beats crafted by professional producers.',
          'Instant download after purchase',
          'High-quality WAV & MP3 files',
          'Professional mixing and mastering',
          'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop'
        )
      `;
    }

  } catch (error) {
    console.log('⚠️  Some migrations may have already been applied');
  }
}