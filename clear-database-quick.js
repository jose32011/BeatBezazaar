const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Quick database clear utility - accepts command line arguments
// Usage examples:
//   node clear-database-quick.js --all                    (clear everything)
//   node clear-database-quick.js --tables users,beats     (clear specific tables)
//   node clear-database-quick.js --files                  (clear only upload files)
//   node clear-database-quick.js --database               (clear all tables, keep files)

const args = process.argv.slice(2);

function clearUploads() {
  const audioDir = path.join(__dirname, 'uploads', 'audio');
  const imagesDir = path.join(__dirname, 'uploads', 'images');
  
  let clearedFiles = 0;
  
  if (fs.existsSync(audioDir)) {
    const audioFiles = fs.readdirSync(audioDir);
    audioFiles.forEach(file => {
      fs.unlinkSync(path.join(audioDir, file));
    });
    clearedFiles += audioFiles.length;
    console.log(`✓ Cleared ${audioFiles.length} audio files`);
  }
  
  if (fs.existsSync(imagesDir)) {
    const imageFiles = fs.readdirSync(imagesDir);
    imageFiles.forEach(file => {
      fs.unlinkSync(path.join(imagesDir, file));
    });
    clearedFiles += imageFiles.length;
    console.log(`✓ Cleared ${imageFiles.length} image files`);
  }
  
  return clearedFiles;
}

function clearTable(db, tableName) {
  try {
    db.exec(`DELETE FROM ${tableName}`);
    console.log(`✓ Cleared ${tableName}`);
    return true;
  } catch (error) {
    if (error.message.includes('no such table')) {
      console.log(`⚠ Table '${tableName}' does not exist, skipping...`);
      return false;
    }
    throw error;
  }
}

function showUsage() {
  console.log('🗄️  BeatBazaar Quick Database Clear Utility');
  console.log('═'.repeat(45));
  console.log('\nUsage:');
  console.log('  node clear-database-quick.js [options]');
  console.log('\nOptions:');
  console.log('  --all                     Clear everything (database + files)');
  console.log('  --database               Clear all database tables only');
  console.log('  --files                  Clear upload files only');
  console.log('  --tables <table1,table2> Clear specific tables (comma-separated)');
  console.log('  --help                   Show this help message');
  console.log('\nAvailable tables:');
  console.log('  users, beats, genres, purchases, customers, cart, payments,');
  console.log('  analytics, verification, settings, artists, plans, stripe_customers, home_settings');
  console.log('\nExamples:');
  console.log('  node clear-database-quick.js --all');
  console.log('  node clear-database-quick.js --tables users,beats');
  console.log('  node clear-database-quick.js --files');
  console.log('  node clear-database-quick.js --database');
}

try {
  if (args.length === 0 || args.includes('--help')) {
    showUsage();
    process.exit(0);
  }

  console.log('🚀 Starting quick database clear...');

  let clearFiles = false;
  let tablesToClear = [];

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--all') {
      clearFiles = true;
      tablesToClear = ['cart', 'payments', 'purchases', 'beats', 'customers', 'analytics', 'verification', 'genres', 'users', 'settings', 'artists', 'plans', 'stripe_customers', 'home_settings'];
    } else if (arg === '--database') {
      tablesToClear = ['cart', 'payments', 'purchases', 'beats', 'customers', 'analytics', 'verification', 'genres', 'users', 'settings', 'artists', 'plans', 'stripe_customers', 'home_settings'];
    } else if (arg === '--files') {
      clearFiles = true;
    } else if (arg === '--tables') {
      if (i + 1 < args.length) {
        tablesToClear = args[i + 1].split(',').map(t => t.trim());
        i++; // Skip next argument as it's the table list
      } else {
        console.error('❌ Error: --tables requires a comma-separated list of table names');
        process.exit(1);
      }
    }
  }

  // Clear files if requested
  if (clearFiles) {
    console.log('\n📁 Clearing upload files...');
    clearUploads();
  }

  // Clear database tables if requested
  if (tablesToClear.length > 0) {
    console.log('\n🗄️  Clearing database tables...');
    const db = new Database('beatbazaar.db');
    
    db.exec('PRAGMA foreign_keys = OFF');
    
    let clearedTables = 0;
    for (const tableName of tablesToClear) {
      if (clearTable(db, tableName)) {
        clearedTables++;
      }
    }
    
    db.exec('PRAGMA foreign_keys = ON');
    db.close();
    
    console.log(`\n✅ Successfully cleared ${clearedTables} tables!`);
    
    if (tablesToClear.includes('users')) {
      console.log('📝 Note: You will need to restart the server to recreate the admin user.');
    }
  }

  if (!clearFiles && tablesToClear.length === 0) {
    console.log('❌ No clearing options specified. Use --help for usage information.');
    process.exit(1);
  }

  console.log('\n🎉 Quick clear completed successfully!');

} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}