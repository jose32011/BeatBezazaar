// Script to seed initial genres into the database
const BASE_URL = 'http://localhost:3000';

// Sample genres to create
const genres = [
  {
    name: 'Hip-Hop',
    description: 'Classic hip-hop beats with hard-hitting drums and smooth samples',
    color: '#FF6B6B',
    imageUrl: 'https://via.placeholder.com/300x300/FF6B6B/ffffff?text=Hip-Hop',
    isActive: true
  },
  {
    name: 'Trap',
    description: 'Modern trap beats with 808s and hi-hats',
    color: '#4ECDC4',
    imageUrl: 'https://via.placeholder.com/300x300/4ECDC4/ffffff?text=Trap',
    isActive: true
  },
  {
    name: 'R&B',
    description: 'Smooth R&B instrumentals perfect for vocals',
    color: '#95E1D3',
    imageUrl: 'https://via.placeholder.com/300x300/95E1D3/ffffff?text=R%26B',
    isActive: true
  },
  {
    name: 'Lo-Fi',
    description: 'Chill lo-fi beats for studying and relaxing',
    color: '#F38181',
    imageUrl: 'https://via.placeholder.com/300x300/F38181/ffffff?text=Lo-Fi',
    isActive: true
  },
  {
    name: 'Drill',
    description: 'Dark and aggressive drill beats',
    color: '#AA96DA',
    imageUrl: 'https://via.placeholder.com/300x300/AA96DA/ffffff?text=Drill',
    isActive: true
  },
  {
    name: 'Pop',
    description: 'Catchy pop instrumentals with modern production',
    color: '#FCBAD3',
    imageUrl: 'https://via.placeholder.com/300x300/FCBAD3/ffffff?text=Pop',
    isActive: true
  }
];

async function seedGenres() {
  console.log('🌱 Seeding genres into the database...\n');
  console.log('='.repeat(50));

  // First, login as admin to get authentication
  console.log('\n1. Logging in as admin...');
  const loginResponse = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    }),
    credentials: 'include'
  });

  if (!loginResponse.ok) {
    throw new Error('Failed to login as admin. Make sure the server is running and admin credentials are correct.');
  }

  // Get the session cookie
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('   ✓ Logged in successfully');

  // Create each genre
  console.log('\n2. Creating genres...');
  let successCount = 0;
  let errorCount = 0;

  for (const genre of genres) {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/genres`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies || ''
        },
        body: JSON.stringify(genre),
        credentials: 'include'
      });

      if (response.ok) {
        const created = await response.json();
        console.log(`   ✓ Created genre: ${created.name} (${created.color})`);
        successCount++;
      } else {
        const error = await response.text();
        console.log(`   ✗ Failed to create ${genre.name}: ${error}`);
        errorCount++;
      }
    } catch (error) {
      console.log(`   ✗ Error creating ${genre.name}: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ Seeding complete!`);
  console.log(`   - Successfully created: ${successCount} genres`);
  if (errorCount > 0) {
    console.log(`   - Failed: ${errorCount} genres`);
  }
  console.log('\nYou can now visit /music to see the genres!\n');
}

// Run the seeding
seedGenres().catch(error => {
  console.error('\n❌ Seeding failed:', error.message);
  console.error('\nMake sure:');
  console.error('  1. The server is running (npm run dev)');
  console.error('  2. Admin user exists with username: admin, password: admin123');
  console.error('  3. The database is properly configured\n');
  process.exit(1);
});
