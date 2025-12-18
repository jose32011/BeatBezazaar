const bcrypt = require('bcrypt');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { users } = require('./shared/schema.ts');
const { eq } = require('drizzle-orm');

async function resetAdminPassword() {
  try {
    // Connect to database
    const sqlite = new Database('./beatbazaar.db');
    const db = drizzle(sqlite);

    // New password (change this to whatever you want)
    const newPassword = 'admin123';
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin user password
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        passwordChangeRequired: false
      })
      .where(eq(users.role, 'admin'))
      .returning();

    if (result.length > 0) {
      console.log('✅ Admin password reset successfully!');
      console.log(`📧 Username: ${result[0].username}`);
      console.log(`🔑 New Password: ${newPassword}`);
      console.log('');
      console.log('You can now login with these credentials.');
      console.log('⚠️  Remember to change the password after logging in!');
    } else {
      console.log('❌ No admin user found in database');
      
      // Create a new admin user if none exists
      console.log('Creating new admin user...');
      
      const newAdmin = await db
        .insert(users)
        .values({
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
          email: 'admin@beatbazaar.com',
          passwordChangeRequired: false
        })
        .returning();

      console.log('✅ New admin user created!');
      console.log(`📧 Username: ${newAdmin[0].username}`);
      console.log(`🔑 Password: ${newPassword}`);
      console.log(`📬 Email: ${newAdmin[0].email}`);
    }

    sqlite.close();
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    
    if (error.message.includes('no such table')) {
      console.log('');
      console.log('🔧 Database tables not found. Please run the setup first:');
      console.log('   npm run setup');
    }
  }
}

// Run the script
resetAdminPassword();