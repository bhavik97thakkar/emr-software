/**
 * Clear Dr. Aarti Database Only
 * Removes all data from emr_dr_aarti database for fresh demo
 */

const mongoose = require('mongoose');
require('dotenv').config();

const AARTI_DB_URI = 'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/emr_dr_aarti?retryWrites=true&w=majority';

// Define schemas
const patientSchema = new mongoose.Schema({}, { strict: false });
const visitSchema = new mongoose.Schema({}, { strict: false });
const appointmentSchema = new mongoose.Schema({}, { strict: false });
const reportSchema = new mongoose.Schema({}, { strict: false });
const familySchema = new mongoose.Schema({}, { strict: false });
const diagnosisSchema = new mongoose.Schema({}, { strict: false });
const templateSchema = new mongoose.Schema({}, { strict: false });

async function clearAartiDatabase() {
  try {
    console.log('🔄 Connecting to Dr. Aarti Database...\n');
    
    const conn = await mongoose.connect(AARTI_DB_URI);
    console.log('✓ Connected to emr_dr_aarti database\n');
    
    // Define models
    const models = {
      'patients': conn.model('Patient', patientSchema, 'patients'),
      'visits': conn.model('Visit', visitSchema, 'visits'),
      'appointments': conn.model('Appointment', appointmentSchema, 'appointments'),
      'reports': conn.model('Report', reportSchema, 'reports'),
      'families': conn.model('Family', familySchema, 'families'),
      'customdiagnoses': conn.model('CustomDiagnosis', diagnosisSchema, 'customdiagnoses'),
      'templates': conn.model('Template', templateSchema, 'templates')
    };
    
    console.log('🧹 Clearing all collections...\n');
    let totalDeleted = 0;
    
    for (const [name, Model] of Object.entries(models)) {
      try {
        const result = await Model.deleteMany({});
        const count = result.deletedCount;
        totalDeleted += count;
        console.log(`  ✓ ${name.padEnd(20)} : ${count} documents deleted`);
      } catch (err) {
        console.log(`  ℹ️  ${name.padEnd(20)} : ${err.message}`);
      }
    }
    
    console.log(`\n✅ Complete!`);
    console.log(`📊 Total documents deleted: ${totalDeleted}`);
    console.log('🎉 Dr. Aarti database is now FRESH for demo\n');
    
    await conn.disconnect();
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

clearAartiDatabase();
