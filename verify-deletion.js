
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URI = 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net';
const TENANT_ID = 'riddhi_test';
const DB_NAME = `emr_${TENANT_ID}`;

async function testDeletionSync() {
    console.log(`🧪 Testing Deletion Sync for tenant: ${TENANT_ID}`);
    const conn = await mongoose.createConnection(`${BASE_URI}/${DB_NAME}?appName=Cluster0`).asPromise();

    try {
        const Template = conn.collection('templates');

        // 1. Check current state
        const before = await Template.find({}).toArray();
        console.log(`   Templates before sync: ${before.length} (${before.map(t => t.diagnosis).join(', ')})`);

        // 2. Simulate what mirrorBatch does
        // Suppose the incoming payload ONLY has "Cold & Cough" and "Diabetes" (meaning "Fever" was deleted)
        const incoming = ["Cold & Cough", "Diabetes ..."]; // Diabetes had three dots in screenshot

        console.log(`   Simulating sync with ONLY: ${incoming.join(', ')}`);

        const deleteResult = await Template.deleteMany({ diagnosis: { $nin: incoming } });
        console.log(`   🗑️ Deleted ${deleteResult.deletedCount} items missing from payload.`);

        // 3. Check final state
        const after = await Template.find({}).toArray();
        console.log(`   Templates after sync: ${after.length} (${after.map(t => t.diagnosis).join(', ')})`);

        if (after.length === incoming.length) {
            console.log('✅ Mirror Sync Verification PASSED');
        } else {
            console.log('❌ Mirror Sync Verification FAILED');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await conn.close();
        process.exit(0);
    }
}

testDeletionSync();
