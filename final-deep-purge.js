
const { MongoClient } = require('mongodb');
require('dotenv').config();

const URI = 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'emr_dr_aarti';

async function finalDeepPurge() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    console.log(`🔄 Connecting to [${DB_NAME}] for Deep Purge...`);
    const db = client.db(DB_NAME);
    
    // Explicit list of all clinical collections
    const collections = [
      'patients', 
      'visits', 
      'appointments', 
      'reports', 
      'families', 
      'customdiagnoses', 
      'templates'
    ];
    
    console.log('🧹 Wiping all clinical records...');
    let totalDeleted = 0;
    
    for (const collName of collections) {
      const coll = db.collection(collName);
      const result = await coll.deleteMany({});
      console.log(`  ✓ ${collName.padEnd(20)} : ${result.deletedCount} documents deleted`);
      totalDeleted += result.deletedCount;
    }
    
    console.log(`\n✨ Deep Purge Complete! Total deleted: ${totalDeleted}`);
    console.log(`🚀 Database [${DB_NAME}] is now 100% EMPTY for the demo.`);
    
  } catch (err) {
    console.error('❌ Purge Error:', err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

finalDeepPurge();
