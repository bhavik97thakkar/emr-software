
const mongoose = require('mongoose');
require('dotenv').config();

const ADMIN_DB_URI = 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/medcore_admin?retryWrites=true&w=majority';

async function checkConfigs() {
  try {
    const conn = await mongoose.connect(ADMIN_DB_URI);
    const configs = await conn.connection.db.collection('configs').find({}).toArray();
    
    console.log('📋 Existing Tenant Configurations:');
    configs.forEach(c => {
      console.log(`- Clinic: ${c.clinicName}`);
      console.log(`  Email: ${c.email}`);
      console.log(`  TenantID: ${c.tenantId}`);
      console.log(`  isDemo: ${c.isDemo}`);
      console.log('---');
    });
    
    await conn.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkConfigs();
