#!/usr/bin/env node

/**
 * Migration script to add exclusive purchase fields to the database
 * Run this with: node migrate-exclusive-purchases.js
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

console.log('🔄 Starting exclusive purchase migration...\n');

const sql = postgres(connectionString);

async function migrate() {
  try {
    console.log('📋 Step 1: Adding new columns to purchases table...');
    
    // Add beatAudioUrl column
    try {
      await sql`
        ALTER TABLE purchases 
        ADD COLUMN IF NOT EXISTS beat_audio_url TEXT
      `;
      console.log('✅ Added beat_audio_url column');
    } catch (error) {
      console.log('⚠️  beat_audio_url column may already exist:', error.message);
    }

    // Add beatImageUrl column
    try {
      await sql`
        ALTER TABLE purchases 
        ADD COLUMN IF NOT EXISTS beat_image_url TEXT
      `;
      console.log('✅ Added beat_image_url column');
    } catch (error) {
      console.log('⚠️  beat_image_url column may already exist:', error.message);
    }

    // Add notes column
    try {
      await sql`
        ALTER TABLE purchases 
        ADD COLUMN IF NOT EXISTS notes TEXT
      `;
      console.log('✅ Added notes column');
    } catch (error) {
      console.log('⚠️  notes column may already exist:', error.message);
    }

    console.log('\n📋 Step 2: Adding new columns to beats table...');

    // Add isExclusive column to beats
    try {
      await sql`
        ALTER TABLE beats 
        ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false NOT NULL
      `;
      console.log('✅ Added is_exclusive column');
    } catch (error) {
      console.log('⚠️  is_exclusive column may already exist:', error.message);
    }

    // Add isHidden column to beats
    try {
      await sql`
        ALTER TABLE beats 
        ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false NOT NULL
      `;
      console.log('✅ Added is_hidden column');
    } catch (error) {
      console.log('⚠️  is_hidden column may already exist:', error.message);
    }

    console.log('\n📋 Step 3: Verifying columns...');

    // Verify purchases table columns
    const purchasesColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'purchases' 
      AND column_name IN ('beat_audio_url', 'beat_image_url', 'notes')
      ORDER BY column_name
    `;
    
    console.log('\nPurchases table columns:');
    purchasesColumns.forEach(col => {
      console.log(`  ✓ ${col.column_name} (${col.data_type})`);
    });

    // Verify beats table columns
    const beatsColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'beats' 
      AND column_name IN ('is_exclusive', 'is_hidden')
      ORDER BY column_name
    `;
    
    console.log('\nBeats table columns:');
    beatsColumns.forEach(col => {
      console.log(`  ✓ ${col.column_name} (${col.data_type})`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Added beat_audio_url, beat_image_url, notes to purchases table');
    console.log('   - Added is_exclusive, is_hidden to beats table');
    console.log('\n🎉 You can now use the exclusive purchase feature!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
