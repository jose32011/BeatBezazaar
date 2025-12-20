import postgres from 'postgres';
import bcrypt from 'bcryptjs';

export async function initializeDatabase(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    return;
  }

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
      await createAllTables(sql);
      await insertDefaultData(sql);
      } else {
      // Run migrations for new features
      await runMigrations(sql);
    }

  } catch (error) {
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
      color TEXT NOT NULL DEFAULT '#3b82f6',
      image_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      purchase_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      transaction_id TEXT,
      bank_reference TEXT,
      notes TEXT,
      approved_by TEXT,
      approved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

  }

async function runMigrations(sql: any): Promise<void> {
  try {
    // Check for app_branding_settings table
    const appBrandingTable = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'app_branding_settings'
    `;

    if (appBrandingTable.length === 0) {
      await sql`
        CREATE TABLE app_branding_settings (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          app_name TEXT NOT NULL DEFAULT 'BeatBazaar',
          app_logo TEXT NOT NULL DEFAULT '',
          hero_title TEXT NOT NULL DEFAULT 'Discover Your Sound',
          hero_subtitle TEXT NOT NULL DEFAULT 'Premium beats for every artist. Find your perfect sound and bring your music to life.',
          hero_image TEXT NOT NULL DEFAULT '',
          hero_button_text TEXT NOT NULL DEFAULT 'Start Creating',
          hero_button_link TEXT NOT NULL DEFAULT '/beats',
          login_title TEXT NOT NULL DEFAULT 'Welcome Back',
          login_subtitle TEXT NOT NULL DEFAULT 'Sign in to your account to continue',
          login_image TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Insert default app branding settings
      await sql`
        INSERT INTO app_branding_settings (id, app_name, hero_title, hero_subtitle, hero_button_text, hero_button_link, login_title, login_subtitle)
        VALUES (
          'default',
          'BeatBazaar',
          'Discover Your Sound',
          'Premium beats for every artist. Find your perfect sound and bring your music to life.',
          'Start Creating',
          '/beats',
          'Welcome Back',
          'Sign in to your account to continue'
        )
      `;
      }

    // Check for other settings tables
    const settingsTables = ['email_settings', 'social_media_settings', 'contact_settings'];
    
    for (const tableName of settingsTables) {
      const tableExists = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = ${tableName}
      `;

      if (tableExists.length === 0) {
        if (tableName === 'email_settings') {
          await sql`
            CREATE TABLE email_settings (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              enabled BOOLEAN NOT NULL DEFAULT false,
              smtp_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
              smtp_port INTEGER NOT NULL DEFAULT 587,
              smtp_secure BOOLEAN NOT NULL DEFAULT false,
              smtp_user TEXT NOT NULL DEFAULT '',
              smtp_pass TEXT NOT NULL DEFAULT '',
              from_name TEXT NOT NULL DEFAULT 'BeatBazaar',
              from_email TEXT NOT NULL DEFAULT '',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `;
        } else if (tableName === 'social_media_settings') {
          await sql`
            CREATE TABLE social_media_settings (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              facebook_url TEXT NOT NULL DEFAULT '',
              instagram_url TEXT NOT NULL DEFAULT '',
              twitter_url TEXT NOT NULL DEFAULT '',
              youtube_url TEXT NOT NULL DEFAULT '',
              tiktok_url TEXT NOT NULL DEFAULT '',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `;
        } else if (tableName === 'contact_settings') {
          await sql`
            CREATE TABLE contact_settings (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              band_image_url TEXT NOT NULL DEFAULT '',
              band_name TEXT NOT NULL DEFAULT 'BeatBazaar',
              contact_email TEXT NOT NULL DEFAULT 'contact@beatbazaar.com',
              contact_phone TEXT NOT NULL DEFAULT '+1 (555) 123-4567',
              contact_address TEXT NOT NULL DEFAULT '123 Music Street',
              contact_city TEXT NOT NULL DEFAULT 'Los Angeles',
              contact_state TEXT NOT NULL DEFAULT 'CA',
              contact_zip_code TEXT NOT NULL DEFAULT '90210',
              contact_country TEXT NOT NULL DEFAULT 'USA',
              message_enabled BOOLEAN NOT NULL DEFAULT true,
              message_subject TEXT NOT NULL DEFAULT 'New Contact Form Submission',
              message_template TEXT NOT NULL DEFAULT 'You have received a new message from your contact form.',
              facebook_url TEXT NOT NULL DEFAULT '',
              instagram_url TEXT NOT NULL DEFAULT '',
              twitter_url TEXT NOT NULL DEFAULT '',
              youtube_url TEXT NOT NULL DEFAULT '',
              tiktok_url TEXT NOT NULL DEFAULT '',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `;
        }
        }
    }

    // Check for exclusive purchase columns
    const purchaseColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'purchases' 
      AND column_name IN ('beat_audio_url', 'beat_image_url', 'notes')
    `;

    if (purchaseColumns.length < 3) {
      await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS beat_audio_url TEXT`;
      await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS beat_image_url TEXT`;
      await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS notes TEXT`;
    }

    // Check for exclusive beat columns
    const beatColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'beats' 
      AND column_name IN ('is_exclusive', 'is_hidden', 'exclusive_plan')
    `;

    if (beatColumns.length < 3) {
      await sql`ALTER TABLE beats ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false NOT NULL`;
      await sql`ALTER TABLE beats ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false NOT NULL`;
      await sql`ALTER TABLE beats ADD COLUMN IF NOT EXISTS exclusive_plan TEXT`;
    }

    // Ensure home_settings table exists
    const homeSettingsTable = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'home_settings'
    `;

    if (homeSettingsTable.length === 0) {
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

    // Check for missing genre columns
    const genreColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'genres' 
      AND column_name IN ('color', 'image_url', 'is_active', 'updated_at')
    `;

    if (genreColumns.length < 4) {
      await sql`ALTER TABLE genres ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6'`;
      await sql`ALTER TABLE genres ADD COLUMN IF NOT EXISTS image_url TEXT`;
      await sql`ALTER TABLE genres ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`;
      await sql`ALTER TABLE genres ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
      
      // Update existing genres to have the default color and active status
      await sql`UPDATE genres SET color = '#3b82f6' WHERE color IS NULL`;
      await sql`UPDATE genres SET is_active = true WHERE is_active IS NULL`;
      await sql`UPDATE genres SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`;
    }

    // Check for missing payment columns
    const paymentColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name IN ('status', 'transaction_id', 'approved_by', 'approved_at', 'updated_at')
    `;

    if (paymentColumns.length < 5) {
      await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`;
      await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id TEXT`;
      await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS approved_by TEXT`;
      await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`;
      await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
      
      // Update existing payments to have default status
      await sql`UPDATE payments SET status = 'pending' WHERE status IS NULL`;
      await sql`UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`;
    }

  } catch (error) {
    }
}