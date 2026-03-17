
const mongoose = require('mongoose');
require('dotenv').config();

const ADMIN_DB_URI = 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/medcore_admin?retryWrites=true&w=majority';

async function listDbs() {
  try {
    const conn = await mongoose.connect(ADMIN_DB_URI);
    const admin = conn.connection.db.admin();
    const dbs = await admin.listDatabases();
    
    console.log('📂 Databases in Cluster:');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
    
    await conn.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listDbs();
