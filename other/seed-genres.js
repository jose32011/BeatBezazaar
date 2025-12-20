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
  // First, login as admin to get authentication
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
  // Create each genre
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
        successCount++;
      } else {
        const error = await response.text();
        errorCount++;
      }
    } catch (error) {
      errorCount++;
    }
  }

  if (errorCount > 0) {
    }
  }

// Run the seeding
seedGenres().catch(error => {
  process.exit(1);
});
