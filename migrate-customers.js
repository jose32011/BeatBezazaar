const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Connect to database
const db = new Database('beatbazaar.db');

async function migrateCustomers() {
  try {
    console.log('Starting customer migration...');
    
    // Get all users
    const users = db.prepare('SELECT id, username, email, role FROM users').all();
    console.log('All users found:', users.length);
    console.log('Users:', users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role })));
    
    // Get all existing customers
    const existingCustomers = db.prepare('SELECT id, user_id, first_name, last_name, email FROM customers').all();
    console.log('Existing customers:', existingCustomers.length);
    console.log('Customers:', existingCustomers.map(c => ({ id: c.id, user_id: c.user_id, first_name: c.first_name, last_name: c.last_name, email: c.email })));
    
    // Find users without customers
    const usersWithoutCustomers = users.filter(user => 
      !existingCustomers.some(customer => customer.user_id === user.id)
    );
    
    console.log('Users without customers:', usersWithoutCustomers.length);
    console.log('Missing customers for:', usersWithoutCustomers.map(u => u.username));
    
    let createdCount = 0;
    for (const user of usersWithoutCustomers) {
      try {
        const customerData = {
          id: require('crypto').randomUUID(),
          user_id: user.id,
          first_name: user.username,
          last_name: "",
          email: user.email || "",
          phone: null,
          address: null,
          city: null,
          state: null,
          zip_code: null,
          country: null,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000)
        };
        
        const insertCustomer = db.prepare(`
          INSERT INTO customers (id, user_id, first_name, last_name, email, phone, address, city, state, zip_code, country, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        insertCustomer.run(
          customerData.id,
          customerData.user_id,
          customerData.first_name,
          customerData.last_name,
          customerData.email,
          customerData.phone,
          customerData.address,
          customerData.city,
          customerData.state,
          customerData.zip_code,
          customerData.country,
          customerData.created_at,
          customerData.updated_at
        );
        
        createdCount++;
        console.log(`✓ Created customer for user: ${user.username} (${user.id})`);
      } catch (error) {
        console.error(`✗ Failed to create customer for user ${user.username}:`, error.message);
      }
    }
    
    console.log(`\nMigration completed! Created ${createdCount} customer records.`);
    
    // Verify the results
    const finalCustomers = db.prepare('SELECT id, user_id, first_name, last_name, email FROM customers').all();
    console.log('\nFinal customer count:', finalCustomers.length);
    console.log('All customers:', finalCustomers.map(c => ({ id: c.id, user_id: c.user_id, first_name: c.first_name, last_name: c.last_name, email: c.email })));
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    db.close();
  }
}

migrateCustomers();
