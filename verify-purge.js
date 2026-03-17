
const mongoose = require('mongoose');
require('dotenv').config();

const AARTI_DB_URI = 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/emr_dr_aarti?retryWrites=true&w=majority';

async function verifyEmpty() {
  try {
    const conn = await mongoose.connect(AARTI_DB_URI);
    const collections = ['patients', 'visits', 'appointments', 'reports', 'families', 'customdiagnoses', 'templates'];
    
    console.log('📊 Current Collection Counts:');
    for (const coll of collections) {
      const count = await conn.connection.db.collection(coll).countDocuments();
      console.log(`  - ${coll}: ${count}`);
    }
    
    await conn.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

verifyEmpty();
