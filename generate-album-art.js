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

// Generate URLs for each artist
sampleArtists.forEach((artist, index) => {
  });

// Generate a sample SQL insert script
sampleArtists.slice(0, 3).forEach((artist, index) => {
  const imageUrl = `https://source.unsplash.com/800x800/?music,${artist.genre.toLowerCase()}`;
  `);
  });
// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
