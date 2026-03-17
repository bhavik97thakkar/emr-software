require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Security: JWT for session management
const rateLimit = require('express-rate-limit'); // Security: Flood protection
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'medcore-clinical-vault-key-2026';
const JWT_EXPIRY = '1h'; // 1-hour token expiry for security

// ════════════════════════════════════════════════════════════
//  RATE LIMITERS
// ════════════════════════════════════════════════════════════

// Security: Rate limiter for sync endpoints to prevent brute-force/DoS
const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many sync attempts. Please try again after 15 minutes' }
});

// Security: Strict rate limiter for login to prevent brute-force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Account temporarily locked' },
  skip: (req) => req.body?.email === 'demo@medcore.in' // Demo account exempt
});

// ════════════════════════════════════════════════════════════
//  LOGIN ATTEMPT TRACKING
// ════════════════════════════════════════════════════════════

const loginAttempts = new Map();
const lockedAccounts = new Map();

function recordFailedLogin(email) {
  const key = email;
  const current = loginAttempts.get(key) || { count: 0, timestamp: Date.now() };
  if (Date.now() - current.timestamp > 15 * 60 * 1000) {
    loginAttempts.set(key, { count: 1, timestamp: Date.now() });
  } else {
    current.count += 1;
    loginAttempts.set(key, current);
  }
  if (current.count >= 5) {
    lockedAccounts.set(key, Date.now() + 30 * 60 * 1000);
  }
  return current.count;
}

function clearFailedLoginAttempts(email) {
  loginAttempts.delete(email);
  lockedAccounts.delete(email);
}

function isAccountLocked(email) {
  const lockTime = lockedAccounts.get(email);
  return lockTime && Date.now() < lockTime;
}

// CORS Configuration for deployment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow localhost for development
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    // Allow Netlify deployments
    if (origin.includes('netlify.app')) {
      return callback(null, true);
    }
    // Allow Render
    if (origin.includes('onrender.com') || origin.includes('render.com')) {
      return callback(null, true);
    }
    // Fallback: allow origin
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' }));

// ════════════════════════════════════════════════════════════
//  PREFLIGHT HANDLING (CORS)
// ════════════════════════════════════════════════════════════
app.options('*', cors(corsOptions)); // Enable preflight requests for all routes

