const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Available tables for clearing
const AVAILABLE_TABLES = [
  { name: 'users', description: 'User accounts and authentication' },
  { name: 'beats', description: 'Beat/track data and metadata' },
  { name: 'genres', description: 'Music genre categories' },
  { name: 'purchases', description: 'Purchase history and transactions' },
  { name: 'customers', description: 'Customer information and profiles' },
  { name: 'cart', description: 'Shopping cart items' },
  { name: 'payments', description: 'Payment records and processing' },
  { name: 'analytics', description: 'Usage analytics and statistics' },
  { name: 'verification', description: 'Email verification tokens' },
  { name: 'settings', description: 'Application settings and configuration' },
  { name: 'artists', description: 'Artist profiles and information' },
  { name: 'plans', description: 'Subscription plans and pricing' },
  { name: 'stripe_customers', description: 'Stripe customer data' },
  { name: 'home_settings', description: 'Homepage customization settings' }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

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
    const result = db.exec(`DELETE FROM ${tableName}`);
    return true;
  } catch (error) {
    if (error.message.includes('no such table')) {
      return false;
    }
    throw error;
  }
}

async function selectiveClear() {
  AVAILABLE_TABLES.forEach((table, index) => {
    });
  
  const answer = await question('\nEnter table numbers (comma-separated) or option: ');
  
  if (answer.trim() === '') {
    return;
  }
  
  const selections = answer.split(',').map(s => s.trim());
  const tablesToClear = [];
  let clearFiles = false;
  let clearAllTables = false;
  
  for (const selection of selections) {
    const num = parseInt(selection);
    
    if (num >= 1 && num <= AVAILABLE_TABLES.length) {
      tablesToClear.push(AVAILABLE_TABLES[num - 1].name);
    } else if (num === AVAILABLE_TABLES.length + 1) {
      clearFiles = true;
    } else if (num === AVAILABLE_TABLES.length + 2) {
      // Clear all
      clearAllTables = true;
      clearFiles = true;
      break;
    } else if (num === AVAILABLE_TABLES.length + 3) {
      // Database only
      clearAllTables = true;
      break;
    } else if (selection.toLowerCase() === 'all') {
      clearAllTables = true;
      clearFiles = true;
      break;
    } else if (selection.toLowerCase() === 'database-only') {
      clearAllTables = true;
      break;
    } else {
      }
  }
  
  if (clearAllTables) {
    tablesToClear.length = 0;
    tablesToClear.push(...AVAILABLE_TABLES.map(t => t.name));
  }
  
  if (tablesToClear.length === 0 && !clearFiles) {
    return;
  }
  
  // Confirmation
  if (clearFiles) {
    }
  
  if (tablesToClear.length > 0) {
    }
  
  const confirm = await question('\nAre you sure? This action cannot be undone! (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    return;
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
  
  }

async function fullClear() {
  const confirm = await question('\nAre you sure? Type "CLEAR ALL" to confirm: ');
  
  if (confirm !== 'CLEAR ALL') {
    return;
  }
  
  // Clear uploads folders
  clearUploads();
  
  // Clear database
  const db = new Database('beatbazaar.db');
  
  db.exec('PRAGMA foreign_keys = OFF');
  
  // Clear in dependency order
  const clearOrder = ['cart', 'payments', 'purchases', 'beats', 'customers', 'analytics', 'verification', 'genres', 'users', 'settings', 'artists', 'plans', 'stripe_customers', 'home_settings'];
  
  for (const tableName of clearOrder) {
    clearTable(db, tableName);
  }
  
  db.exec('PRAGMA foreign_keys = ON');
  
  db.close();
}

async function main() {
  try {
    const mode = await question('\nChoose clearing mode:\n1. Selective clear (choose specific tables/files)\n2. Full clear (everything)\n\nEnter choice (1 or 2): ');
    
    if (mode === '1') {
      await selectiveClear();
    } else if (mode === '2') {
      await fullClear();
    } else {
      }
    
  } catch (error) {
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
