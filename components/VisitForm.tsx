
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Minus,
  X,
  Check,
  Save,
  Upload,
  FileText,
  Image as ImageIcon,
  Printer,
  ChevronDown,
  BookOpen,
  Sparkles,
  Loader2,
  Pill,
  Droplets,
  Syringe,
  Beaker,
  RefreshCcw,
  AlertCircle,
  FileEdit,
  Activity,
  History as HistoryIcon,
  Paperclip,
  IndianRupee,
  Files
} from 'lucide-react';
import { Medicine, Visit, Patient, Report, DiagnosisTemplate, Vitals } from '../types';
import { DB } from '../services/db';
import { PAYMENT_METHODS, GLOBAL_DIAGNOSES } from '../constants';
import { GoogleGenAI } from "@google/genai";
import VoiceInput from './VoiceInput';
import { useToast } from '../context/ToastContext';

interface VisitFormProps {
  patient: Patient;
  onSave: (visit: Visit, shouldPrint?: boolean) => void;
  onCancel: () => void;
  initialVisit?: Partial<Visit>;
}

interface DiagnosisSuggestion {
  name: string;
  source: 'template' | 'custom' | 'history' | 'global' | 'ai';
  template?: DiagnosisTemplate;
}

const MEDICINE_INSTRUCTIONS = [
  "After Food",
  "Before Food",
  "With Food",
  "On an empty stomach",
  "At Bedtime",
  "Anytime",
  "Dissolve in water",
  "Apply locally"
];

