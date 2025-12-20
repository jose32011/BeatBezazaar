#!/usr/bin/env node

/**
 * Database schema checker for BeatBazaar
 * This script compares the actual database schema with the expected schema
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

// Expected schema for each table
const expectedSchema = {
  users: ['id', 'username', 'password', 'role', 'email', 'theme', 'password_change_required', 'created_at', 'updated_at'],
  genres: ['id', 'name', 'description', 'color', 'image_url', 'is_active', 'created_at', 'updated_at'],
  beats: ['id', 'title', 'producer', 'bpm', 'genre', 'price', 'image_url', 'audio_url', 'is_exclusive', 'is_hidden', 'created_at'],
  customers: ['id', 'user_id', 'first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state', 'zip_code', 'country', 'created_at', 'updated_at'],
  purchases: ['id', 'user_id', 'beat_id', 'beat_title', 'beat_producer', 'beat_audio_url', 'beat_image_url', 'price', 'is_exclusive', 'status', 'purchased_at', 'approved_at', 'approved_by', 'notes'],
  cart: ['id', 'user_id', 'beat_id', 'added_at'],
  payments: ['id', 'purchase_id', 'customer_id', 'amount', 'payment_method', 'status', 'transaction_id', 'bank_reference', 'notes', 'approved_by', 'approved_at', 'created_at', 'updated_at'],
  analytics: ['id', 'site_visits', 'total_downloads', 'updated_at'],
  verification_codes: ['id', 'user_id', 'code', 'type', 'expires_at', 'used', 'created_at'],
  home_settings: ['id', 'title', 'description', 'feature1', 'feature2', 'feature3', 'image_url', 'updated_at']
};

async function checkSchema() {
  try {
    await sql`SELECT 1 as test`;
    let allGood = true;

    for (const [tableName, expectedColumns] of Object.entries(expectedSchema)) {
      // Check if table exists
      const tableExists = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = ${tableName}
      `;

      if (tableExists.length === 0) {
        allGood = false;
        continue;
      }

      // Get actual columns
      const actualColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position
      `;

      const actualColumnNames = actualColumns.map(col => col.column_name);
      
      // Check for missing columns
      const missingColumns = expectedColumns.filter(col => !actualColumnNames.includes(col));
      const extraColumns = actualColumnNames.filter(col => !expectedColumns.includes(col));

      if (missingColumns.length > 0) {
        allGood = false;
      }

      if (extraColumns.length > 0) {
        }

      if (missingColumns.length === 0 && extraColumns.length === 0) {
        }

      }

    if (allGood) {
      } else {
      }

    // Show table counts
    for (const tableName of Object.keys(expectedSchema)) {
      try {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
        } catch (error) {
        }
    }

  } catch (error) {
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkSchema();