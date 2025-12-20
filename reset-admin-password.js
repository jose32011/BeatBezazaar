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
      } else {
      // Create a new admin user if none exists
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

      }

    sqlite.close();
  } catch (error) {
    if (error.message.includes('no such table')) {
      }
  }
}

// Run the script
resetAdminPassword();