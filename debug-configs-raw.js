
const mongoose = require('mongoose');
require('dotenv').config();

const ADMIN_DB_URI = 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/medcore_admin?retryWrites=true&w=majority';

async function checkConfigsRaw() {
  try {
    const conn = await mongoose.connect(ADMIN_DB_URI);
    const configs = await conn.connection.db.collection('configs').find({}).toArray();
    
    console.log('📋 RAW Tenant Configurations:');
    console.log(JSON.stringify(configs, null, 2));
    
    await conn.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkConfigsRaw();
