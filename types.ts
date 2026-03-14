
export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g. "1-0-1"
  duration: number; // days
  instructions: string; // e.g. 'Take with food', 'Take on an empty stomach', etc.
}

export interface Report {
  id: string;
  type: 'Lab' | 'Xray' | 'Prescription' | 'Other' | 'Past Record';
  description: string;
  date: string;
  fileName: string;
  fileData: string; // Base64 or Blob URL
}

export interface Vitals {
  weight?: number; // kg
  height?: number; // cm
  bmi?: number;
  temp?: number; // F
  pulse?: number; // bpm
  bp_sys?: number;
  bp_dia?: number;
  spo2?: number; // %
  respRate?: number; // breaths/min
}

export interface Visit {
  id: string;
  patientMobile: string;
  date: string;
  diagnosis: string;
  medicines: Medicine[];
  reportsOrdered: string[];
  reportIds?: string[]; // IDs of uploaded reports associated with this visit
  amount: number;
  paymentMethod: 'Cash' | 'GPay' | 'UPI' | 'Card' | 'Due Payment';
  paymentStatus: 'Paid' | 'Pending';
  prescriptionNotes?: string; // General instructions for the entire prescription
  existingMedicines?: string; // Medicines patient is currently taking from other doctors
  vitals?: Vitals;
}

export interface FamilyMember {
  mobile: string;
  relationship: string;
}

export interface Patient {
  mobile: string; // Primary Key
  name: string;
  age: number;
  dob?: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  occupation?: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pin?: string;
  country?: string;
  email?: string;
  allergyOther?: string;
  allergyMedicine?: string;
  habits?: {
    smoke?: string;
    alcohol?: string;
    drugAbuse?: string;
  };
  referredBy?: string;
  createdDate: string;
  familyId?: string;
  pastHistoryNotes?: string; // Global field for chronic history/past medical records
}

export interface DiagnosisTemplate {
  diagnosis: string;
  defaultMedicines: Partial<Medicine>[];
  defaultReports: string[];
}

export interface Family {
  id: string;
  name?: string;
  members: FamilyMember[];
}

export interface Appointment {
  id: string;
  patientMobile: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reason: string;
  status: 'Scheduled' | 'Completed' | 'Missed' | 'Cancelled';
}
