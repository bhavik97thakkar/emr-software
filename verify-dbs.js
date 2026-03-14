
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URI = 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net';

async function verifyDatabases() {
    const dbs = ['test', 'medcore_admin'];

    for (const dbName of dbs) {
        console.log(`\n🔍 Checking Database: ${dbName}`);
        const conn = await mongoose.createConnection(`${BASE_URI}/${dbName}?appName=Cluster0`).asPromise();
        try {
            const Config = conn.collection('configs');
            const docs = await Config.find({}).toArray();
            if (docs.length === 0) {
                console.log('   Empty or missing configs collection.');
            } else {
                docs.forEach(d => {
                    console.log(`   Email: "${d.email}", TenantID: "${d.tenantId}", Clinic: "${d.clinicName}"`);
                });
            }
        } catch (err) {
            console.log(`   Error reading ${dbName}: ${err.message}`);
        } finally {
            await conn.close();
        }
    }
    process.exit(0);
}

verifyDatabases();