// ════════════════════════════════════════════════════════════
//  SECURITY HEADERS MIDDLEWARE
// ════════════════════════════════════════════════════════════
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Enable HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Set CSP header
  res.setHeader('Content-Security-Policy', "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com");
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  next();
});

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
//  AUDIT LOG SCHEMA (For HIPAA/GDPR Compliance)
// ════════════════════════════════════════════════════════════
const AuditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  action: { type: String, required: true }, // LOGIN, LOGOUT, CREATE_PATIENT, VIEW_PATIENT, etc.
  email: String,
  tenantId: String,
  ip: String,
  userAgent: String,
  method: String,
  endpoint: String,
  statusCode: Number,
  details: mongoose.Schema.Types.Mixed,
  success: Boolean,
  errorMessage: String,
  dataAccessed: [String]
});
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });
AuditLogSchema.index({ email: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

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
  isDemo: { type: Boolean, default: false },
  tenantId: { type: String, sparse: true, unique: true },

  // GDPR & Compliance Fields
  gdprConsent: { type: Boolean, default: false },
  gdprConsentDate: Date,
  gdprConsentVersion: { type: String, default: '1.0' },
  privacyPolicyAccepted: { type: Boolean, default: false },
  dataRetentionDays: { type: Number, default: 2555 }, // 7 years default

  // Security Fields
  lastLoginDate: Date,
  lastLoginIp: String,
  loginAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  lockUntil: Date,

  // Audit Trail
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});
const Config = mongoose.model('Config', ConfigSchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

// ════════════════════════════════════════════════════════════
//  MIDDLEWARE
// ════════════════════════════════════════════════════════════

const verifyAccess = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Session Expired' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const config = await Config.findOne({ email: decoded.email });
    if (!config || !config.isActive) return res.status(403).json({ error: 'Unauthorized Access' });

    // Check if account is locked
    if (config.isLocked && config.lockUntil > new Date()) {
      const remaining = Math.ceil((config.lockUntil - Date.now()) / 1000);
      return res.status(423).json({ error: `Account locked. Try again in ${remaining} seconds` });
    } else if (config.isLocked && config.lockUntil <= new Date()) {
      // Auto-unlock if lock time expired
      config.isLocked = false;
      config.lockUntil = null;
      config.loginAttempts = 0;
      await config.save();
    }

    // Attach user info to request for audit logging
    req.decoded = decoded;
    req.tenantId = config.tenantId || config.email;
    req.email = config.email;

    const conn = getTenantDb(req.tenantId);
    req.models = getTenantModels(conn);

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
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

// ════════════════════════════════════════════════════════════
//  AUDIT LOG HELPER
// ════════════════════════════════════════════════════════════
async function logAudit(action, email, tenantId, ip, details = {}, success = true, errorMsg = null) {
  try {
    await AuditLog.create({
      timestamp: new Date(),
      action,
      email: email || 'SYSTEM',
      tenantId: tenantId || 'SYSTEM',
      ip: ip || 'unknown',
      userAgent: 'Node Backend',
      method: 'POST',
      endpoint: '/auth/login',
      statusCode: success ? 200 : 401,
      details,
      success,
      errorMessage: errorMsg
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password, gdprConsent } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Input validation
    if (!email || !password) {
      await logAudit('LOGIN_ATTEMPT', email || 'UNKNOWN', null, clientIp, { error: 'Missing credentials' }, false, 'Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check for account lockout
    if (isAccountLocked(email)) {
      const lockTime = lockedAccounts.get(email);
      const remaining = Math.ceil((lockTime - Date.now()) / 1000);
      await logAudit('LOGIN_ATTEMPT', email, null, clientIp, { error: 'Account locked' }, false, 'Account locked');
      return res.status(423).json({ error: `Account locked. Try again in ${remaining} seconds`, lockTime: remaining });
    }

    if (await Config.countDocuments() === 0) {
      const seedEmail = process.env.CLINIC_EMAIL || 'admin@medcore.in';
      const seedPassword = process.env.CLINIC_PASSWORD || 'password123';
      const seedName = process.env.CLINIC_NAME || 'MedCore Clinic';

      await Config.create({
        email: seedEmail,
        password: seedPassword,
        clinicName: seedName,
        tenantId: seedEmail,
        gdprConsent: true,
        gdprConsentDate: new Date(),
        privacyPolicyAccepted: true,
        gdprConsentVersion: '1.0'
      });
      console.log(`✅ Seeded "${seedName}" (${seedEmail})`);

      // Also seed demo account with GDPR consent
      await Config.create({
        email: 'demo@medcore.in',
        password: 'demo123',
        clinicName: 'MedCore Demo Clinic',
        tenantId: 'demo@medcore.in',
        isDemo: true,
        gdprConsent: true,
        gdprConsentDate: new Date(),
        privacyPolicyAccepted: true,
        gdprConsentVersion: '1.0'
      });
      console.log(`✅ Seeded "MedCore Demo Clinic" (demo@medcore.in)`);
    }

  // Special handling for demo credentials
  if (email === 'demo@medcore.in' && password === 'demo123') {
    let config = await Config.findOne({ email });
    if (!config) {
      config = await Config.create({
        email: 'demo@medcore.in',
        password: 'demo123',
        clinicName: 'MedCore Demo Clinic',
        tenantId: 'demo@medcore.in',
        isDemo: true,
        gdprConsent: true,
        gdprConsentDate: new Date(),
        privacyPolicyAccepted: true,
        gdprConsentVersion: '1.0'
      });
    }

    // Clear failed attempts
    clearFailedLoginAttempts(email);
    config.loginAttempts = 0;
    config.lastLoginDate = new Date();
    config.lastLoginIp = clientIp;
    await config.save();

    // Sign JWT with 1-hour expiry
    const jwtToken = jwt.sign(
      { email: config.email, tenantId: config.tenantId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY, iat: Math.floor(Date.now() / 1000) }
    );

    await logAudit('LOGIN_SUCCESS', email, config.tenantId, clientIp, { isDemo: true }, true);

    res.json({
      success: true,
      user: {
        name: config.clinicName,
        email: config.email,
        token: jwtToken,
        tokenExpiry: JWT_EXPIRY,
        tenantId: config.tenantId,
        isDemo: true,
        gdprConsent: config.gdprConsent,
        requiresGdprConsent: !config.gdprConsent,
        clinicDetails: { name: config.clinicName, address: config.address }
      }
    });
    return;
  }

  // Validate credentials
  const config = await Config.findOne({ email, password });
  if (config) {
    // Check if account is locked again (in case of concurrent requests)
    if (config.isLocked && config.lockUntil > new Date()) {
      const remaining = Math.ceil((config.lockUntil - Date.now()) / 1000);
      await logAudit('LOGIN_ATTEMPT', email, config.tenantId, clientIp, { error: 'Account locked' }, false);
      return res.status(423).json({ error: `Account locked. Try again in ${remaining} seconds`, lockTime: remaining });
    }

    // Migrate legacy accounts
    if (!config.tenantId) {
      config.tenantId = config.email;
      console.log(`🔧 Migrated legacy account ${config.email} to tenantId: ${config.tenantId}`);
    }

    // Clear failed attempts on successful login
    clearFailedLoginAttempts(email);
    config.loginAttempts = 0;
    config.isLocked = false;
    config.lockUntil = null;
    config.lastLoginDate = new Date();
    config.lastLoginIp = clientIp;

    // Update GDPR consent if provided
    if (gdprConsent === true) {
      config.gdprConsent = true;
      config.gdprConsentDate = new Date();
      config.privacyPolicyAccepted = true;
      config.gdprConsentVersion = '1.0';
    }

    await config.save();

    // Sign JWT with 1-hour expiry (CRITICAL SECURITY FIX)
    const jwtToken = jwt.sign(
      { email: config.email, tenantId: config.tenantId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY, iat: Math.floor(Date.now() / 1000) }
    );

    await logAudit('LOGIN_SUCCESS', email, config.tenantId, clientIp, { clinicName: config.clinicName }, true);

    res.json({
      success: true,
      user: {
        name: config.clinicName,
        email: config.email,
        token: jwtToken,
        tokenExpiry: JWT_EXPIRY,
        tenantId: config.tenantId,
        gdprConsent: config.gdprConsent,
        requiresGdprConsent: !config.gdprConsent,
        clinicDetails: { name: config.clinicName, address: config.address }
      }
    });
  } else {
    // Track failed attempt and implement account lockout
    const attempts = recordFailedLogin(email);
    const isNowLocked = isAccountLocked(email);

    await logAudit('LOGIN_FAILED', email, null, clientIp, { attempts, locked: isNowLocked }, false, 'Invalid credentials');

    res.status(401).json({
      error: 'Invalid Credentials',
      attemptCount: attempts,
      message: attempts >= 4 ? 'Account will be locked after one more failed attempt' : undefined,
      locked: isNowLocked
    });
    }
  } catch (err) {
    console.error('❌ Login endpoint error:', err.message, err.stack);
    await logAudit('LOGIN_ERROR', email || 'UNKNOWN', null, 'unknown', { error: err.message }, false, 'Server error during login');
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

app.get('/api/sync/pull-all', syncLimiter, verifyAccess, async (req, res) => {
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

app.post('/api/sync/push-all', syncLimiter, verifyAccess, async (req, res) => {
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
