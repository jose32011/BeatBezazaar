#!/usr/bin/env node

/**
 * Setup script for Render database connection
 * This script helps you connect to your Render PostgreSQL database and run migrations
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔧 BeatBazaar Render Database Setup\n');

// Check if we have a DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.log('\n📋 To fix this:');
  console.log('1. Create a PostgreSQL database on Render');
  console.log('2. Copy the Internal Database URL');
  console.log('3. Set it as DATABASE_URL in your Render web service environment variables');
  console.log('4. Or temporarily add it to your .env file for local migration');
  console.log('\nExample:');
  console.log('DATABASE_URL=postgresql://user:pass@dpg-xxxxx-a:5432/dbname');
  process.exit(1);
}

console.log('🔍 Checking database connection...');
console.log(`📡 Database URL: ${databaseUrl.replace(/:[^:@]*@/, ':****@')}`);

const sql = postgres(databaseUrl);

async function setupDatabase() {
  try {
    // Test connection
    console.log('\n🔌 Testing database connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful!');

    // Check if tables exist
    console.log('\n📋 Checking existing tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`📊 Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Check for required columns
    console.log('\n🔍 Checking for exclusive purchase columns...');
    
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

    console.log(`📝 Purchases table exclusive columns: ${purchaseColumns.length}/3`);
    purchaseColumns.forEach(col => console.log(`  ✓ ${col.column_name}`));
    
    console.log(`🎵 Beats table exclusive columns: ${beatColumns.length}/2`);
    beatColumns.forEach(col => console.log(`  ✓ ${col.column_name}`));

    // Check for home_settings table
    const homeSettingsTable = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'home_settings'
    `;

    console.log(`🏠 Home settings table: ${homeSettingsTable.length > 0 ? '✅ Exists' : '❌ Missing'}`);

    // Check for admin user
    console.log('\n👤 Checking for admin user...');
    const adminUsers = await sql`
      SELECT username, role 
      FROM users 
      WHERE role = 'admin'
    `;

    console.log(`🔑 Admin users found: ${adminUsers.length}`);
    adminUsers.forEach(user => console.log(`  - ${user.username}`));

    // Recommendations
    console.log('\n📋 Recommendations:');
    
    if (purchaseColumns.length < 3 || beatColumns.length < 2) {
      console.log('❌ Missing exclusive purchase columns - run migrations:');
      console.log('   node migrate-exclusive-purchases.js');
    } else {
      console.log('✅ Exclusive purchase columns are ready');
    }

    if (homeSettingsTable.length === 0) {
      console.log('❌ Missing home settings table - run migration:');
      console.log('   node migrate-home-settings.js');
    } else {
      console.log('✅ Home settings table is ready');
    }

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found - create one:');
      console.log('   1. Visit your app URL + /setup');
      console.log('   2. Or manually insert admin user into database');
    } else {
      console.log('✅ Admin users are ready');
    }

    console.log('\n🎉 Database setup check complete!');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Connection refused - possible causes:');
      console.log('1. Wrong DATABASE_URL (check host, port, credentials)');
      console.log('2. Database service not running on Render');
      console.log('3. Network connectivity issues');
      console.log('4. Using external URL instead of internal URL');
    } else if (error.code === '3D000') {
      console.log('\n🔧 Database does not exist - create it:');
      console.log('1. Check database name in URL');
      console.log('2. Create database on Render if needed');
    } else if (error.code === '28P01') {
      console.log('\n🔧 Authentication failed - check credentials:');
      console.log('1. Verify username and password in DATABASE_URL');
      console.log('2. Reset database password on Render if needed');
    }
    
    process.exit(1);
  } finally {
    await sql.end();
  }
}

setupDatabase();