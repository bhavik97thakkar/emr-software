/**
 * Clear Demo Database Script
 * Removes all data for demo@medcore.in tenant to start fresh
 */

const mongoose = require('mongoose');
require('dotenv').config();

const ADMIN_DB_URI = process.env.MONGO_URI || 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/medcore_admin?retryWrites=true&w=majority';
const TENANT_ID = 'demo@medcore.in';
const TENANT_DB_URI = `mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/emr_demo_medcore_in?retryWrites=true&w=majority`;

async function clearDemoDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect to admin DB to verify access
    const adminConn = await mongoose.connect(ADMIN_DB_URI);
    console.log('✓ Connected to Admin DB');
    
    // Connect to tenant DB
    const tenantConn = mongoose.createConnection(TENANT_DB_URI);
    
    tenantConn.on('connected', async () => {
      try {
        console.log(`\n🧹 Clearing all collections for tenant: ${TENANT_ID}\n`);
        
        const collections = [
          'patients',
          'visits',
          'appointments',
          'reports',
          'families',
          'customdiagnoses',
          'templates'
        ];
        
        let totalDeleted = 0;
        
        for (const collection of collections) {
          try {
            const result = await tenantConn.db.collection(collection).deleteMany({});
            const count = result.deletedCount;
            totalDeleted += count;
            console.log(`  ✓ ${collection}: ${count} documents deleted`);
          } catch (err) {
            console.log(`  ⚠️  ${collection}: ${err.message}`);
          }
        }
        
        console.log(`\n✅ Complete! Total deleted: ${totalDeleted} documents`);
        console.log('🎉 Database is now fresh for demo\n');
        
        await adminConn.disconnect();
        await tenantConn.close();
        process.exit(0);
      } catch (err) {
        console.error('Error during cleanup:', err);
        process.exit(1);
      }
    });
    
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

clearDemoDatabase();
