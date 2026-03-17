
const mongoose = require('mongoose');
require('dotenv').config();

const ADMIN_DB_URI = 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/medcore_admin?retryWrites=true&w=majority';

async function checkAartiConfig() {
  try {
    const conn = await mongoose.connect(ADMIN_DB_URI);
    const config = await conn.connection.db.collection('configs').findOne({ email: 'dr.aarti@medcore.in' });
    
    console.log('📋 DR. AARTI CONFIG:');
    console.log(JSON.stringify(config, null, 2));
    
    await conn.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkAartiConfig();
