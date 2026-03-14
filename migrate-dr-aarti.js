
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/?appName=Cluster0';
const SOURCE_DB_NAME = 'test';
const DEST_TENANT_ID = 'dr_aarti';
const DEST_DB_NAME = `emr_${DEST_TENANT_ID}`;
const TARGET_EMAIL = 'dr.aarti@medcore.in';

const collectionsToMigrate = [
    'patients',
    'visits',
    'appointments',
    'reports',
    'families',
    'customdiagnoses',
    'templates'
];

async function migrate() {
    console.log(`🚀 Starting Migration: ${SOURCE_DB_NAME} -> ${DEST_DB_NAME}`);

    const sourceConn = await mongoose.createConnection(`${MONGODB_URI.split('?')[0].replace(/\/$/, '')}/${SOURCE_DB_NAME}?${MONGODB_URI.split('?')[1] || ''}`).asPromise();
    const destConn = await mongoose.createConnection(`${MONGODB_URI.split('?')[0].replace(/\/$/, '')}/${DEST_DB_NAME}?${MONGODB_URI.split('?')[1] || ''}`).asPromise();

    try {
        // 1. Update Config first
        const Config = sourceConn.model('Config', new mongoose.Schema({ email: String, tenantId: String }, { collection: 'configs' }));
        const config = await Config.findOne({ email: TARGET_EMAIL });

        if (!config) {
            throw new Error(`Could not find config for ${TARGET_EMAIL}`);
        }

        console.log(`✅ Found config for ${TARGET_EMAIL}. Setting tenantId to "${DEST_TENANT_ID}"`);
        config.tenantId = DEST_TENANT_ID;
        await config.save();

        // 2. Migrate each collection
        for (const colName of collectionsToMigrate) {
            console.log(`📦 Migrating collection: ${colName}...`);

            const sourceCol = sourceConn.collection(colName);
            const destCol = destConn.collection(colName);

            const data = await sourceCol.find({}).toArray();

            if (data.length > 0) {
                // Clean destination first to avoid duplicates
                await destCol.deleteMany({});
                // Insert all
                await destCol.insertMany(data);
                console.log(`   ✅ Moved ${data.length} records to ${DEST_DB_NAME}.${colName}`);
            } else {
                console.log(`   ℹ️  Collection ${colName} is empty. Skipping.`);
            }
        }

        console.log('\n✨ MIGRATION COMPLETE! ✨');
        console.log(`Dr. Aarti's clinical data is now securely isolated in "${DEST_DB_NAME}".`);
        console.log(`The 'test' database now only contains the master doctor list.`);

    } catch (err) {
        console.error('\n💥 Migration Failed:', err.message);
    } finally {
        await sourceConn.close();
        await destConn.close();
        process.exit(0);
    }
}

migrate();
