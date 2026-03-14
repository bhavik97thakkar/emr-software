import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, User, Calendar, Loader2, CreditCard, Droplets, MapPin, Mail, Hash, Stethoscope, Briefcase, AlertCircle, Cigarette, Wine, Pill, ArrowRight } from 'lucide-react';
import { DB } from '../services/db';
import { Patient, Visit } from '../types';
import VisitForm from './VisitForm';
import { GENDERS } from '../constants';
import VoiceInput from './VoiceInput';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const NewVisit = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState<Partial<Patient>>({
    mobile: searchParams.get('mobile') || '',
    name: '',
    age: 0,
    gender: 'Female',
    dob: '',
    bloodGroup: '',
    occupation: '',
    address: '',
    area: '',
    city: '',
    state: '',
    pin: '',
    country: '',
    email: '',
    allergyMedicine: '',
    allergyOther: '',
    habits: { smoke: 'No', alcohol: 'No', drugAbuse: 'No' },
    referredBy: '',
    createdDate: new Date().toISOString()
  });

  const [isExisting, setIsExisting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'consultation'>('profile');
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkExisting = async () => {
      if (patientData.mobile && patientData.mobile.length === 10) {
        const patients = await DB.getPatients();
        const existing = patients.find(p => p.mobile === patientData.mobile);
        if (existing) {
          setIsExisting(true);
          setPatientData({
            ...existing,
            habits: existing.habits || { smoke: 'No', alcohol: 'No', drugAbuse: 'No' }
          });
        } else if (isExisting) {
          setIsExisting(false);
          setPatientData({
            ...patientData,
            name: '', age: 0, gender: 'Female', dob: '', bloodGroup: '', occupation: '', address: '', area: '', city: '', state: '', pin: '', country: '', email: '', allergyMedicine: '', allergyOther: '', habits: { smoke: 'No', alcohol: 'No', drugAbuse: 'No' }, referredBy: '', createdDate: new Date().toISOString()
          });
        }
      }
    };
    checkExisting();
  }, [patientData.mobile]);

  const updateHabit = (field: keyof NonNullable<Patient['habits']>, value: string) => {
    setPatientData(prev => ({ ...prev, habits: { ...prev.habits, [field]: value } }));
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let ageCalculated = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      ageCalculated--;
    }
    return ageCalculated;
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobVal = e.target.value;
    setPatientData({ ...patientData, dob: dobVal, age: calculateAge(dobVal) });
  };

  const handleSaveVisit = async (visitParams: Visit, shouldPrint: boolean = false) => {
    if (isSubmitting) return;

    if (!patientData.mobile || !patientData.name || patientData.age === undefined) {
      alert("Please fill essential patient details (Mobile, Name, Age)");
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setIsSubmitting(true);
    let registeredPatient: Patient;

    try {
      registeredPatient = patientData as Patient;
      // VisitForm already saves the patient with pastHistoryNotes at line 173
      // Only save if it's a new patient (not yet in DB)
      const existingPatients = await DB.getPatients();
      const exists = existingPatients.find(p => p.mobile === registeredPatient.mobile);
      if (!exists) {
        await DB.savePatient(registeredPatient);
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert("Registration failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const finalVisit = { ...visitParams, patientMobile: registeredPatient.mobile };
      await DB.saveVisit(finalVisit);
      navigate(`/patient/${registeredPatient.mobile}${shouldPrint ? '?print=true' : ''}`);
    } catch (err) {
      setIsSubmitting(false);
      alert("Error saving visit details.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500" ref={formRef}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Intake & Consultation</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Register patient demographics and record clinical encounter</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-xs font-bold text-slate-400 hover:text-slate-900 flex items-center space-x-1 uppercase tracking-widest"><ArrowLeft size={14} /> <span>Cancel</span></button>
      </div>

      <div className="flex space-x-6 border-b border-slate-200 px-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}
        >
          1. Patient Profile
        </button>
        <button
          onClick={() => setActiveTab('consultation')}
          className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === 'consultation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}
        >
          2. Consultation
        </button>
      </div>

      <div className="space-y-8">
        {activeTab === 'profile' ? (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            {/* Top Section: Demographics & Clinical Markers */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <h3 className="text-[12px] font-black uppercase tracking-widest flex items-center"><User className="mr-2" size={18} /> Patient Profile & Demographics</h3>
              {isExisting && <span className="bg-blue-500/20 text-blue-300 text-[10px] px-3 py-1.5 rounded-lg border border-blue-500/30 uppercase font-black tracking-widest">Registered Profile</span>}
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Primary Patient Identification */}
                <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100 lg:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center"><Phone size={12} className="mr-1.5" /> Mobile Number *</label>
                  <VoiceInput
                    value={patientData.mobile || ''}
                    onTranscript={(text) => {
                      const digits = text.replace(/\D/g, '').slice(0, 10);
                      setPatientData({ ...patientData, mobile: digits });
                    }}
                    placeholder="10-digit mobile number"
                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-base"
                  />
                </div>

                <div className="space-y-1.5 lg:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                  <VoiceInput
                    value={patientData.name || ''}
                    onTranscript={(text) => setPatientData({ ...patientData, name: text })}
                    placeholder="Patient Name"
                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-base"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Birth Date</label>
                  <input type="date" value={patientData.dob || ''} onChange={handleDobChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm text-slate-700" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Age *</label>
                  <VoiceInput
                    value={patientData.age?.toString() || ''}
                    onTranscript={(text) => {
                      const val = parseInt(text.replace(/\D/g, '')) || 0;
                      setPatientData({ ...patientData, age: val });
                    }}
                    placeholder="Years"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                  <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    {GENDERS.map(g => (
                      <button key={g} type="button" onClick={() => setPatientData({ ...patientData, gender: g as any })} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${patientData.gender === g ? 'bg-white shadow-sm text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{g}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center"><Droplets size={12} className="mr-1.5" /> Blood Group</label>
                  <select value={patientData.bloodGroup || ''} onChange={(e) => setPatientData({ ...patientData, bloodGroup: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none">
                    <option value="">Select group</option>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                {/* Left Side: Contact Info */}
                <div className="space-y-5">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center"><MapPin size={14} className="mr-2 text-blue-500" /> Contact & Address</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Address</label>
                      <input type="text" value={patientData.address || ''} onChange={(e) => setPatientData({ ...patientData, address: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="Street line 1/2" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Locality/Area</label>
                      <input type="text" value={patientData.area || ''} onChange={(e) => setPatientData({ ...patientData, area: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="Area" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">City/Town</label>
                      <input type="text" value={patientData.city || ''} onChange={(e) => setPatientData({ ...patientData, city: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="City name" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">State</label>
                      <input type="text" value={patientData.state || ''} onChange={(e) => setPatientData({ ...patientData, state: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="State" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">PIN Code</label>
                      <input type="text" value={patientData.pin || ''} onChange={(e) => setPatientData({ ...patientData, pin: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="Code" />
                    </div>

                    <div className="space-y-1.5 border-t border-slate-100 pt-3 mt-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center"><Mail size={10} className="mr-1" /> Email Address</label>
                      <input type="email" value={patientData.email || ''} onChange={(e) => setPatientData({ ...patientData, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="Email" />
                    </div>

                    <div className="space-y-1.5 border-t border-slate-100 pt-3 mt-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center"><Briefcase size={10} className="mr-1" /> Occupation</label>
                      <input type="text" value={patientData.occupation || ''} onChange={(e) => setPatientData({ ...patientData, occupation: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="Profession" />
                    </div>
                  </div>
                </div>

                {/* Right Side: Clinical Markers */}
                <div className="space-y-5 bg-rose-50/30 p-5 rounded-2xl border border-rose-100/50">
                  <h4 className="text-[11px] font-black text-rose-800 uppercase tracking-widest flex items-center"><AlertCircle size={14} className="mr-2 text-rose-500" /> Clinical Markers & Alerts</h4>

                  <div className="space-y-4">
                    <div className="space-y-1.5 bg-white p-3 rounded-xl shadow-sm border border-rose-100/50">
                      <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1 flex items-center"><Pill size={12} className="mr-1.5" /> Medication Allergies</label>
                      <input type="text" value={patientData.allergyMedicine || ''} onChange={(e) => setPatientData({ ...patientData, allergyMedicine: e.target.value })} className="w-full px-3 py-2.5 bg-rose-50/50 border border-rose-100 rounded-lg outline-none focus:bg-white focus:border-rose-300 font-bold text-sm text-rose-700" placeholder="e.g. Penicillin, Sulfa" />
                    </div>

                    <div className="space-y-1.5 bg-white p-3 rounded-xl shadow-sm border border-rose-100/50">
                      <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1">Food/Other Allergies</label>
                      <input type="text" value={patientData.allergyOther || ''} onChange={(e) => setPatientData({ ...patientData, allergyOther: e.target.value })} className="w-full px-3 py-2.5 bg-rose-50/50 border border-rose-100 rounded-lg outline-none focus:bg-white focus:border-rose-300 font-bold text-sm text-rose-700" placeholder="e.g. Peanuts, Dust" />
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Habits & Lifestyle</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center"><Cigarette size={10} className="mr-1.5" /> Smoke</label>
                          <select value={patientData.habits?.smoke || 'No'} onChange={(e) => updateHabit('smoke', e.target.value)} className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold">
                            <option value="No">No</option><option value="Yes">Yes</option><option value="Occasional">Occasional</option><option value="Past">Past</option>
                          </select>
                        </div>
                        <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center"><Wine size={10} className="mr-1.5" /> Alcohol</label>
                          <select value={patientData.habits?.alcohol || 'No'} onChange={(e) => updateHabit('alcohol', e.target.value)} className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold">
                            <option value="No">No</option><option value="Yes">Yes</option><option value="Occasional">Occasional</option><option value="Past">Past</option>
                          </select>
                        </div>
                        <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Drug Abuse</label>
                          <select value={patientData.habits?.drugAbuse || 'No'} onChange={(e) => updateHabit('drugAbuse', e.target.value)} className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold">
                            <option value="No">No</option><option value="Yes">Yes</option><option value="Past">Past</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Referred By</label>
                      <input type="text" value={patientData.referredBy || ''} onChange={(e) => setPatientData({ ...patientData, referredBy: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:bg-slate-50 font-bold text-sm" placeholder="Dr. Name / Portal" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button type="button" onClick={() => { setActiveTab('consultation'); formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="px-8 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center">
                Proceed to Consultation <ArrowRight size={16} className="ml-2" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {/* Bottom Section: Visit Form Integration */}
            <VisitForm
              patient={(patientData as Patient)}
              onSave={handleSaveVisit}
              onCancel={() => navigate('/')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewVisit;
