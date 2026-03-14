
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Settings,
  ChevronRight,
  Check,
  Pill,
  ClipboardList,
  Search,
  BookOpen,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { DB } from '../services/db';
import { DiagnosisTemplate, Medicine } from '../types';
import { useToast } from '../context/ToastContext';

const DiagnosisMaster = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'patterns' | 'dictionary'>('patterns');
  const [templates, setTemplates] = useState<DiagnosisTemplate[]>([]);
  const [customDiagnoses, setCustomDiagnoses] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState<number | null>(null); // index or null for templates
  const [editBuffer, setEditBuffer] = useState<DiagnosisTemplate | null>(null);

  // Search state
  const [patternSearch, setPatternSearch] = useState('');
  const [dictSearch, setDictSearch] = useState('');

  // New dictionary term state
  const [newTerm, setNewTerm] = useState('');

  const loadData = async () => {
    const [t, d] = await Promise.all([
      DB.getTemplates(),
      DB.getCustomDiagnoses()
    ]);
    setTemplates(t);
    setCustomDiagnoses(d);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNew = () => {
    const fresh: DiagnosisTemplate = {
      diagnosis: '',
      defaultMedicines: [],
      defaultReports: []
    };
    setEditBuffer(fresh);
    setIsEditing(-1); // -1 signifies new
  };

  const handleEdit = (index: number) => {
    const template = templates[index];
    setEditBuffer(JSON.parse(JSON.stringify(template)));
    setIsEditing(index);
  };

  const handleSave = async () => {
    if (!editBuffer || !editBuffer.diagnosis.trim()) return;

    let updated = [...templates];
    if (isEditing === -1) {
      updated.push(editBuffer);
    } else if (isEditing !== null) {
      updated[isEditing] = editBuffer;
    }

    await DB.saveTemplates(updated);
    setTemplates(updated);
    setIsEditing(null);
    setEditBuffer(null);
  };

  const handleDelete = async (index: number) => {
    toast.confirm({
      title: "Delete Pattern",
      message: "Delete this practice pattern permanently?",
      danger: true,
      onConfirm: async () => {
        const updated = templates.filter((_, i) => i !== index);
        await DB.saveTemplates(updated);
        setTemplates(updated);
        toast.success("Clinical pattern removed");
      }
    });
  };

  // Dictionary management
  const handleAddTerm = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTerm.trim()) return;
    if (customDiagnoses.includes(newTerm.trim())) return;

    const updated = [...customDiagnoses, newTerm.trim()];
    await DB.saveCustomDiagnoses(updated);
    setCustomDiagnoses(updated);
    setNewTerm('');
  };

  const handleDeleteTerm = async (term: string) => {
    toast.confirm({
      title: "Remove Terminology",
      message: `Remove "${term}" from terminology master?`,
      danger: true,
      onConfirm: async () => {
        const updated = customDiagnoses.filter(d => d !== term);
        await DB.saveCustomDiagnoses(updated);
        setCustomDiagnoses(updated);
        toast.success("Terminology record removed");
      }
    });
  };

  // Medicine buffer helpers
  const addMedToBuffer = () => {
    if (!editBuffer) return;
    setEditBuffer({
      ...editBuffer,
      defaultMedicines: [
        ...editBuffer.defaultMedicines,
        { name: '', dosage: '', frequency: '1-0-1', duration: 3, instructions: 'After Food' }
      ]
    });
  };

  const updateMedInBuffer = (idx: number, field: keyof Medicine, value: any) => {
    if (!editBuffer) return;
    const meds = [...editBuffer.defaultMedicines];
    meds[idx] = { ...meds[idx], [field]: value };
    setEditBuffer({ ...editBuffer, defaultMedicines: meds });
  };

  const removeMedFromBuffer = (idx: number) => {
    if (!editBuffer) return;
    setEditBuffer({
      ...editBuffer,
      defaultMedicines: editBuffer.defaultMedicines.filter((_, i) => i !== idx)
    });
  };

  const addReportToBuffer = (val: string) => {
    if (!editBuffer || !val.trim()) return;
    if (editBuffer.defaultReports.includes(val.trim())) return;
    setEditBuffer({
      ...editBuffer,
      defaultReports: [...editBuffer.defaultReports, val.trim()]
    });
  };

  const removeReportFromBuffer = (val: string) => {
    if (!editBuffer) return;
    setEditBuffer({
      ...editBuffer,
      defaultReports: editBuffer.defaultReports.filter(r => r !== val)
    });
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t =>
      t.diagnosis.toLowerCase().includes(patternSearch.toLowerCase())
    );
  }, [templates, patternSearch]);

  const filteredDictionary = useMemo(() => {
    return customDiagnoses.filter(d =>
      d.toLowerCase().includes(dictSearch.toLowerCase())
    ).sort();
  }, [customDiagnoses, dictSearch]);

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Diagnosis Master</h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Practice Standard Terminology & Patterns</p>
        </div>

        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center">
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'patterns' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Clinical Patterns
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dictionary' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Terminology Master
          </button>
        </div>
      </div>

      {activeTab === 'patterns' ? (
        <div className="space-y-6">
          {!editBuffer && (
            <div className="flex flex-col md:flex-row gap-4 px-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Filter patterns by diagnosis..."
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-[13px] font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-sm transition-all"
                  value={patternSearch}
                  onChange={(e) => setPatternSearch(e.target.value)}
                />
              </div>
              <button
                onClick={handleAddNew}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black tracking-widest transition-all shadow-xl shadow-blue-100 uppercase"
              >
                <Plus size={18} />
                <span>New Pattern</span>
              </button>
            </div>
          )}

          {editBuffer ? (
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-4 duration-300">
              <div className="p-8 bg-slate-950 text-white flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                    <Settings size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">{isEditing === -1 ? 'Configure New' : 'Refine'} Pattern</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Establishing clinical defaults</p>
                  </div>
                </div>
                <button onClick={() => { setIsEditing(null); setEditBuffer(null); }} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><X size={24} /></button>
              </div>

              <div className="p-10 space-y-12">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Main Diagnosis / Clinical Condition</label>
                  <input
                    type="text"
                    value={editBuffer.diagnosis}
                    onChange={(e) => setEditBuffer({ ...editBuffer, diagnosis: e.target.value })}
                    className="w-full px-7 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-black text-lg transition-all shadow-sm"
                    placeholder="e.g. Chronic Hypertension"
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center space-x-3">
                      <Pill size={20} className="text-blue-600" />
                      <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Default Medications</label>
                    </div>
                    <button onClick={addMedToBuffer} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center space-x-2 transition-colors">
                      <Plus size={16} strokeWidth={3} />
                      <span>Add Formulation</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editBuffer.defaultMedicines.map((med, idx) => (
                      <div key={idx} className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group hover:border-blue-100 transition-all">
                        <div className="flex-[4]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Medicine Name</p>
                          <input
                            className="w-full bg-white border border-slate-200 px-5 py-3 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                            placeholder="e.g. Tab. Telmisartan"
                            value={med.name}
                            onChange={(e) => updateMedInBuffer(idx, 'name', e.target.value)}
                          />
                        </div>
                        <div className="flex-[1.5]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Dose</p>
                          <input
                            className="w-full bg-white border border-slate-200 px-5 py-3 rounded-xl text-xs text-center font-bold focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                            placeholder="40mg"
                            value={med.dosage}
                            onChange={(e) => updateMedInBuffer(idx, 'dosage', e.target.value)}
                          />
                        </div>
                        <div className="flex-[1.5]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Freq (1-0-1)</p>
                          <input
                            className="w-full bg-white border border-slate-200 px-5 py-3 rounded-xl text-[12px] text-center font-black text-blue-600 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                            placeholder="1-0-1"
                            value={med.frequency}
                            onChange={(e) => updateMedInBuffer(idx, 'frequency', e.target.value)}
                          />
                        </div>
                        <div className="flex-[1]">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Days</p>
                          <input
                            type="number"
                            className="w-full bg-white border border-slate-200 px-3 py-3 rounded-xl text-xs text-center font-bold focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                            value={med.duration}
                            onChange={(e) => updateMedInBuffer(idx, 'duration', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="flex-[2.5] relative">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Timing</p>
                          <select
                            className="w-full bg-white border border-slate-200 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight focus:ring-1 focus:ring-blue-500 outline-none appearance-none shadow-sm"
                            value={med.instructions}
                            onChange={(e) => updateMedInBuffer(idx, 'instructions', e.target.value)}
                          >
                            <option>After Food</option>
                            <option>Before Food</option>
                            <option>With Food</option>
                            <option>Anytime</option>
                          </select>
                        </div>
                        <div className="lg:self-end pb-3">
                          <button onClick={() => removeMedFromBuffer(idx)} className="text-rose-500 hover:bg-rose-50 p-3 rounded-xl transition-all"><Trash2 size={20} /></button>
                        </div>
                      </div>
                    ))}
                    {editBuffer.defaultMedicines.length === 0 && (
                      <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No medications added to this pattern.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-3 border-b-2 border-slate-900 pb-3">
                    <ClipboardList size={20} className="text-indigo-600" />
                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Default Investigations</label>
                  </div>
                  <div className="flex flex-wrap gap-3 p-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                    {editBuffer.defaultReports.map(r => (
                      <span key={r} className="bg-white text-slate-700 px-5 py-3 rounded-2xl text-[11px] font-black uppercase flex items-center border border-slate-200 shadow-sm">
                        {r}
                        <button onClick={() => removeReportFromBuffer(r)} className="ml-3 text-slate-300 hover:text-rose-600 transition-colors"><X size={16} /></button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="+ Add test (Press Enter)"
                      className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:border-blue-500 min-w-[200px] shadow-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addReportToBuffer((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="pt-8 flex space-x-6">
                  <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-100 flex items-center justify-center space-x-3">
                    <Check size={22} strokeWidth={3} />
                    <span>Save Practice Pattern</span>
                  </button>
                  <button onClick={() => { setIsEditing(null); setEditBuffer(null); }} className="px-12 py-5 border-2 border-slate-100 text-slate-400 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
              {filteredTemplates.map((template, idx) => {
                const originalIndex = templates.findIndex(t => t.diagnosis === template.diagnosis);
                return (
                  <div key={idx} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="p-7 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-4 truncate">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-100">
                          <ClipboardList size={18} />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate font-serif-clinical group-hover:text-blue-600 transition-colors">{template.diagnosis}</h4>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        <button onClick={() => handleEdit(originalIndex)} className="p-2.5 text-slate-400 hover:text-blue-600 bg-white rounded-xl shadow-sm border border-slate-100"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(originalIndex)} className="p-2.5 text-slate-400 hover:text-rose-600 bg-white rounded-xl shadow-sm border border-slate-100"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    <div className="p-8 space-y-6 flex-1">
                      <div className="space-y-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                          <Pill size={14} className="mr-3 opacity-40" /> Formulations ({template.defaultMedicines.length})
                        </p>
                        <div className="space-y-2.5">
                          {template.defaultMedicines.slice(0, 3).map((m, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] font-bold text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                              <span className="truncate">{m.name}</span>
                              <span className="text-slate-400 text-[10px] font-black ml-3 shrink-0">{m.dosage}</span>
                            </div>
                          ))}
                          {template.defaultMedicines.length > 3 && (
                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest text-center pt-2 italic">+ {template.defaultMedicines.length - 3} additional medications</p>
                          )}
                          {template.defaultMedicines.length === 0 && (
                            <p className="text-[10px] text-slate-300 font-bold uppercase text-center py-4">No medication defaults</p>
                          )}
                        </div>
                      </div>

                      {template.defaultReports.length > 0 && (
                        <div className="pt-6 border-t border-slate-50 space-y-4">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Default Investigations</p>
                          <div className="flex flex-wrap gap-2">
                            {template.defaultReports.map((r, i) => (
                              <span key={i} className="text-[9px] bg-white px-3 py-1.5 rounded-xl border border-slate-200 font-black text-slate-500 uppercase tracking-tighter shadow-sm">{r}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredTemplates.length === 0 && (
                <div className="col-span-full p-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-200 animate-in fade-in duration-500">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner">
                    <ClipboardList size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-serif-clinical">Zero Patterns Found</h3>
                  <p className="text-[11px] text-slate-400 mt-3 font-bold uppercase tracking-widest leading-relaxed">Establish clinical patterns to automate prescriptions<br />and accelerate your workflow.</p>
                  <button onClick={handleAddNew} className="mt-10 bg-slate-950 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-200">
                    Setup First Pattern
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 px-2">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Add Master Diagnosis</label>
                <form onSubmit={handleAddTerm} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="e.g. Type 2 Diabetes Mellitus"
                    className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-bold text-sm transition-all"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95"
                  >
                    Add to Master
                  </button>
                </form>
              </div>
              <div className="md:w-80 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Dictionary</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Filter terms..."
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none shadow-sm"
                    value={dictSearch}
                    onChange={(e) => setDictSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredDictionary.map(term => (
                  <div key={term} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-200 transition-all">
                    <div className="flex items-center space-x-3 truncate">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <BookOpen size={14} />
                      </div>
                      <span className="text-[12px] font-black text-slate-900 truncate uppercase tracking-tight">{term}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteTerm(term)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {filteredDictionary.length === 0 && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                      <Sparkles size={32} />
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No matching master terminology found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-black font-serif-clinical">Dictionary Intelligence</h2>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Terms added here will appear as high-priority suggestions during consultations across the entire practice. This builds a consistent clinical language for your records.
                </p>
              </div>
              <div className="flex items-center space-x-6 text-center">
                <div className="p-4 bg-white/5 rounded-[2rem] border border-white/10 min-w-[140px]">
                  <p className="text-3xl font-black font-serif-clinical text-blue-400 leading-none">{customDiagnoses.length}</p>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Active Terms</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
              <BookOpen size={200} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosisMaster;
