#!/usr/bin/env node

/**
 * Check and update PayPal settings
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

console.log('🔍 Checking PayPal settings...\n');

const sql = postgres(connectionString);

async function checkPayPalSettings() {
  try {
    console.log('🔌 Testing database connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful!\n');

    // Check if paypal_settings table exists
    const tableExists = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'paypal_settings'
    `;

    if (tableExists.length === 0) {
      console.log('❌ paypal_settings table does not exist');
      return;
    }

    console.log('✅ paypal_settings table exists');

    // Get current PayPal settings
    const settings = await sql`SELECT * FROM paypal_settings`;
    
    console.log('\n📋 Current PayPal settings:');
    if (settings.length === 0) {
      console.log('   No PayPal settings found in database');
      
      // Create default settings
      console.log('\n🔧 Creating default PayPal settings...');
      const newSettings = await sql`
        INSERT INTO paypal_settings (id, enabled, client_id, client_secret, sandbox, webhook_id, created_at, updated_at)
        VALUES (gen_random_uuid(), false, '', '', true, '', now(), now())
        RETURNING *
      `;
      console.log('✅ Default PayPal settings created:', newSettings[0]);
    } else {
      console.log('   Settings found:', settings[0]);
      
      // Show what the API endpoint should return
      const apiResponse = {
        clientId: settings[0].client_id,
        enabled: settings[0].enabled,
        sandbox: settings[0].sandbox
      };
      console.log('\n🔗 API should return:', apiResponse);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkPayPalSettings();