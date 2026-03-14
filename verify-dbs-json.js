
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URI = 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net';

async function verifyDatabases() {
    const dbs = ['test', 'medcore_admin'];
    const results = {};

    for (const dbName of dbs) {
        const conn = await mongoose.createConnection(`${BASE_URI}/${dbName}?appName=Cluster0`).asPromise();
        try {
            const Config = conn.collection('configs');
            const docs = await Config.find({}).toArray();
            results[dbName] = docs.map(d => ({ email: d.email, tenantId: d.tenantId, clinic: d.clinicName }));
        } catch (err) {
            results[dbName] = `Error: ${err.message}`;
        } finally {
            await conn.close();
        }
    }
    console.log('START_JSON');
    console.log(JSON.stringify(results, null, 2));
    console.log('END_JSON');
    process.exit(0);
}

verifyDatabases();
