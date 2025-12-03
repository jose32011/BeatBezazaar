const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('Starting manual database clear...');

try {
  // Clear uploads folders
  const audioDir = path.join(__dirname, 'uploads', 'audio');
  const imagesDir = path.join(__dirname, 'uploads', 'images');
  
  if (fs.existsSync(audioDir)) {
    const audioFiles = fs.readdirSync(audioDir);
    audioFiles.forEach(file => {
      fs.unlinkSync(path.join(audioDir, file));
    });
    console.log(`✓ Cleared ${audioFiles.length} audio files`);
  }
  
  if (fs.existsSync(imagesDir)) {
    const imageFiles = fs.readdirSync(imagesDir);
    imageFiles.forEach(file => {
      fs.unlinkSync(path.join(imagesDir, file));
    });
    console.log(`✓ Cleared ${imageFiles.length} image files`);
  }
  
  // Clear database
  const db = new Database('beatbazaar.db');
  
  db.exec('PRAGMA foreign_keys = OFF');
  
  db.exec('DELETE FROM cart');
  console.log('✓ Cleared cart');
  
  db.exec('DELETE FROM payments');
  console.log('✓ Cleared payments');
  
  db.exec('DELETE FROM purchases');
  console.log('✓ Cleared purchases');
  
  db.exec('DELETE FROM beats');
  console.log('✓ Cleared beats');
  
  db.exec('DELETE FROM customers');
  console.log('✓ Cleared customers');
  
  db.exec('DELETE FROM analytics');
  console.log('✓ Cleared analytics');
  
  db.exec('DELETE FROM genres');
  console.log('✓ Cleared genres');
  
  db.exec('DELETE FROM users');
  console.log('✓ Cleared users');
  
  db.exec('PRAGMA foreign_keys = ON');
  
  console.log('✅ Database cleared successfully!');
  console.log('Note: You will need to restart the server to recreate the admin user.');
  
  db.close();
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
