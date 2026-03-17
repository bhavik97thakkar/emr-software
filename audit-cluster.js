
const { MongoClient } = require('mongodb');
require('dotenv').config();

const URI = 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/?retryWrites=true&w=majority';

async function auditCluster() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const admin = client.db().admin();
    const { databases } = await admin.listDatabases();
    
    console.log('🔍 FULL CLUSTER AUDIT:');
    for (const dbInfo of databases) {
      const dbName = dbInfo.name;
      if (['admin', 'local', 'config'].includes(dbName)) continue;
      
      console.log(`\n📂 Database: [${dbName}]`);
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      
      if (collections.length === 0) {
        console.log('  (Empty)');
        continue;
      }

      for (const coll of collections) {
        const count = await db.collection(coll.name).countDocuments();
        console.log(`  - ${coll.name.padEnd(20)} : ${count} docs`);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
}

auditCluster();
