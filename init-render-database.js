#!/usr/bin/env node

/**
 * Complete database initialization script for Render deployment
 * This script creates all tables and runs all migrations
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🚀 Initializing BeatBazaar database for Render...\n');

const sql = postgres(connectionString);

async function runMigrations() {
  console.log('🔄 Running exclusive purchase migrations...');
  
  // Add exclusive purchase columns to purchases table
  try {
    await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS beat_audio_url TEXT`;
    await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS beat_image_url TEXT`;
    await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS notes TEXT`;
    console.log('✅ Purchases table migrations completed');
  } catch (error) {
    console.log('⚠️  Purchases migrations may have already been applied');
  }

  // Add exclusive columns to beats table
  try {
    await sql`ALTER TABLE beats ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false NOT NULL`;
    await sql`ALTER TABLE beats ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false NOT NULL`;
    console.log('✅ Beats table migrations completed');
  } catch (error) {
    console.log('⚠️  Beats migrations may have already been applied');
  }

  // Ensure home_settings table exists
  try {
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
    console.log('✅ Home settings migration completed');
  } catch (error) {
    console.log('⚠️  Home settings migration may have already been applied');
  }
}

async function initializeDatabase() {
  try {
    console.log('🔌 Testing database connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful!\n');

    // Check if database is already initialized
    try {
      const existingTables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      `;
      
      if (existingTables.length > 0) {
        console.log('ℹ️  Database already initialized, skipping table creation...');
        
        // Still check for missing columns (migrations)
        const purchaseColumns = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'purchases' 
          AND column_name IN ('beat_audio_url', 'beat_image_url', 'notes')
        `;
        
        const beatColumns = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'beats' 
          AND column_name IN ('is_exclusive', 'is_hidden')
        `;

        if (purchaseColumns.length < 3 || beatColumns.length < 2) {
          console.log('🔄 Running missing migrations...');
          await runMigrations();
        }

        console.log('✅ Database is ready!');
        return;
      }
    } catch (error) {
      // Tables don't exist, continue with initialization
      console.log('📋 No existing tables found, creating new database...');
    }

    // Create all tables in the correct order (respecting foreign keys)
    console.log('📋 Creating database tables...\n');

    // 1. Users table (no dependencies)
    console.log('👤 Creating users table...');
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
    console.log('✅ Users table created');

    // 2. Genres table (no dependencies)
    console.log('🎵 Creating genres table...');
    await sql`
      CREATE TABLE IF NOT EXISTS genres (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Genres table created');

    // 3. Beats table (no dependencies)
    console.log('🎶 Creating beats table...');
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
    console.log('✅ Beats table created');

    // 4. Customers table (depends on users)
    console.log('👥 Creating customers table...');
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
    console.log('✅ Customers table created');

    // 5. Purchases table (depends on users and beats)
    console.log('💰 Creating purchases table...');
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
    console.log('✅ Purchases table created');

    // 6. Cart table (depends on users and beats)
    console.log('🛒 Creating cart table...');
    await sql`
      CREATE TABLE IF NOT EXISTS cart (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL,
        beat_id TEXT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Cart table created');

    // 7. Payments table (depends on purchases and customers)
    console.log('💳 Creating payments table...');
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
    console.log('✅ Payments table created');

    // 8. Analytics table (no dependencies)
    console.log('📊 Creating analytics table...');
    await sql`
      CREATE TABLE IF NOT EXISTS analytics (
        id TEXT PRIMARY KEY DEFAULT 'default',
        site_visits INTEGER DEFAULT 0,
        total_downloads INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Analytics table created');

    // 9. Verification codes table (depends on users)
    console.log('🔐 Creating verification_codes table...');
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
    console.log('✅ Verification codes table created');

    // 10. Home settings table (no dependencies)
    console.log('🏠 Creating home_settings table...');
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
    console.log('✅ Home settings table created');

    console.log('\n📊 Inserting default data...\n');

    // Insert default analytics record
    await sql`
      INSERT INTO analytics (id, site_visits, total_downloads)
      VALUES ('default', 0, 0)
      ON CONFLICT (id) DO NOTHING
    `;
    console.log('✅ Default analytics record created');

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
    console.log('✅ Default home settings created');

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
    console.log('✅ Default genres created');

    // Create admin user
    console.log('\n👤 Creating admin user...');
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminId = crypto.randomUUID();

    await sql`
      INSERT INTO users (id, username, password, role, email, password_change_required)
      VALUES (
        ${adminId},
        'admin',
        ${hashedPassword},
        'admin',
        'admin@beatbazaar.com',
        ${1}
      )
      ON CONFLICT (username) DO NOTHING
    `;
    console.log('✅ Admin user created');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change this password after first login!');

    // Verify tables were created
    console.log('\n🔍 Verifying database setup...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`\n📊 Created ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`  ✓ ${table.table_name}`);
    });

    // Check admin user
    const adminUser = await sql`
      SELECT username, role, email 
      FROM users 
      WHERE role = 'admin'
    `;

    console.log(`\n👤 Admin users: ${adminUser.length}`);
    adminUser.forEach(user => {
      console.log(`  ✓ ${user.username} (${user.email})`);
    });

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Visit your Render app URL');
    console.log('2. Login with admin/admin123');
    console.log('3. Change the admin password');
    console.log('4. Upload some beats');
    console.log('5. Test the exclusive purchase feature');

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Connection refused - check DATABASE_URL');
    } else if (error.code === '3D000') {
      console.log('\n🔧 Database does not exist - create it on Render');
    } else if (error.code === '28P01') {
      console.log('\n🔧 Authentication failed - check credentials');
    }
    
    process.exit(1);
  } finally {
    await sql.end();
  }
}

initializeDatabase();