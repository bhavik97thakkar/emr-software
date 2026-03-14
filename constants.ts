
import { DiagnosisTemplate } from './types';

export const INITIAL_DIAGNOSIS_TEMPLATES: DiagnosisTemplate[] = [
  {
    diagnosis: "Fever",
    defaultMedicines: [
      { name: "Tab Paracetamol", dosage: "500mg", frequency: "1-0-1", duration: 3, instructions: "After Food" },
      { name: "Tab Cetrizine", dosage: "10mg", frequency: "0-0-1", duration: 3, instructions: "After Food" }
    ],
    defaultReports: ["CBC", "Malaria Antigen Test"]
  },
  {
    diagnosis: "Cold & Cough",
    defaultMedicines: [
      { name: "Cough Syrup (Ascoril)", dosage: "5ml", frequency: "1-1-1", duration: 5, instructions: "After Food" },
      { name: "Tab Azithromycin", dosage: "500mg", frequency: "1-0-0", duration: 3, instructions: "Before Food" }
    ],
    defaultReports: ["Chest X-Ray (if cough > 7 days)"]
  },
  {
    diagnosis: "Diabetes Follow-up",
    defaultMedicines: [
      { name: "Tab Metformin", dosage: "500mg", frequency: "1-0-1", duration: 30, instructions: "After Food" }
    ],
    defaultReports: ["FBS", "PPBS", "HbA1c"]
  }
];

export const GLOBAL_DIAGNOSES = [
  "Abdominal Pain", "Acute Bronchitis", "Acute Myocardial Infarction", "Allergic Rhinitis", "Alzheimer's Disease",
  "Anemia", "Anxiety Disorder", "Appendicitis", "Arthritis", "Asthma", "Atrial Fibrillation", "Bipolar Disorder",
  "Bladder Infection", "Breast Cancer", "Candidiasis", "Cataract", "Celiac Disease", "Chickenpox", "Chlamydia",
  "Cholera", "Chronic Kidney Disease", "Chronic Obstructive Pulmonary Disease (COPD)", "Cirrhosis", "Colorectal Cancer",
  "Common Cold", "Conjunctivitis", "Congestive Heart Failure", "Crohn's Disease", "Cushing Syndrome", "Cystic Fibrosis",
  "Dengue Fever", "Depression", "Diabetes Mellitus Type 1", "Diabetes Mellitus Type 2", "Diarrhea", "Diverticulitis",
  "Down Syndrome", "Dyslipidemia", "Ear Infection", "Ebola Virus Disease", "Eczema", "Endometriosis", "Epilepsy",
  "Erectile Dysfunction", "Fibromyalgia", "Food Poisoning", "Gallstones", "Gastroesophageal Reflux Disease (GERD)",
  "Glaucoma", "Gout", "Graves' Disease", "Hashimoto's Thyroiditis", "Hemorrhoids", "Hepatitis A", "Hepatitis B",
  "Hepatitis C", "Herpes Simplex", "HIV/AIDS", "Hodgkin's Lymphoma", "Hypercholesterolemia", "Hypertension",
  "Hyperthyroidism", "Hypoglycemia", "Hypothyroidism", "Influenza", "Insomnia", "Irritable Bowel Syndrome (IBS)",
  "Kidney Stones", "Lactose Intolerance", "Leukemia", "Lupus Erythematosus", "Lyme Disease", "Lymphoma", "Macular Degeneration",
  "Malaria", "Measles", "Meningitis", "Migraine", "Multiple Sclerosis", "Mumps", "Narcolepsy", "Nephrotic Syndrome",
  "Obesity", "Obsessive-Compulsive Disorder (OCD)", "Osteoarthritis", "Osteoporosis", "Otitis Media", "Ovarian Cancer",
  "Pancreatitis", "Parkinson's Disease", "Pelvic Inflammatory Disease", "Peptic Ulcer", "Pneumonia", "Polycystic Ovary Syndrome (PCOS)",
  "Post-Traumatic Stress Disorder (PTSD)", "Psoriasis", "Pulmonary Embolism", "Rheumatoid Arthritis", "Rosacea",
  "Salmonella", "Scabies", "Schizophrenia", "Scoliosis", "Sepsis", "Shingles", "Sickle Cell Anemia", "Sinusitis",
  "Sleep Apnea", "Strep Throat", "Stroke", "Syphilis", "Systemic Lupus Erythematosus", "Tachycardia", "Tetanus",
  "Thalassemia", "Thrombosis", "Tinnitus", "Tonsillitis", "Tuberculosis", "Typhoid Fever", "Ulcerative Colitis",
  "Urinary Tract Infection (UTI)", "Varicose Veins", "Vertigo", "Vitiligo", "West Nile Virus", "Whooping Cough",
  "Yellow Fever", "Zika Virus"
];

export const PAYMENT_METHODS = ["Cash", "GPay", "UPI", "Card", "Due Payment"];
export const GENDERS = ["Male", "Female", "Other"];
export const RELATIONSHIPS = ["Father", "Mother", "Son", "Daughter", "Spouse", "Brother", "Sister"];
export const REPORT_TYPES = ["Lab", "Xray", "Prescription", "Other"];
