#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

function checkUsers() {
  const dbPath = path.join(__dirname, 'beatbazaar.db');
  
  try {
    const db = new Database(dbPath);
    
    // Check if users table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();
    
    if (tables.length === 0) {
      console.log('❌ Users table does not exist');
      console.log('🔧 Please run the application first to initialize the database:');
      console.log('   npm run dev');
      console.log('   Then visit http://localhost:5000/setup');
      return;
    }
    
    // Get all users
    const users = db.prepare('SELECT id, username, role, email, passwordChangeRequired, createdAt FROM users').all();
    
    console.log('👥 Users in database:');
    console.log('');
    
    if (users.length === 0) {
      console.log('   No users found');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.role})`);
        console.log(`   Email: ${user.email || 'Not set'}`);
        console.log(`   Password Change Required: ${user.passwordChangeRequired ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }
    
    // Check for admin users specifically
    const admins = users.filter(u => u.role === 'admin');
    console.log(`🔐 Admin users found: ${admins.length}`);
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('no such file')) {
      console.log('');
      console.log('🔧 Database file not found. Please run:');
      console.log('   npm run dev');
      console.log('   Then visit http://localhost:5000/setup');
    }
  }
}

checkUsers();