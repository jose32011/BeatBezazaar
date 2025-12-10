#!/usr/bin/env node

/**
 * Migration script to add home_settings table to the database
 * Run this with: node migrate-home-settings.js
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
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

console.log('🔄 Starting home settings migration...\n');

const sql = postgres(connectionString);

async function migrate() {
  try {
    console.log('📋 Step 1: Creating home_settings table...');
    
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
    console.log('✅ Created home_settings table');

    console.log('\n📋 Step 2: Inserting default home settings...');
    
    // Insert default settings if they don't exist
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
    console.log('✅ Inserted default home settings');

    console.log('\n📋 Step 3: Verifying table...');

    // Verify table exists and has data
    const settings = await sql`
      SELECT * FROM home_settings WHERE id = 'default'
    `;
    
    if (settings.length > 0) {
      console.log('\n✅ Home settings verified:');
      console.log(`   Title: ${settings[0].title}`);
      console.log(`   Description: ${settings[0].description}`);
      console.log(`   Feature 1: ${settings[0].feature1}`);
      console.log(`   Feature 2: ${settings[0].feature2}`);
      console.log(`   Feature 3: ${settings[0].feature3}`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Created home_settings table');
    console.log('   - Inserted default settings');
    console.log('\n🎉 You can now customize your home page from Admin Settings!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
