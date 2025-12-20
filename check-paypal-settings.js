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
  process.exit(1);
}

const sql = postgres(connectionString);

async function checkPayPalSettings() {
  try {
    await sql`SELECT 1 as test`;
    // Check if paypal_settings table exists
    const tableExists = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'paypal_settings'
    `;

    if (tableExists.length === 0) {
      return;
    }

    // Get current PayPal settings
    const settings = await sql`SELECT * FROM paypal_settings`;
    
    if (settings.length === 0) {
      // Create default settings
      const newSettings = await sql`
        INSERT INTO paypal_settings (id, enabled, client_id, client_secret, sandbox, webhook_id, created_at, updated_at)
        VALUES (gen_random_uuid(), false, '', '', true, '', now(), now())
        RETURNING *
      `;
      } else {
      // Show what the API endpoint should return
      const apiResponse = {
        clientId: settings[0].client_id,
        enabled: settings[0].enabled,
        sandbox: settings[0].sandbox
      };
      }

  } catch (error) {
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkPayPalSettings();