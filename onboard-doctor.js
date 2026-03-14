
const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/medcore_admin?appName=Cluster0';

const ConfigSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    clinicName: { type: String, default: 'MedRecord Pro Clinic' },
    address: String,
    phone: String,
    isActive: { type: Boolean, default: true },
    tenantId: { type: String, sparse: true, unique: true }
});

const Config = mongoose.model('Config', ConfigSchema);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log('--- 🩺 MedCore Multi-tenant Onboarding Tool ---');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to Admin Database.');

        const email = await ask('1. Enter Doctor Email (Login): ');
        const password = await ask('2. Enter Password: ');
        const clinicName = await ask('3. Enter Clinic Name: ');
        const tenantId = await ask('4. Enter Unique Tenant ID (e.g. dr_sharma): ');

        const newDoctor = new Config({
            email,
            password,
            clinicName,
            tenantId: tenantId.toLowerCase().replace(/[^a-z0-9_]/g, '_')
        });

        await newDoctor.save();
        console.log('\n🎉 SUCCESS!');
        console.log(`Doctor ${email} has been onboarded.`);
        console.log(`Tenant Database: emr_${newDoctor.tenantId}`);
        console.log('The database will be created automatically upon their first login.');

    } catch (err) {
        console.error('\n❌ ERROR:', err.message);
    } finally {
        rl.close();
        mongoose.connection.close();
    }
}

main();
