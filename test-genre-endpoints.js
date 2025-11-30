// Simple test script for genre-based beat fetching endpoints
const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('Testing Genre-Based Beat Fetching Endpoints\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Get all genres
    console.log('\n1. Testing GET /api/genres');
    const genresResponse = await fetch(`${BASE_URL}/api/genres`);
    const genres = await genresResponse.json();
    console.log(`   ✓ Found ${genres.length} active genres`);
    
    if (genres.length > 0) {
      const firstGenre = genres[0];
      console.log(`   First genre: ${firstGenre.name} (ID: ${firstGenre.id})`);

      // Test 2: Get beats by genre with limit
      console.log(`\n2. Testing GET /api/genres/${firstGenre.id}/beats?limit=5`);
      const genreBeatsResponse = await fetch(`${BASE_URL}/api/genres/${firstGenre.id}/beats?limit=5`);
      const genreBeats = await genreBeatsResponse.json();
      console.log(`   ✓ Found ${genreBeats.length} beats for genre "${firstGenre.name}" (limited to 5)`);

      // Test 3: Get beats by genre without limit
      console.log(`\n3. Testing GET /api/genres/${firstGenre.id}/beats (no limit)`);
      const allGenreBeatsResponse = await fetch(`${BASE_URL}/api/genres/${firstGenre.id}/beats`);
      const allGenreBeats = await allGenreBeatsResponse.json();
      console.log(`   ✓ Found ${allGenreBeats.length} total beats for genre "${firstGenre.name}"`);

      // Test 4: Get beats with genre filter
      console.log(`\n4. Testing GET /api/beats?genre=${firstGenre.id}`);
      const filteredBeatsResponse = await fetch(`${BASE_URL}/api/beats?genre=${firstGenre.id}`);
      const filteredBeats = await filteredBeatsResponse.json();
      console.log(`   ✓ Found ${filteredBeats.length} beats using genre filter`);
    }

    // Test 5: Get genres with beats
    console.log('\n5. Testing GET /api/genres-with-beats?limit=10');
    const genresWithBeatsResponse = await fetch(`${BASE_URL}/api/genres-with-beats?limit=10`);
    const genresWithBeats = await genresWithBeatsResponse.json();
    console.log(`   ✓ Found ${genresWithBeats.length} genres with beats`);
    
    if (genresWithBeats.length > 0) {
      genresWithBeats.forEach(item => {
        console.log(`   - ${item.genre.name}: ${item.beats.length} beats (preview), ${item.totalBeats} total`);
      });
    }

    // Test 6: Get all beats (no filter)
    console.log('\n6. Testing GET /api/beats (no filter)');
    const allBeatsResponse = await fetch(`${BASE_URL}/api/beats`);
    const allBeats = await allBeatsResponse.json();
    console.log(`   ✓ Found ${allBeats.length} total beats`);

    console.log('\n' + '='.repeat(50));
    console.log('All tests completed successfully! ✓\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testEndpoints();
