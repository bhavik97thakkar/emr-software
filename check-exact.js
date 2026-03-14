
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/medcore_admin?appName=Cluster0';

async function checkExactCredentials() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Config = mongoose.connection.collection('configs');
        const allConfigs = await Config.find({}).toArray();

        console.log('--- EXACT DATABASE VALUES ---');
        allConfigs.forEach(c => {
            console.log(`Email: [${c.email}]`);
            console.log(`Password: [${c.password}]`);
            console.log('---------------------------');
        });
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkExactCredentials();
