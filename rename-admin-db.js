
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/?appName=Cluster0';
const SOURCE_DB = 'test';
const TARGET_DB = 'medcore_admin';

async function renameAdminDb() {
    console.log(`🏦 Professionalizing Admin Database: ${SOURCE_DB} -> ${TARGET_DB}`);

    const sourceConn = await mongoose.createConnection(`${MONGODB_URI.split('?')[0].replace(/\/$/, '')}/${SOURCE_DB}?${MONGODB_URI.split('?')[1] || ''}`).asPromise();
    const targetConn = await mongoose.createConnection(`${MONGODB_URI.split('?')[0].replace(/\/$/, '')}/${TARGET_DB}?${MONGODB_URI.split('?')[1] || ''}`).asPromise();

    try {
        const Config = sourceConn.collection('configs');
        const configs = await Config.find({}).toArray();

        if (configs.length > 0) {
            console.log(`📦 Moving ${configs.length} doctor accounts to ${TARGET_DB}...`);
            await targetConn.collection('configs').deleteMany({});
            await targetConn.collection('configs').insertMany(configs);
            console.log('✅ Doctor accounts moved successfully.');
        } else {
            console.log('⚠️ No doctor accounts found in the source database.');
        }

        console.log('\n✨ Database Professionalization Step 1 Complete!');
        console.log(`Your master doctor list now resides in "${TARGET_DB}".`);
        console.log(`You can now safely delete the entire "${SOURCE_DB}" database from MongoDB Atlas once we update the code.`);

    } catch (err) {
        console.error('\n❌ Error during renaming:', err.message);
    } finally {
        await sourceConn.close();
        await targetConn.close();
        process.exit(0);
    }
}

renameAdminDb();
