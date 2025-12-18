#!/usr/bin/env node

const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');

async function resetAdmin() {
  const dbPath = path.join(__dirname, 'beatbazaar.db');
  
  try {
    const db = new Database(dbPath);
    
    // New admin credentials
    const username = 'admin';
    const password = 'admin123';
    const email = 'admin@beatbazaar.com';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if admin exists
    const existingAdmin = db.prepare('SELECT * FROM users WHERE role = ? OR username = ?').get('admin', 'admin');
    
    if (existingAdmin) {
      // Update existing admin
      const updateStmt = db.prepare(`
        UPDATE users 
        SET password = ?, passwordChangeRequired = 0, email = ?
        WHERE id = ?
      `);
      
      updateStmt.run(hashedPassword, email, existingAdmin.id);
      console.log('✅ Admin password reset successfully!');
    } else {
      // Create new admin
      const insertStmt = db.prepare(`
        INSERT INTO users (id, username, password, role, email, passwordChangeRequired, theme, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const now = new Date().toISOString();
      const adminId = 'admin-' + Date.now();
      
      insertStmt.run(
        adminId,
        username,
        hashedPassword,
        'admin',
        email,
        0, // passwordChangeRequired = false
        'original',
        now,
        now
      );
      
      console.log('✅ New admin user created!');
    }
    
    console.log('');
    console.log('🔐 Admin Login Credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Email: ${email}`);
    console.log('');
    console.log('⚠️  Please change the password after logging in!');
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('no such table: users')) {
      console.log('');
      console.log('🔧 Database not initialized. Please run:');
      console.log('   npm run dev');
      console.log('   Then visit http://localhost:5000/setup');
    } else if (error.message.includes('no such file')) {
      console.log('');
      console.log('🔧 Database file not found. Please run:');
      console.log('   npm run dev');
      console.log('   Then visit http://localhost:5000/setup');
    }
  }
}

resetAdmin();