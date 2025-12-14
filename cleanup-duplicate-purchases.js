const Database = require('better-sqlite3');

console.log('🧹 Starting duplicate purchase cleanup...');

try {
  const db = new Database('beatbazaar.db');
  
  // Find duplicate purchases (same user + beat combination)
  const duplicates = db.prepare(`
    SELECT userId, beatId, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM purchases 
    GROUP BY userId, beatId 
    HAVING COUNT(*) > 1
  `).all();
  
  console.log(`Found ${duplicates.length} sets of duplicate purchases`);
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate purchases found!');
    db.close();
    process.exit(0);
  }
  
  let totalRemoved = 0;
  
  // For each set of duplicates, keep the oldest one and remove the rest
  for (const duplicate of duplicates) {
    const ids = duplicate.ids.split(',');
    console.log(`\n📋 User ${duplicate.userId} has ${duplicate.count} purchases for beat ${duplicate.beatId}`);
    
    // Get purchase details to decide which to keep
    const purchases = db.prepare(`
      SELECT id, purchasedAt, status 
      FROM purchases 
      WHERE id IN (${ids.map(() => '?').join(',')})
      ORDER BY purchasedAt ASC
    `).all(...ids);
    
    // Keep the first (oldest) purchase
    const toKeep = purchases[0];
    const toRemove = purchases.slice(1);
    
    console.log(`  ✅ Keeping purchase ${toKeep.id} (${toKeep.purchasedAt}, status: ${toKeep.status})`);
    
    // Remove duplicate purchases
    for (const purchase of toRemove) {
      console.log(`  ❌ Removing duplicate purchase ${purchase.id} (${purchase.purchasedAt}, status: ${purchase.status})`);
      
      // First, remove any associated payments
      const payments = db.prepare('SELECT id FROM payments WHERE purchaseId = ?').all(purchase.id);
      for (const payment of payments) {
        console.log(`    🗑️  Removing associated payment ${payment.id}`);
        db.prepare('DELETE FROM payments WHERE id = ?').run(payment.id);
      }
      
      // Then remove the purchase
      db.prepare('DELETE FROM purchases WHERE id = ?').run(purchase.id);
      totalRemoved++;
    }
  }
  
  console.log(`\n🎉 Cleanup completed! Removed ${totalRemoved} duplicate purchases.`);
  console.log('📝 Note: The library should now show unique beats only.');
  
  db.close();
} catch (error) {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
}