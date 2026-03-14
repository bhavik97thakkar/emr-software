require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// CORS Configuration for deployment
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://emr-aarti.netlify.app',
    'https://*.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' }));

// ════════════════════════════════════════════════════════════
//  DATABASE CONNECTION (ADMIN)
// ════════════════════════════════════════════════════════════
const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/medcore_admin?appName=Cluster0';

// The main connection is used ONLY for the 'Configs' collection (Auth)
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MedRecord Pro: Admin Connected to MongoDB Atlas'))
  .catch(err => { console.error('❌ Admin DB connection failed:', err.message); process.exit(1); });

// ════════════════════════════════════════════════════════════
//  TENANT CONNECTION MANAGER
// ════════════════════════════════════════════════════════════
const tenantConnections = {};

/** 
 * Get or create a specific connection for a tenant.
 * This ensures Dr. Aarti's data is in 'emr_draarti' and Dr. Sharma is in 'emr_drsharma'.
 */
const getTenantDb = (tenantId) => {
  if (tenantConnections[tenantId]) return tenantConnections[tenantId];

  // Derive the database name from the tenantId
  const dbName = `emr_${tenantId.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Use the same base URI but switch the database
  const connectionUri = MONGODB_URI.includes('?')
    ? MONGODB_URI.replace(/\/[^/?]+\?/, `/${dbName}?`)
    : `${MONGODB_URI.replace(/\/$/, '')}/${dbName}`;

  const conn = mongoose.createConnection(connectionUri, {
    maxPoolSize: 10,
    minPoolSize: 2
  });
  tenantConnections[tenantId] = conn;
  console.log(`☁️  Created dedicated connection for tenant: ${tenantId} (${dbName})`);
  return conn;
};

// ════════════════════════════════════════════════════════════
//  SHARED SCHEMAS (Defined once, bound to connections later)
// ════════════════════════════════════════════════════════════

const MedicineSchema = new mongoose.Schema({
  id: String,
  name: { type: String, required: true },
  dosage: String,
  frequency: String,
  duration: Number,
  instructions: String
}, { _id: false });

const VitalsSchema = new mongoose.Schema({
  weight: Number,
  height: Number,
  bmi: Number,
  temp: Number,
  pulse: Number,
  bp_sys: Number,
  bp_dia: Number,
  spo2: Number,
  respRate: Number
}, { _id: false });

const FamilyMemberSchema = new mongoose.Schema({
  mobile: { type: String, required: true },
  relationship: String
}, { _id: false });

const FamilySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  members: { type: [FamilyMemberSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});
FamilySchema.index({ 'members.mobile': 1 });

const PatientSchema = new mongoose.Schema({
  mobile: { type: String, required: true, unique: true },
  name: String,
  age: Number,
  dob: String,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: String,
  occupation: String,
  address: String,
  area: String,
  city: String,
  state: String,
  pin: String,
  country: String,
  email: String,
  allergyOther: String,
  allergyMedicine: String,
  habits: { smoke: String, alcohol: String, drugAbuse: String },
  referredBy: String,
  createdDate: String,
  familyId: { type: String, default: null },
  pastHistoryNotes: String,
  updatedAt: { type: Date, default: Date.now }
});
PatientSchema.index({ familyId: 1 });
PatientSchema.index({ name: 1, mobile: 1 });

const VisitSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientMobile: { type: String, required: true },
  date: String,
  diagnosis: String,
  medicines: { type: [MedicineSchema], default: [] },
  reportsOrdered: { type: [String], default: [] },
  reportIds: { type: [String], default: [] },
  amount: Number,
  paymentMethod: { type: String, enum: ['Cash', 'GPay', 'UPI', 'Card', 'Due Payment'] },
  paymentStatus: { type: String, enum: ['Paid', 'Pending'] },
  prescriptionNotes: String,
  existingMedicines: String,
  vitals: { type: VitalsSchema, default: null },
  updatedAt: { type: Date, default: Date.now }
});
VisitSchema.index({ patientMobile: 1 });
VisitSchema.index({ patientMobile: 1, date: -1 });
VisitSchema.index({ date: -1 });

const AppointmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientMobile: { type: String, required: true },
  date: String,
  time: String,
  reason: String,
  status: { type: String, enum: ['Scheduled', 'Completed', 'Missed', 'Cancelled'] },
  updatedAt: { type: Date, default: Date.now }
});
AppointmentSchema.index({ patientMobile: 1 });
AppointmentSchema.index({ date: 1 });
AppointmentSchema.index({ date: 1, status: 1 });

const ReportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientMobile: { type: String, required: true },
  type: { type: String, enum: ['Lab', 'Xray', 'Prescription', 'Other', 'Past Record'] },
  description: String,
  date: String,
  fileName: String,
  fileData: String,
  updatedAt: { type: Date, default: Date.now }
});
ReportSchema.index({ patientMobile: 1 });
ReportSchema.index({ patientMobile: 1, date: -1 });

const CustomDiagnosisSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  updatedAt: { type: Date, default: Date.now }
});

const TemplateSchema = new mongoose.Schema({
  diagnosis: { type: String, required: true, unique: true },
  defaultMedicines: { type: [MedicineSchema], default: [] },
  defaultReports: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

/** 
 * Function to bind schemas to a specific connection and return models.
 */
const getTenantModels = (conn) => {
  return {
    Patient: conn.models.Patient || conn.model('Patient', PatientSchema),
    Visit: conn.models.Visit || conn.model('Visit', VisitSchema),
    Family: conn.models.Family || conn.model('Family', FamilySchema),
    Appointment: conn.models.Appointment || conn.model('Appointment', AppointmentSchema),
    Report: conn.models.Report || conn.model('Report', ReportSchema),
    CustomDiagnosis: conn.models.CustomDiagnosis || conn.model('CustomDiagnosis', CustomDiagnosisSchema),
    Template: conn.models.Template || conn.model('Template', TemplateSchema)
  };
};

// ════════════════════════════════════════════════════════════
//  ADMIN MODELS
// ════════════════════════════════════════════════════════════
const ConfigSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  clinicName: { type: String, default: 'MedRecord Pro Clinic' },
  address: String,
  phone: String,
  isActive: { type: Boolean, default: true },
  tenantId: { type: String, sparse: true, unique: true } // sparse allows multiple nulls during migration
});
const Config = mongoose.model('Config', ConfigSchema);

// ════════════════════════════════════════════════════════════
//  MIDDLEWARE
// ════════════════════════════════════════════════════════════

const verifyAccess = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Session Expired' });

  try {
    const config = await Config.findOne({ email: token });
    if (!config || !config.isActive) return res.status(403).json({ error: 'Unauthorized Access' });

    // Attach tenant info to request
    // Fallback to email if tenantId is missing (for legacy accounts)
    req.tenantId = config.tenantId || config.email;
    const conn = getTenantDb(req.tenantId);
    req.models = getTenantModels(conn);

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(500).json({ error: 'Internal Server Error during auth' });
  }
};

// ════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════

function stripMeta(doc) {
  const { _id, __v, updatedAt, ...rest } = (doc.toObject ? doc.toObject() : doc);
  return rest;
}

async function mirrorBatch(Model, items, pkField) {
  if (!items) return 0;

  // 1. Perform Upserts
  if (items.length > 0) {
    const ops = items.map(item => ({
      updateOne: {
        filter: { [pkField]: item[pkField] },
        update: { $set: { ...item, updatedAt: new Date() } },
        upsert: true
      }
    }));
    await Model.bulkWrite(ops, { ordered: false });
  }

  // 2. Perform Deletions (Mirroring: Delete everything NOT in the incoming list)
  const incomingIds = items.map(item => item[pkField]);
  const deleteResult = await Model.deleteMany({ [pkField]: { $nin: incomingIds } });

  return { upserted: items.length, deleted: deleteResult.deletedCount };
}

async function upsertCustomDiagnoses(Model, names) {
  if (!names || names.length === 0) return;
  const ops = names.map(name => ({
    updateOne: {
      filter: { name },
      update: { $set: { name, updatedAt: new Date() } },
      upsert: true
    }
  }));
  await Model.bulkWrite(ops, { ordered: false });
}

async function validateForeignKeys(models, patients, visits, appointments, reports, families) {
  const warnings = [];
  const pushedMobiles = new Set((patients || []).map(p => p.mobile));
  const dbPatients = await models.Patient.find({}, { mobile: 1 }).lean();
  const allMobiles = new Set([...pushedMobiles, ...dbPatients.map(p => p.mobile)]);

  for (const v of (visits || [])) {
    if (!allMobiles.has(v.patientMobile))
      warnings.push(`Visit "${v.id}": patientMobile "${v.patientMobile}" has no matching patient.`);
  }
  for (const a of (appointments || [])) {
    if (!allMobiles.has(a.patientMobile))
      warnings.push(`Appointment "${a.id}": patientMobile "${a.patientMobile}" has no matching patient.`);
  }
  for (const r of (reports || [])) {
    if (!allMobiles.has(r.patientMobile))
      warnings.push(`Report "${r.id}": patientMobile "${r.patientMobile}" has no matching patient.`);
  }
  for (const f of (families || [])) {
    for (const m of (f.members || [])) {
      if (!allMobiles.has(m.mobile))
        warnings.push(`Family "${f.id}": member mobile "${m.mobile}" has no matching patient.`);
    }
  }
  return warnings;
}

// ════════════════════════════════════════════════════════════
//  API ROUTES
// ════════════════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    admin_db: mongoose.connection.readyState === 1 ? 'ready' : 'unavailable'
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (await Config.countDocuments() === 0) {
    const seedEmail = process.env.CLINIC_EMAIL || 'admin@medcore.in';
    const seedPassword = process.env.CLINIC_PASSWORD || 'password123';
    const seedName = process.env.CLINIC_NAME || 'MedCore Clinic';

    await Config.create({
      email: seedEmail,
      password: seedPassword,
      clinicName: seedName,
      tenantId: seedEmail // First user's tenantId is their email
    });
    console.log(`✅ First-run: Seeded "${seedName}" (${seedEmail})`);

    // Also seed demo doctor account
    await Config.create({
      email: 'demo@medcore.in',
      password: 'demo123',
      clinicName: 'MedCore Demo Clinic',
      tenantId: 'demo@medcore.in',
      isDemo: true
    });
    console.log(`✅ First-run: Seeded "MedCore Demo Clinic" (demo@medcore.in)`);
  }

  // Special handling for demo credentials - fallback if not in db
  if (email === 'demo@medcore.in' && password === 'demo123') {
    // Try to find in database, if not found create it
    let config = await Config.findOne({ email });
    if (!config) {
      config = await Config.create({
        email: 'demo@medcore.in',
        password: 'demo123',
        clinicName: 'MedCore Demo Clinic',
        tenantId: 'demo@medcore.in',
        isDemo: true
      });
      console.log(`✅ Auto-seeded demo account`);
    }

    res.json({
      success: true,
      user: {
        name: config.clinicName,
        email: config.email,
        token: config.email,
        tenantId: config.tenantId,
        isDemo: true,
        clinicDetails: { name: config.clinicName, address: config.address }
      }
    });
    return;
  }

  const config = await Config.findOne({ email, password });
  if (config) {
    // Migration: If legacy account has no tenantId, assign it now
    if (!config.tenantId) {
      config.tenantId = config.email;
      await config.save();
      console.log(`🔧 Migrated legacy account ${config.email} to tenantId: ${config.tenantId}`);
    }

    res.json({
      success: true,
      user: {
        name: config.clinicName,
        email: config.email,
        token: config.email,
        tenantId: config.tenantId,
        clinicDetails: { name: config.clinicName, address: config.address }
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid Credentials' });
  }
});

app.get('/api/sync/pull-all', verifyAccess, async (req, res) => {
  try {
    const { Patient, Visit, Family, Appointment, Report, CustomDiagnosis, Template } = req.models;
    const [patients, visits, families, appointments, reports, customDiagnoses, templates] =
      await Promise.all([
        Patient.find({}).lean(),
        Visit.find({}).lean(),
        Family.find({}).lean(),
        Appointment.find({}).lean(),
        Report.find({}).lean(),
        CustomDiagnosis.find({}).lean(),
        Template.find({}).lean()
      ]);

    res.json({
      patients: patients.map(stripMeta),
      visits: visits.map(stripMeta),
      families: families.map(stripMeta),
      appointments: appointments.map(stripMeta),
      reports: reports.map(stripMeta),
      customDiagnoses: customDiagnoses.map(d => d.name),
      templates: templates.map(stripMeta),
    });
  } catch (err) {
    console.error(`pull-all error [${req.tenantId}]:`, err);
    res.status(500).json({ error: 'Sync pull failed' });
  }
});

app.post('/api/sync/push-all', verifyAccess, async (req, res) => {
  try {
    const { Patient, Visit, Family, Appointment, Report, CustomDiagnosis, Template } = req.models;
    const { patients, visits, families, appointments, reports, customDiagnoses, templates } = req.body;

    const warnings = await validateForeignKeys(req.models, patients, visits, appointments, reports, families);
    if (warnings.length > 0) {
      console.warn(`⚠️  FK warnings [${req.tenantId}]:`, warnings);
    }

    await mirrorBatch(Patient, patients, 'mobile');
    await mirrorBatch(Family, families, 'id');
    await Promise.all([
      mirrorBatch(Visit, visits, 'id'),
      mirrorBatch(Appointment, appointments, 'id'),
      mirrorBatch(Report, reports, 'id'),
      mirrorBatch(Template, templates, 'diagnosis'),
      upsertCustomDiagnoses(CustomDiagnosis, customDiagnoses),
    ]);

    // Cleanup Custom Diagnoses if mirroring is needed
    if (customDiagnoses) {
      await CustomDiagnosis.deleteMany({ name: { $nin: customDiagnoses } });
    }

    res.json({ success: true, ...(warnings.length ? { warnings } : {}) });
  } catch (err) {
    console.error(`push-all error [${req.tenantId}]:`, err);
    res.status(500).json({ error: 'Sync push failed' });
  }
});

app.get('/api/patients/:mobile', verifyAccess, async (req, res) => {
  try {
    const { Patient, Visit, Appointment, Report } = req.models;
    const { mobile } = req.params;
    const [patient, visits, appointments, reports] = await Promise.all([
      Patient.findOne({ mobile }).lean(),
      Visit.find({ patientMobile: mobile }).sort({ date: -1 }).lean(),
      Appointment.find({ patientMobile: mobile }).sort({ date: -1 }).lean(),
      Report.find({ patientMobile: mobile }).sort({ date: -1 }).lean(),
    ]);

    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    res.json({
      patient: stripMeta(patient),
      visits: visits.map(stripMeta),
      appointments: appointments.map(stripMeta),
      reports: reports.map(stripMeta),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patient data' });
  }
});

app.delete('/api/patients/:mobile', verifyAccess, async (req, res) => {
  try {
    const { Patient, Visit, Appointment, Report, Family } = req.models;
    const { mobile } = req.params;

    await Promise.all([
      Patient.deleteOne({ mobile }),
      Visit.deleteMany({ patientMobile: mobile }),
      Appointment.deleteMany({ patientMobile: mobile }),
      Report.deleteMany({ patientMobile: mobile }),
      Family.updateMany({ 'members.mobile': mobile }, { $pull: { members: { mobile } } }),
    ]);

    await Family.deleteMany({ $expr: { $lte: [{ $size: '$members' }, 1] } });
    res.json({ success: true, message: `Patient ${mobile} deleted.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MedRecord Pro Multi-tenant Server live on ${PORT}`));
