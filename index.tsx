
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { seedDemoData, DEMO_CREDENTIALS } from './services/demoSeed';

// Expose comprehensive demo utilities to window
(window as any).medcore = {
  seedDemoData: () => {
    seedDemoData();
    console.log('✅ Demo data has been seeded. Refresh the page to see the changes.');
  },
  DEMO_CREDENTIALS,
  
  // View all demo patients
  viewPatients: () => {
    const patients = JSON.parse(localStorage.getItem('medcore_patients') || '[]');
    console.log('👥 All Demo Patients:', patients);
    console.table(patients.map((p: any) => ({ 
      name: p.name, 
      mobile: p.mobile, 
      age: p.age, 
      city: p.city,
      gender: p.gender 
    })));
  },

  // View all visits for detailed analysis
  viewVisits: () => {
    const visits = JSON.parse(localStorage.getItem('medcore_visits') || '[]');
    console.log('📋 All Demo Visits:', visits);
  },

  // View families
  viewFamilies: () => {
    const families = JSON.parse(localStorage.getItem('medcore_families') || '[]');
    console.log('👨‍👩‍👧‍👦 All Families:', families);
    console.table(families.map((f: any) => ({ 
      familyName: f.name, 
      members: f.members.length 
    })));
  },

  // View appointments
  viewAppointments: () => {
    const appointments = JSON.parse(localStorage.getItem('medcore_appointments') || '[]');
    console.log('📅 All Appointments:', appointments);
    console.table(appointments.map((a: any) => ({ 
      date: a.date, 
      time: a.time, 
      reason: a.reason, 
      status: a.status 
    })));
  },

  // View diagnosis templates
  viewDiagnosisTemplates: () => {
    const templates = JSON.parse(localStorage.getItem('medcore_diagnosis_templates') || '[]');
    console.log('🔬 Diagnosis Templates:', templates);
    templates.forEach((t: any) => {
      console.log(`\n📌 ${t.diagnosis}:`);
      console.log('  Medicines:', t.defaultMedicines);
      console.log('  Reports:', t.defaultReports);
    });
  },

  // Comprehensive demo info
  getDemoInfo: () => {
    console.log('\n📋 MedCore EMR - Complete Demo Information');
    console.log('════════════════════════════════════════════════\n');
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('   Email:', DEMO_CREDENTIALS.email);
    console.log('   Password:', DEMO_CREDENTIALS.password);
    console.log('   Clinic:', DEMO_CREDENTIALS.clinicName);
    console.log('\n📊 AVAILABLE DEMO DATA:');
    
    const patients = JSON.parse(localStorage.getItem('medcore_patients') || '[]');
    const visits = JSON.parse(localStorage.getItem('medcore_visits') || '[]');
    const families = JSON.parse(localStorage.getItem('medcore_families') || '[]');
    const appointments = JSON.parse(localStorage.getItem('medcore_appointments') || '[]');
    const templates = JSON.parse(localStorage.getItem('medcore_diagnosis_templates') || '[]');
    
    console.log(`   ✓ ${patients.length} Patients`);
    console.log(`   ✓ ${visits.length} Clinical Encounters`);
    console.log(`   ✓ ${families.length} Family Groups`);
    console.log(`   ✓ ${appointments.length} Appointments`);
    console.log(`   ✓ ${templates.length} Diagnosis Templates`);
    
    console.log('\n🛠️  AVAILABLE COMMANDS:');
    console.log('   medcore.seedDemoData()              - Reseed all demo data');
    console.log('   medcore.viewPatients()              - View all patients');
    console.log('   medcore.viewVisits()                - View all clinical visits');
    console.log('   medcore.viewFamilies()              - View all family groups');
    console.log('   medcore.viewAppointments()          - View all appointments');
    console.log('   medcore.viewDiagnosisTemplates()    - View diagnosis templates');
    console.log('   medcore.getDemoInfo()               - Show this info again');
    console.log('\n════════════════════════════════════════════════\n');
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </HashRouter>
  </React.StrictMode>
);
