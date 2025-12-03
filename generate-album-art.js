#!/usr/bin/env node

/**
 * Album Art Generator Script
 * 
 * This script helps you generate placeholder album art or download from free sources
 * 
 * Usage:
 *   node generate-album-art.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample artists and genres for placeholder generation
const sampleArtists = [
  { name: 'DJ Shadow', genre: 'Hip-Hop', style: 'dark' },
  { name: 'Daft Punk', genre: 'Electronic', style: 'futuristic' },
  { name: 'Kendrick Lamar', genre: 'Hip-Hop', style: 'urban' },
  { name: 'Flume', genre: 'Electronic', style: 'colorful' },
  { name: 'Travis Scott', genre: 'Trap', style: 'psychedelic' },
  { name: 'Skrillex', genre: 'Dubstep', style: 'energetic' },
  { name: 'Marshmello', genre: 'EDM', style: 'playful' },
  { name: 'Metro Boomin', genre: 'Trap', style: 'dark' },
  { name: 'Diplo', genre: 'Electronic', style: 'tropical' },
  { name: 'Zedd', genre: 'EDM', style: 'bright' },
];

// Free image sources
const imageSources = {
  unsplash: 'https://source.unsplash.com/800x800/?music,abstract,{genre}',
  picsum: 'https://picsum.photos/800/800',
  placeholder: 'https://via.placeholder.com/800x800/1a1a1a/ffffff?text={artist}',
};

console.log('🎨 Album Art Generator\n');
console.log('Options:');
console.log('1. Generate placeholder URLs');
console.log('2. Use Unsplash random images');
console.log('3. Use Lorem Picsum random images');
console.log('4. Create custom gradient placeholders');
console.log('\n');

// Generate URLs for each artist
console.log('📸 Sample Album Art URLs:\n');

sampleArtists.forEach((artist, index) => {
  console.log(`${index + 1}. ${artist.name} (${artist.genre})`);
  console.log(`   Unsplash: ${imageSources.unsplash.replace('{genre}', artist.genre.toLowerCase())}`);
  console.log(`   Placeholder: ${imageSources.placeholder.replace('{artist}', encodeURIComponent(artist.name))}`);
  console.log('');
});

console.log('\n🎯 Recommended Free Resources:\n');
console.log('1. Unsplash API: https://unsplash.com/developers');
console.log('   - Free tier: 50 requests/hour');
console.log('   - High-quality images');
console.log('');
console.log('2. Pexels API: https://www.pexels.com/api/');
console.log('   - Free tier: 200 requests/hour');
console.log('   - Curated photos');
console.log('');
console.log('3. Pixabay API: https://pixabay.com/api/docs/');
console.log('   - Free tier: 5,000 requests/hour');
console.log('   - Large library');
console.log('');
console.log('4. AI Image Generation:');
console.log('   - Bing Image Creator (free): https://www.bing.com/images/create');
console.log('   - Leonardo.ai (free tier): https://leonardo.ai');
console.log('   - Playground AI (free tier): https://playgroundai.com');
console.log('');

// Generate a sample SQL insert script
console.log('\n📝 Sample SQL for inserting beats with album art:\n');
console.log('```sql');
sampleArtists.slice(0, 3).forEach((artist, index) => {
  const imageUrl = `https://source.unsplash.com/800x800/?music,${artist.genre.toLowerCase()}`;
  console.log(`INSERT INTO beats (id, title, producer, bpm, genre, price, image_url, audio_url, created_at)`);
  console.log(`VALUES ('${generateUUID()}', '${artist.genre} Beat ${index + 1}', '${artist.name}', ${120 + index * 10}, '${artist.genre}', ${29.99 + index * 10}, '${imageUrl}', '/audio/sample${index + 1}.mp3', CURRENT_TIMESTAMP);`);
  console.log('');
});
console.log('```\n');

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

console.log('💡 Tips:');
console.log('- Use consistent image dimensions (800x800 recommended)');
console.log('- Compress images for web (use tinypng.com or squoosh.app)');
console.log('- Consider using a CDN for better performance');
console.log('- Always check licensing for commercial use');
console.log('');

// Create a sample beats data file
const sampleBeats = sampleArtists.map((artist, index) => ({
  id: generateUUID(),
  title: `${artist.genre} Beat ${index + 1}`,
  producer: artist.name,
  bpm: 120 + index * 5,
  genre: artist.genre,
  price: 29.99 + index * 5,
  imageUrl: `https://source.unsplash.com/800x800/?music,${artist.genre.toLowerCase()}`,
  audioUrl: `/audio/sample${index + 1}.mp3`,
}));

// Save to JSON file
const outputPath = path.join(__dirname, 'sample-beats.json');
fs.writeFileSync(outputPath, JSON.stringify(sampleBeats, null, 2));
console.log(`✅ Sample beats data saved to: ${outputPath}\n`);

console.log('🚀 Next Steps:');
console.log('1. Choose your image source (Unsplash, Pexels, or AI generation)');
console.log('2. Download or generate images');
console.log('3. Upload to your server or use URLs directly');
console.log('4. Update your database with image URLs');
console.log('5. Test in your application');
console.log('');
