
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URI = 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net';
const TENANT_ID = 'riddhi_test';
const DB_NAME = `emr_${TENANT_ID}`;

async function testDeletionSync() {
    console.log(`🧪 Final Mirror Sync Verification: ${TENANT_ID}`);
    const conn = await mongoose.createConnection(`${BASE_URI}/${DB_NAME}?appName=Cluster0`).asPromise();

    try {
        const Template = conn.collection('templates');

        // 1. Get current IDs
        const current = await Template.find({}).toArray();
        const currentDiagnoses = current.map(t => t.diagnosis);
        console.log(`   Initial DB State: [${currentDiagnoses.join(', ')}]`);

        if (currentDiagnoses.length < 2) {
            console.log('   Warning: Not enough templates to test deletion.');
            return;
        }

        // 2. Simulate deleting the FIRST one
        const toDelete = currentDiagnoses[0];
        const incoming = currentDiagnoses.slice(1);
        console.log(`   Simulating sync AFTER deleting: "${toDelete}"`);
        console.log(`   Incoming Payload Diagnoses: [${incoming.join(', ')}]`);

        // This is what mirrorBatch does
        const deleteResult = await Template.deleteMany({ diagnosis: { $nin: incoming } });
        console.log(`   🗑️ Deleted ${deleteResult.deletedCount} items.`);

        // 3. Verify
        const remaining = await Template.find({}).toArray();
        const remainingDiagnoses = remaining.map(t => t.diagnosis);
        console.log(`   Final DB State: [${remainingDiagnoses.join(', ')}]`);

        if (!remainingDiagnoses.includes(toDelete) && remainingDiagnoses.length === incoming.length) {
            console.log('✅ PASS: Record correctly mirrored deletion.');
        } else {
            console.log('❌ FAIL: Record still exists or mismatch.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await conn.close();
        process.exit(0);
    }
}

testDeletionSync();
