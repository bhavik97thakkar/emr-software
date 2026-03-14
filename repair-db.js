
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/medcore_admin?appName=Cluster0';

// Mock Schemas to trigger index creation
const schemas = {
    Patient: new mongoose.Schema({ mobile: { type: String, unique: true } }),
    Visit: new mongoose.Schema({ patientMobile: { type: String }, date: String }),
    Appointment: new mongoose.Schema({ id: { type: String, unique: true }, patientMobile: String, date: String }),
    Report: new mongoose.Schema({ id: { type: String, unique: true }, patientMobile: String }),
    Family: new mongoose.Schema({ id: { type: String, unique: true } }),
    CustomDiagnosis: new mongoose.Schema({ name: String }),
    Template: new mongoose.Schema({ id: String })
};

// Add the complex indexes we use in the real app
schemas.Visit.index({ patientMobile: 1, date: -1 });
schemas.Appointment.index({ date: 1 });

async function repair() {
    const tenants = ['dr_aarti', 'riddhi_test'];

    for (const tenantId of tenants) {
        console.log(`🔧 Repairing/Initializing structure for: ${tenantId}`);
        const dbName = `emr_${tenantId}`;
        const conn = await mongoose.createConnection(`${MONGODB_URI.split('?')[0].replace(/\/$/, '')}/${dbName}?${MONGODB_URI.split('?')[1] || ''}`).asPromise();

        try {
            for (const [name, schema] of Object.entries(schemas)) {
                const Model = conn.model(name, schema);
                await Model.createIndexes(); // Force index creation

                // Ensure even empty collections exist
                const count = await Model.countDocuments();
                if (count === 0) {
                    // We can't easily force an empty collection creation without a dummy insert/delete in some MongoDB versions
                    // but Mongoose usually handles this when indexes are created.
                    console.log(`   ✅ ${name}: Index synchronized.`);
                } else {
                    console.log(`   ✅ ${name}: ${count} docs found & indexed.`);
                }
            }
        } finally {
            await conn.close();
        }
    }
    console.log('✨ All tenant structures are now identical and optimized!');
    process.exit(0);
}

repair();