const VisitForm: React.FC<VisitFormProps> = ({ patient, onSave, onCancel, initialVisit }) => {
  const isEditing = !!initialVisit?.id;
  const toast = useToast();
  const [diagnosis, setDiagnosis] = useState(initialVisit?.diagnosis || '');
  const [medicines, setMedicines] = useState<Medicine[]>(initialVisit?.medicines || []);
  const [reportsOrdered, setReportsOrdered] = useState<string[]>(initialVisit?.reportsOrdered || []);
  const [uploadedReports, setUploadedReports] = useState<Report[]>([]);
  const [prescriptionNotes, setPrescriptionNotes] = useState(initialVisit?.prescriptionNotes || '');
  const [existingMedicines, setExistingMedicines] = useState(initialVisit?.existingMedicines || '');
  const [pastHistoryNotes, setPastHistoryNotes] = useState(patient.pastHistoryNotes || '');
  const [amount, setAmount] = useState(initialVisit?.amount ?? 500);
  const [paymentMethod, setPaymentMethod] = useState<Visit['paymentMethod']>(initialVisit?.paymentMethod || 'Cash');
  const [vitals, setVitals] = useState<Vitals>(initialVisit?.vitals || {});

  const [showTemplates, setShowTemplates] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<DiagnosisSuggestion[]>([]);

  const [showDraftToast, setShowDraftToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [templates, setTemplates] = useState<DiagnosisTemplate[]>([]);
  const [customDiagnoses, setCustomDiagnoses] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionDocInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const medDropdownRef = useRef<HTMLDivElement>(null);
  const autoSaveIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [v, t, d] = await Promise.all([
        DB.getVisits(),
        DB.getTemplates(),
        DB.getCustomDiagnoses()
      ]);
      setAllVisits(v);
      setTemplates(t);
      setCustomDiagnoses(d);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (vitals.weight && vitals.height) {
      const heightInMeters = vitals.height / 100;
      const bmiValue = parseFloat((vitals.weight / (heightInMeters * heightInMeters)).toFixed(1));
      if (vitals.bmi !== bmiValue) {
        setVitals(prev => ({ ...prev, bmi: bmiValue }));
      }
    }
  }, [vitals.weight, vitals.height]);

  useEffect(() => {
    const draft = DB.getDraft(patient.mobile);
    if (draft && !isEditing) {
      setShowDraftToast(true);
    }

    autoSaveIntervalRef.current = window.setInterval(() => {
      if (diagnosis || medicines.length > 0 || prescriptionNotes || existingMedicines || Object.keys(vitals).length > 0) {
        DB.saveDraft(patient.mobile, { diagnosis, medicines, reportsOrdered, amount, paymentMethod, prescriptionNotes, existingMedicines, vitals, pastHistoryNotes });
      }
    }, 30000);

    return () => {
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    };
  }, [patient.mobile, isEditing, diagnosis, medicines, reportsOrdered, amount, paymentMethod, prescriptionNotes, vitals, pastHistoryNotes]);

  const restoreDraft = () => {
    const draft = DB.getDraft(patient.mobile);
    if (draft) {
      setDiagnosis(draft.diagnosis || '');
      setMedicines(draft.medicines || []);
      setReportsOrdered(draft.reportsOrdered || []);
      setAmount(draft.amount || 500);
      setPaymentMethod(draft.paymentMethod || 'Cash');
      setPrescriptionNotes(draft.prescriptionNotes || '');
      setExistingMedicines(draft.existingMedicines || '');
      setPastHistoryNotes(draft.pastHistoryNotes || '');
      setVitals(draft.vitals || {});
      setShowDraftToast(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: Report['type'] = 'Lab') => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newReport: Report = {
          id: Math.random().toString(36).substr(2, 9),
          type: type,
          description: file.name,
          date: new Date().toISOString(),
          fileName: file.name,
          fileData: reader.result as string
        };
        setUploadedReports(prev => [...prev, newReport]);
      };
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = '';
  };

  const removeUploadedReport = (id: string) => setUploadedReports(prev => prev.filter(r => r.id !== id));

  const handleSave = async (shouldPrint: boolean = false) => {
    if (isSaving) return;

    if (!diagnosis.trim() && medicines.length === 0 && !prescriptionNotes.trim() && reportsOrdered.length === 0) {
      toast.error('Cannot save empty consultation. Please add a diagnosis, medicine, test, or note.');
      return;
    }

    setIsSaving(true);

    try {
      DB.clearDraft(patient.mobile);
      await DB.savePatient({ ...patient, pastHistoryNotes });
      await Promise.all(uploadedReports.map(report => DB.saveReport({ ...report, patientMobile: patient.mobile } as any)));

      const newVisit: Visit = {
        id: initialVisit?.id || Math.random().toString(36).substr(2, 9),
        patientMobile: patient.mobile,
        date: initialVisit?.date || new Date().toISOString(),
        diagnosis,
        medicines,
        reportsOrdered,
        reportIds: [...(initialVisit?.reportIds || []), ...uploadedReports.map(r => r.id)],
        amount: Number(amount),
        paymentMethod,
        paymentStatus: paymentMethod === 'Due Payment' ? 'Pending' : 'Paid',
        prescriptionNotes,
        existingMedicines,
        vitals
      };
      await onSave(newVisit, shouldPrint);
    } catch (err) {
      console.error("Save error:", err);
      setIsSaving(false);
      toast.error("An error occurred while saving the record. Please check your connection.");
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    if (diagnosis.length < 3 || !process.env.API_KEY) {
      setAiSuggestions([]);
      return;
    }
    searchTimeoutRef.current = window.setTimeout(async () => {
      setIsSearchingAI(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Return a simple list of 10 unique, medical diagnoses that start with: "${diagnosis}". Respond with names ONLY, one per line.`,
          config: { temperature: 0.1, maxOutputTokens: 200 },
        });
        const text = response.text || "";
        const terms = text.split('\n').map(t => t.trim()).filter(t => t.length > 0);
        setAiSuggestions(terms.map(t => ({ name: t, source: 'ai' })));
      } catch (error) {
        console.error("AI Search Failed:", error);
      } finally {
        setIsSearchingAI(false);
      }
    }, 600);
    return () => { if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current); };
  }, [diagnosis]);

  const localSuggestions = useMemo(() => {
    const suggestions: Map<string, DiagnosisSuggestion> = new Map();
    templates.forEach(t => suggestions.set(t.diagnosis.toLowerCase(), { name: t.diagnosis, source: 'template', template: t }));
    customDiagnoses.forEach(d => {
      const key = d.toLowerCase();
      if (!suggestions.has(key)) suggestions.set(key, { name: d, source: 'custom' });
    });
    allVisits.forEach(v => {
      if (v.diagnosis) {
        const key = v.diagnosis.toLowerCase();
        if (!suggestions.has(key)) suggestions.set(key, { name: v.diagnosis, source: 'history' });
      }
    });
    GLOBAL_DIAGNOSES.forEach(term => {
      const key = term.toLowerCase();
      if (!suggestions.has(key)) suggestions.set(key, { name: term, source: 'global' });
    });
    return Array.from(suggestions.values());
  }, [templates, customDiagnoses, allVisits]);

  const filteredSuggestions = useMemo(() => {
    let combined = [...localSuggestions];
    if (aiSuggestions.length > 0) {
      const localKeys = new Set(combined.map(s => s.name.toLowerCase()));
      const uniqueAi = aiSuggestions.filter(s => !localKeys.has(s.name.toLowerCase()));
      combined = [...combined, ...uniqueAi];
    }
    if (!diagnosis) return combined.slice(0, 15);
    return combined
      .filter(s => s.name.toLowerCase().includes(diagnosis.toLowerCase()))
      .sort((a, b) => {
        const order = { template: 0, custom: 1, history: 2, ai: 3, global: 4 };
        return order[a.source as keyof typeof order] - order[b.source as keyof typeof order];
      })
      .slice(0, 20);
  }, [diagnosis, localSuggestions, aiSuggestions]);

  const applySuggestion = (suggestion: DiagnosisSuggestion) => {
    setDiagnosis(suggestion.name);
    if (suggestion.source === 'template' && suggestion.template) {
      setMedicines(suggestion.template.defaultMedicines.map(m => ({ ...m, id: Math.random().toString(36).substr(2, 9) } as Medicine)));
      setReportsOrdered([...suggestion.template.defaultReports]);
    }
    setShowTemplates(false);
  };

  const addMedicine = () => {
    setMedicines([...medicines, { id: Math.random().toString(36).substr(2, 9), name: '', dosage: '', frequency: '1-0-1', duration: 3, instructions: 'After Food' }]);
  };

  const removeMedicine = (id: string) => setMedicines(medicines.filter(m => m.id !== id));
  const updateMedicine = (id: string, field: keyof Medicine, value: any) => setMedicines(medicines.map(m => m.id === id ? { ...m, [field]: value } : m));
  const toggleReport = (report: string) => reportsOrdered.includes(report) ? setReportsOrdered(reportsOrdered.filter(r => r !== report)) : setReportsOrdered([...reportsOrdered, report]);

  const updateVitals = (field: keyof Vitals, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setVitals(prev => ({ ...prev, [field]: numValue }));
  };

  const handleCancelAction = () => {
    DB.clearDraft(patient.mobile);
    onCancel();
  };

  const quickSelectTests = ["CBC", "FBS", "HbA1c", "ECG", "X-Ray Chest", "USG ABD", "LFT", "KFT"];

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 w-full mx-auto flex flex-col no-print relative">
      {showDraftToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 animate-in slide-in-from-top-4">
          <div className="bg-slate-900 text-white p-6 rounded-[1.5rem] shadow-2xl border border-white/10 flex flex-col space-y-4">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-600 rounded-xl">
                <RefreshCcw size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Continuity Recovery</p>
                <p className="text-xs font-bold mt-1">Restore unsaved consultation draft?</p>
              </div>
              <button onClick={() => setShowDraftToast(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex space-x-3">
              <button onClick={restoreDraft} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Yes, Restore</button>
              <button onClick={() => { DB.clearDraft(patient.mobile); setShowDraftToast(false); }} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Discard</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#050912] text-white px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] leading-none opacity-60">
              {isEditing ? 'Update Prescription' : 'Consultation Entry'}
            </h2>
            <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[8px] font-black uppercase text-emerald-500">Auto-Saving Enabled</span>
            </div>
          </div>
          <p className="text-sm font-black text-blue-400 mt-2 tracking-tight font-serif-clinical">Modifying {patient.name}</p>
        </div>
        <button onClick={handleCancelAction} className="p-2.5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
          <X size={22} strokeWidth={1.5} />
        </button>
      </div>

      <div className="p-8 space-y-10 overflow-y-auto">
        {/* Past History Context */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b-2 border-slate-900 pb-3">
            <HistoryIcon size={18} className="text-indigo-600" />
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Past Medical History / Chronic Records</label>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <VoiceInput
                value={pastHistoryNotes}
                onTranscript={setPastHistoryNotes}
                isTextArea
                placeholder="Chronic conditions, surgical history, allergies, or past medical events..."
                className="w-full p-6 bg-indigo-50/20 border border-slate-200 rounded-[2rem] focus:ring-1 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-sm text-slate-900 min-h-[100px] shadow-inner resize-none"
              />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full min-h-[100px] border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center space-y-2 hover:bg-slate-50 hover:border-indigo-400 transition-all text-slate-400 group"
              >
                <Paperclip size={24} className="group-hover:text-indigo-600 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-slate-700">Attach Old Records</span>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'Past Record')} />
              </button>
            </div>
          </div>

          {uploadedReports.filter(r => r.type === 'Past Record').length > 0 && (
            <div className="flex flex-wrap gap-3">
              {uploadedReports.filter(r => r.type === 'Past Record').map(r => (
                <div key={r.id} className="flex items-center space-x-3 px-4 py-2 bg-indigo-100/50 text-indigo-700 rounded-xl border border-indigo-200 text-[10px] font-black uppercase tracking-tight">
                  <FileText size={12} />
                  <span className="truncate max-w-[150px]">{r.description}</span>
                  <button onClick={() => removeUploadedReport(r.id)} className="hover:text-rose-600"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Ongoing Medications */}
        <div className="space-y-6 bg-amber-50/30 p-8 rounded-[2rem] border border-amber-100/50">
          <div className="flex items-center space-x-2 border-b-2 border-amber-900/20 pb-3">
            <Pill size={18} className="text-amber-600" />
            <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Current Ongoing Medications (Other Consultations)</label>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] text-amber-700/60 font-medium italic">Record medicines the patient is already taking from previous doctors or other ongoing treatments.</p>
            <VoiceInput
              value={existingMedicines}
              onTranscript={setExistingMedicines}
              isTextArea
              placeholder="e.g. Tab. Dolo (650mg) by Dr. Sharma, Syrup Alex twice daily..."
              className="w-full p-6 bg-white border border-amber-200 rounded-[2rem] focus:ring-1 focus:ring-amber-500 outline-none transition-all font-medium text-sm text-slate-900 min-h-[80px] shadow-sm"
            />
          </div>
        </div>

        {/* Vitals Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b-2 border-slate-900 pb-3">
            <Activity size={18} className="text-emerald-600" />
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Vitals</label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <VitalInput label="Weight (kg)" value={vitals.weight} onChange={(v) => updateVitals('weight', v)} />
            <VitalInput label="Height (cm)" value={vitals.height} onChange={(v) => updateVitals('height', v)} />
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">BMI</label>
              <div className={`px-4 py-3 rounded-xl border font-bold text-xs flex items-center justify-center transition-all ${vitals.bmi ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                {vitals.bmi || '--'}
              </div>
            </div>
            <VitalInput label="Temp (°F)" value={vitals.temp} onChange={(v) => updateVitals('temp', v)} />
            <VitalInput label="Pulse (bpm)" value={vitals.pulse} onChange={(v) => updateVitals('pulse', v)} />
            <div className="col-span-1 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">BP (Sys/Dia)</label>
              <div className="flex space-x-1">
                <input type="number" placeholder="Sys" className="w-1/2 px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs text-center" value={vitals.bp_sys || ''} onChange={(e) => updateVitals('bp_sys', e.target.value)} />
                <input type="number" placeholder="Dia" className="w-1/2 px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs text-center" value={vitals.bp_dia || ''} onChange={(e) => updateVitals('bp_dia', e.target.value)} />
              </div>
            </div>
            <VitalInput label="SpO2 (%)" value={vitals.spo2} onChange={(v) => updateVitals('spo2', v)} />
            <VitalInput label="Resp (bpm)" value={vitals.respRate} onChange={(v) => updateVitals('respRate', v)} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Diagnosis</label>
              {isSearchingAI && (
                <div className="flex items-center space-x-2 text-[9px] font-bold text-purple-600 animate-pulse uppercase tracking-widest">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Searching Index...</span>
                </div>
              )}
            </div>
            <div className="relative">
              <VoiceInput
                value={diagnosis}
                onTranscript={(text) => { setDiagnosis(text); setShowTemplates(true); }}
                placeholder="Search practice terminology..."
                className="w-full px-6 py-4 bg-[#f8fafc] border border-slate-200 rounded-2xl focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold text-sm text-slate-900 shadow-sm"
              />
              {showTemplates && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 overflow-hidden border-t-0">
                  <div className="max-h-80 overflow-y-auto">
                    {filteredSuggestions.map((s, idx) => (
                      <button key={idx} type="button" onClick={() => applySuggestion(s)} className="w-full text-left px-6 py-4 hover:bg-blue-50/50 flex items-center justify-between group transition-all border-b border-slate-50 last:border-none">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-xl ${s.source === 'template' ? 'bg-blue-100 text-blue-600' :
                            s.source === 'custom' ? 'bg-indigo-600 text-white' :
                              s.source === 'history' ? 'bg-slate-100 text-slate-500' :
                                s.source === 'ai' ? 'bg-purple-100 text-purple-600' :
                                  'bg-slate-50 text-slate-400'
                            }`}>
                            {s.source === 'template' ? <Save size={16} /> :
                              s.source === 'custom' ? <BookOpen size={16} /> :
                                s.source === 'history' ? <HistoryIcon size={16} /> :
                                  s.source === 'ai' ? <Sparkles size={16} /> :
                                    <BookOpen size={16} />}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-slate-900 group-hover:text-blue-700 uppercase tracking-tight">{s.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {s.source === 'template' ? 'Pattern' :
                                s.source === 'custom' ? 'Master Term' :
                                  s.source === 'history' ? 'Patient History' :
                                    s.source === 'ai' ? 'Universal Index' :
                                      'Reference Library'}
                            </p>
                          </div>
                        </div>
                        {s.source === 'template' && <Check size={16} className="text-blue-500 opacity-0 group-hover:opacity-100" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investigations Advised</label>
            <div className="flex flex-wrap gap-2.5 mb-4 min-h-[50px] p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              {reportsOrdered.length > 0 ? (
                reportsOrdered.map(r => (
                  <span key={r} className="inline-flex items-center space-x-2 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wide shadow-md">
                    <span>{r}</span>
                    <button onClick={() => toggleReport(r)} className="hover:bg-white/20 rounded-full p-0.5"><X size={12} /></button>
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-slate-300 font-bold uppercase py-2">No tests ordered for this session</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {quickSelectTests.map(r => (
                <button key={r} type="button" onClick={() => toggleReport(r)} className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${reportsOrdered.includes(r) ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Consultation Document Vault */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b-2 border-slate-900 pb-3">
            <Files size={18} className="text-blue-600" />
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultation Digital Vault</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4">
              <button
                type="button"
                onClick={() => sessionDocInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-400 transition-all text-slate-400 group bg-slate-50/50"
              >
                <Upload size={24} className="group-hover:text-blue-600 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-slate-700">Scan Session Doc</span>
                <input ref={sessionDocInputRef} type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'Other')} />
              </button>
            </div>
            <div className="md:col-span-8">
              <div className="flex flex-wrap gap-3">
                {uploadedReports.filter(r => r.type !== 'Past Record').map(r => (
                  <div key={r.id} className="group relative w-32 h-32 bg-slate-100 rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm">
                    {r.fileData.includes('pdf') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <FileText size={32} className="text-rose-500" />
                        <span className="text-[8px] font-black uppercase mt-2 text-center truncate w-full">{r.description}</span>
                      </div>
                    ) : (
                      <img src={r.fileData} className="w-full h-full object-cover" alt="Doc" />
                    )}
                    <button
                      onClick={() => removeUploadedReport(r.id)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {uploadedReports.filter(r => r.type !== 'Past Record').length === 0 && (
                  <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-slate-50 rounded-[2rem]">
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">No session documents uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-[2px] border-slate-900 pb-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Prescription</label>
            <button type="button" onClick={addMedicine} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center space-x-2 transition-colors">
              <Plus size={18} strokeWidth={3} />
              <span>Add Formulation</span>
            </button>
          </div>
          <div className="space-y-4" ref={medDropdownRef}>
            {medicines.map((m) => (
              <div key={m.id} className="flex flex-col md:flex-row items-stretch md:items-center space-y-4 md:space-y-0 md:space-x-3 bg-white p-4 rounded-[1.5rem] border border-slate-100 group transition-all hover:border-blue-200 shadow-sm relative">
                <div className="flex-[4.5] relative">
                  <VoiceInput
                    value={m.name}
                    onTranscript={(text) => updateMedicine(m.id, 'name', text)}
                    placeholder="Formulation name (e.g. Tab. Paracetamol)"
                    className="w-full px-5 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex flex-row space-x-2 md:flex-[5.5]">
                  <input className="w-1/4 px-2 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs font-bold text-center focus:ring-1 focus:ring-blue-500 outline-none" value={m.dosage} onChange={(e) => updateMedicine(m.id, 'dosage', e.target.value)} placeholder="Dose" />
                  <input className="w-1/4 px-2 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs text-center font-bold text-blue-600 focus:ring-1 focus:ring-blue-500 outline-none" value={m.frequency} onChange={(e) => updateMedicine(m.id, 'frequency', e.target.value)} placeholder="1-0-1" />
                  <input type="number" className="w-1/6 px-2 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs text-center font-bold focus:ring-1 focus:ring-blue-500 outline-none" value={m.duration} onChange={(e) => updateMedicine(m.id, 'duration', parseInt(e.target.value))} placeholder="Days" />
                  <div className="w-1/3 relative">
                    <select className="w-full bg-[#f8fafc] border border-slate-200 pl-4 pr-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-tight appearance-none focus:ring-1 focus:ring-blue-500 outline-none" value={m.instructions} onChange={(e) => updateMedicine(m.id, 'instructions', e.target.value)}>
                      {MEDICINE_INSTRUCTIONS.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <button type="button" onClick={() => removeMedicine(m.id)} className="text-rose-500 p-2.5 hover:bg-rose-50 rounded-xl"><Minus size={20} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b-2 border-slate-900 pb-3">
            <FileEdit size={18} className="text-blue-600" />
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Notes & Advice</label>
          </div>
          <VoiceInput
            value={prescriptionNotes}
            onTranscript={setPrescriptionNotes}
            isTextArea
            enableRefine
            placeholder="Speak natural advice or clinical observations. Click 'Sparkles' to refine notes..."
            className="w-full p-6 bg-[#f8fafc] border border-slate-200 rounded-[2rem] focus:ring-1 focus:ring-blue-500 outline-none min-h-[100px]"
          />
        </div>

        <div className="pt-8 border-t border-slate-100">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-5">
            <div className="flex-1 lg:flex-[0.8] space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Revenue</label>
              <div className="bg-[#050912] text-white px-6 h-16 rounded-2xl shadow-xl flex items-center w-full">
                <IndianRupee size={18} className="text-blue-400 mr-4" />
                <input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="bg-transparent border-none outline-none font-black text-xl w-full focus:ring-0" />
              </div>
            </div>
            <div className="flex-1 lg:flex-[1] space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settlement Channel</label>
              <div className="relative h-16">
                <select className="w-full h-full pl-6 pr-12 bg-[#f8fafc] border border-slate-200 rounded-2xl font-bold text-xs focus:ring-1 focus:ring-blue-500 appearance-none" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="flex-1 lg:flex-[1] h-16 bg-white border-2 border-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center space-x-3 active:scale-95 shadow-md disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>{isEditing ? 'Update Only' : 'Save Only'}</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="flex-1 lg:flex-[1.2] h-16 bg-[#2563eb] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 flex items-center justify-center space-x-4 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
              <span>{isEditing ? 'Update & Print' : 'Print Prescription'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VitalInput = ({ label, value, onChange }: { label: string, value: number | undefined, onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input type="number" step="any" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs text-center" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="--" />
  </div>
);

export default VisitForm;
