import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, User, Calendar, Loader2, CreditCard, Droplets, MapPin, Mail, Hash, Stethoscope, Briefcase, AlertCircle, Cigarette, Wine, Pill } from 'lucide-react';
import { DB } from '../services/db';
import { Patient, Visit } from '../types';
import { useToast } from '../context/ToastContext';
import VisitForm from './VisitForm';
import { GENDERS } from '../constants';
import VoiceInput from './VoiceInput';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const NewVisit = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();

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
            toast.error("Please fill essential patient details (Mobile, Name, Age)");
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        setIsSubmitting(true);
        let registeredPatient: Patient;

        try {
            registeredPatient = patientData as Patient;
            await DB.savePatient(registeredPatient);
        } catch (err) {
            console.error("Registration error:", err);
            toast.error("Registration failed. Please try again.");
            setIsSubmitting(false);
            return;
        }

        try {
            // Incorporate the temporary patient data into the visit logic
            // and automatically link to the newly upserted patient
            const finalVisit = { ...visitParams, patientMobile: registeredPatient.mobile };
            await DB.saveVisit(finalVisit);
            navigate(`/patient/${registeredPatient.mobile}${shouldPrint ? '?print=true' : ''}`);
        } catch (err) {
            setIsSubmitting(false);
            toast.error("Error saving visit details.");
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

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Demographics */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden sticky top-24">
                        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                            <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center"><User className="mr-2" size={16} /> Demographics</h3>
                            {isExisting && <span className="bg-blue-500/20 text-blue-300 text-[9px] px-2 py-1 rounded border border-blue-500/30 uppercase font-black">Registered Profile</span>}
                        </div>

                        <div className="p-6 space-y-5 h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">

                            {/* Core Info */}
                            <div className="space-y-4">
                                <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center"><Phone size={10} className="mr-1" /> Mobile Number *</label>
                                    <VoiceInput
                                        value={patientData.mobile || ''}
                                        onTranscript={(text) => {
                                            const digits = text.replace(/\D/g, '').slice(0, 10);
                                            setPatientData({ ...patientData, mobile: digits });
                                        }}
                                        placeholder="10-digit mobile"
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                                    <VoiceInput
                                        value={patientData.name || ''}
                                        onTranscript={(text) => setPatientData({ ...patientData, name: text })}
                                        placeholder="Patient Name"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Birth Date</label>
                                        <input type="date" value={patientData.dob || ''} onChange={handleDobChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm text-slate-700" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Age *</label>
                                        <VoiceInput
                                            value={patientData.age?.toString() || ''}
                                            onTranscript={(text) => {
                                                const val = parseInt(text.replace(/\D/g, '')) || 0;
                                                setPatientData({ ...patientData, age: val });
                                            }}
                                            placeholder="Years"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                                        {GENDERS.map(g => (
                                            <button key={g} type="button" onClick={() => setPatientData({ ...patientData, gender: g as any })} className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${patientData.gender === g ? 'bg-white shadow-sm text-blue-600 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>{g}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center"><Droplets size={10} className="mr-1" /> Blood Group</label>
                                        <select value={patientData.bloodGroup || ''} onChange={(e) => setPatientData({ ...patientData, bloodGroup: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none">
                                            <option value="">Select</option>
                                            {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center"><Briefcase size={10} className="mr-1" /> Occupation</label>
                                        <input type="text" value={patientData.occupation || ''} onChange={(e) => setPatientData({ ...patientData, occupation: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="Job" />
                                    </div>
                                </div>
                            </div>

                            {/* Address & Contact */}
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center"><MapPin size={12} className="mr-1.5 text-blue-500" /> Contact Info</h4>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                    <input type="text" value={patientData.address || ''} onChange={(e) => setPatientData({ ...patientData, address: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="Street layout" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Area</label>
                                        <input type="text" value={patientData.area || ''} onChange={(e) => setPatientData({ ...patientData, area: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="Locality" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">City/Town</label>
                                        <input type="text" value={patientData.city || ''} onChange={(e) => setPatientData({ ...patientData, city: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="City" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">State</label>
                                        <input type="text" value={patientData.state || ''} onChange={(e) => setPatientData({ ...patientData, state: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="State" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">PIN Code</label>
                                        <input type="text" value={patientData.pin || ''} onChange={(e) => setPatientData({ ...patientData, pin: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="Code" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center"><Mail size={10} className="mr-1" /> Email ID</label>
                                    <input type="email" value={patientData.email || ''} onChange={(e) => setPatientData({ ...patientData, email: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="Email Address" />
                                </div>
                            </div>

                            {/* Clinical Markers */}
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <h4 className="text-[10px] font-black text-rose-800 uppercase tracking-widest flex items-center"><AlertCircle size={12} className="mr-1.5 text-rose-500" /> Clinical Markers</h4>

                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center"><Pill size={10} className="mr-1" /> Med Allergies</label>
                                        <input type="text" value={patientData.allergyMedicine || ''} onChange={(e) => setPatientData({ ...patientData, allergyMedicine: e.target.value })} className="w-full px-3 py-2 bg-rose-50/50 border border-rose-100 rounded-xl outline-none focus:bg-white focus:border-rose-300 font-bold text-sm text-rose-700" placeholder="e.g. Penicillin" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Food/Other Allergies</label>
                                        <input type="text" value={patientData.allergyOther || ''} onChange={(e) => setPatientData({ ...patientData, allergyOther: e.target.value })} className="w-full px-3 py-2 bg-rose-50/50 border border-rose-100 rounded-xl outline-none focus:bg-white focus:border-rose-300 font-bold text-sm text-rose-700" placeholder="e.g. Peanuts, Dust" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Habits & Addictions</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center"><Cigarette size={8} className="mr-1" /> Smoke</label>
                                            <select value={patientData.habits?.smoke || 'No'} onChange={(e) => updateHabit('smoke', e.target.value)} className="w-full px-2 py-1.5 text-[10px] bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold">
                                                <option value="No">No</option><option value="Yes">Yes</option><option value="Occasional">Occasional</option><option value="Past">Past</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center"><Wine size={8} className="mr-1" /> Alcohol</label>
                                            <select value={patientData.habits?.alcohol || 'No'} onChange={(e) => updateHabit('alcohol', e.target.value)} className="w-full px-2 py-1.5 text-[10px] bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold">
                                                <option value="No">No</option><option value="Yes">Yes</option><option value="Occasional">Occasional</option><option value="Past">Past</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Drug Abuse</label>
                                            <select value={patientData.habits?.drugAbuse || 'No'} onChange={(e) => updateHabit('drugAbuse', e.target.value)} className="w-full px-2 py-1.5 text-[10px] bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold">
                                                <option value="No">No</option><option value="Yes">Yes</option><option value="Past">Past</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Referred By</label>
                                    <input type="text" value={patientData.referredBy || ''} onChange={(e) => setPatientData({ ...patientData, referredBy: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white font-bold text-sm" placeholder="Dr. Name / Portal" />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Right Column: Visit Form Integration */}
                <div className="xl:col-span-8">
                    {/* Render VisitForm passing a minimal dummy patient so it functions correctly */}
                    <VisitForm
                        patient={(patientData as Patient)}
                        onSave={handleSaveVisit}
                        onCancel={() => navigate('/')}
                    />
                </div>
            </div>
        </div>
    );
};

export default NewVisit;
