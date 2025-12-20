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
    }
  
  if (fs.existsSync(imagesDir)) {
    const imageFiles = fs.readdirSync(imagesDir);
    imageFiles.forEach(file => {
      fs.unlinkSync(path.join(imagesDir, file));
    });
    clearedFiles += imageFiles.length;
    }
  
  return clearedFiles;
}

function clearTable(db, tableName) {
  try {
    db.exec(`DELETE FROM ${tableName}`);
    return true;
  } catch (error) {
    if (error.message.includes('no such table')) {
      return false;
    }
    throw error;
  }
}

function showUsage() {
  }

try {
  if (args.length === 0 || args.includes('--help')) {
    showUsage();
    process.exit(0);
  }

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
        process.exit(1);
      }
    }
  }

  // Clear files if requested
  if (clearFiles) {
    clearUploads();
  }

  // Clear database tables if requested
  if (tablesToClear.length > 0) {
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
    
    if (tablesToClear.includes('users')) {
      }
  }

  if (!clearFiles && tablesToClear.length === 0) {
    process.exit(1);
  }

  } catch (error) {
  process.exit(1);
}