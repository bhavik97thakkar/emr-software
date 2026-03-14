/**
 * Demo Data Seeding Service
 * Provides demo data for testing and demos
 */

import { Patient, Visit, Appointment, Family } from '../types';

export const DEMO_CREDENTIALS = {
  email: 'demo@medcore.in',
  password: 'demo123',
  clinicName: 'MedCore Demo Clinic'
};

const DEMO_PATIENTS: Patient[] = [
  {
    mobile: '9876543210',
    name: 'Rajesh Kumar',
    age: 45,
    gender: 'Male',
    bloodGroup: 'O+',
    occupation: 'Engineer',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    address: '123 Main Street',
    allergyMedicine: 'Penicillin',
    habits: { smoke: 'No', alcohol: 'Occasional', drugAbuse: 'No' },
    createdDate: new Date().toISOString().split('T')[0]
  },
  {
    mobile: '9876543211',
    name: 'Priya Singh',
    age: 35,
    gender: 'Female',
    bloodGroup: 'B+',
    occupation: 'Software Developer',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    address: '456 Tech Park',
    allergyMedicine: 'None',
    habits: { smoke: 'No', alcohol: 'No', drugAbuse: 'No' },
    createdDate: new Date().toISOString().split('T')[0]
  },
  {
    mobile: '9876543212',
    name: 'Amit Patel',
    age: 52,
    gender: 'Male',
    bloodGroup: 'A+',
    occupation: 'Businessman',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    address: '789 Business Street',
    allergyMedicine: 'Aspirin',
    habits: { smoke: 'Yes', alcohol: 'Frequent', drugAbuse: 'No' },
    createdDate: new Date().toISOString().split('T')[0]
  },
  {
    mobile: '9876543213',
    name: 'Meera Sharma',
    age: 28,
    gender: 'Female',
    bloodGroup: 'AB+',
    occupation: 'Teacher',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    address: '321 School Road',
    allergyMedicine: 'None',
    habits: { smoke: 'No', alcohol: 'No', drugAbuse: 'No' },
    createdDate: new Date().toISOString().split('T')[0]
  },
  {
    mobile: '9876543214',
    name: 'Vikram Rao',
    age: 38,
    gender: 'Male',
    bloodGroup: 'B-',
    occupation: 'Doctor',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    address: '654 Medical Lane',
    allergyMedicine: 'None',
    habits: { smoke: 'No', alcohol: 'Occasional', drugAbuse: 'No' },
    createdDate: new Date().toISOString().split('T')[0]
  }
];

const DEMO_VISITS: Visit[] = [
  {
    id: `visit_${Date.now()}_1`,
    patientMobile: '9876543210',
    date: new Date().toISOString().split('T')[0],
    diagnosis: 'Hypertension',
    medicines: [
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: 30, instructions: 'Morning with food' },
      { name: 'Metoprolol', dosage: '50mg', frequency: 'Twice daily', duration: 30, instructions: 'With meals' }
    ],
    amount: 500,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    prescriptionNotes: 'Patient to monitor BP daily'
  },
  {
    id: `visit_${Date.now()}_2`,
    patientMobile: '9876543211',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    diagnosis: 'Upper Respiratory Infection',
    medicines: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: 7, instructions: 'Complete the course' },
      { name: 'Cough syrup', dosage: '10ml', frequency: 'Twice daily', duration: 7, instructions: 'Before bedtime' }
    ],
    amount: 400,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    prescriptionNotes: 'Rest and hydration advised'
  },
  {
    id: `visit_${Date.now()}_3`,
    patientMobile: '9876543212',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    diagnosis: 'Type 2 Diabetes Mellitus',
    medicines: [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: 30, instructions: 'With meals' }
    ],
    reportsOrdered: ['Blood Sugar', 'HbA1c'],
    amount: 600,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    prescriptionNotes: 'Diet control essential. Next checkup in 2 weeks'
  },
  {
    id: `visit_${Date.now()}_4`,
    patientMobile: '9876543213',
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
    diagnosis: 'Migraine',
    medicines: [
      { name: 'Sumatriptan', dosage: '50mg', frequency: 'As needed', duration: 30, instructions: 'Take at onset of headache' }
    ],
    amount: 350,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    prescriptionNotes: 'Avoid triggers. Consider preventive therapy if frequent'
  },
  {
    id: `visit_${Date.now()}_5`,
    patientMobile: '9876543214',
    date: new Date(Date.now() - 345600000).toISOString().split('T')[0],
    diagnosis: 'Annual Checkup',
    medicines: [],
    reportsOrdered: ['General Health Checkup', 'ECG'],
    amount: 1000,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    prescriptionNotes: 'All vitals normal. Continue with regular exercise'
  }
];

const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: `appt_${Date.now()}_1`,
    patientMobile: '9876543210',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '10:00',
    reason: 'Follow-up: BP Checkup',
    status: 'Scheduled'
  },
  {
    id: `appt_${Date.now()}_2`,
    patientMobile: '9876543211',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    time: '14:30',
    reason: 'Post-infection review',
    status: 'Scheduled'
  },
  {
    id: `appt_${Date.now()}_3`,
    patientMobile: '9876543212',
    date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
    time: '11:00',
    reason: 'Diabetes Management',
    status: 'Scheduled'
  }
];

const DEMO_FAMILIES: Family[] = [
  {
    id: `family_${Date.now()}_1`,
    name: 'Kumar Family',
    members: [
      { mobile: '9876543210', relationship: 'Primary' },
      { mobile: '9876543211', relationship: 'Spouse' }
    ]
  },
  {
    id: `family_${Date.now()}_2`,
    name: 'Patel Family',
    members: [
      { mobile: '9876543212', relationship: 'Primary' },
      { mobile: '9876543213', relationship: 'Child' }
    ]
  }
];

const DEMO_TEMPLATES = [
  {
    diagnosis: 'Hypertension',
    defaultMedicines: [
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: 30 },
      { name: 'Enalapril', dosage: '10mg', frequency: 'Once daily', duration: 30 }
    ],
    defaultReports: ['BP Monitoring', 'Lipid Profile']
  },
  {
    diagnosis: 'Type 2 Diabetes',
    defaultMedicines: [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: 30 }
    ],
    defaultReports: ['Fasting Sugar', 'HbA1c', 'Lipid Profile']
  },
  {
    diagnosis: 'Upper Respiratory Infection',
    defaultMedicines: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: 7 }
    ],
    defaultReports: []
  }
];

const DEMO_CUSTOM_DIAGNOSES = [
  'Hypertension',
  'Type 2 Diabetes',
  'Upper Respiratory Infection',
  'Migraine',
  'Asthma',
  'Allergic Rhinitis',
  'Gastritis',
  'Fever',
  'Cough',
  'Common Cold'
];

export function seedDemoData() {
  // Use consistent localStorage keys
  localStorage.setItem('patients', JSON.stringify(DEMO_PATIENTS));
  localStorage.setItem('visits', JSON.stringify(DEMO_VISITS));
  localStorage.setItem('appointments', JSON.stringify(DEMO_APPOINTMENTS));
  localStorage.setItem('families', JSON.stringify(DEMO_FAMILIES));
  localStorage.setItem('templates', JSON.stringify(DEMO_TEMPLATES));
  localStorage.setItem('customDiagnoses', JSON.stringify(DEMO_CUSTOM_DIAGNOSES));
  localStorage.setItem('reports', JSON.stringify([]));

  console.log('✅ Demo data seeded successfully!');
}
