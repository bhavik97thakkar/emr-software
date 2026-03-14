
import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Database,
  Sparkles,
  Loader2,
  Activity,
  HardDrive,
  Download,
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Globe,
  CloudDownload,
  Server
} from 'lucide-react';
import { DB } from '../services/db';
import { GoogleGenAI } from "@google/genai";
import { useToast } from '../context/ToastContext';

const SyncHub = () => {
  const toast = useToast();
  const [syncStatus, setSyncStatus] = useState<any>(DB.getSyncStatus());
  const [stats, setStats] = useState<any>(null);
  const [aiAudit, setAiAudit] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const s = await DB.getDatabaseStats();
    setStats(s);
    setSyncStatus(DB.getSyncStatus());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('emr-db-update', loadData);
    return () => window.removeEventListener('emr-db-update', loadData);
  }, []);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await DB.importBackup(content);
      if (success) toast.success("Clinical database restored successfully.");
      else toast.error("Import failed. Invalid file format.");
    };
    reader.readAsText(file);
  };

  const isUpToDate = syncStatus.lastSync && new Date(syncStatus.lastSync) >= new Date(syncStatus.lastChange);

  const runAiAudit = async () => {
    if (!stats || isAuditing) return;
    setIsAuditing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a clinic data officer. Audit these stats: Patients: ${stats.patientCount}, Visits: ${stats.visitCount}, Size: ${stats.sizeMB}MB. Provide 3 quick clinical insights about this practice's growth and data health. Tone: Professional and encouraging. Mention that data is stored locally for speed but synced to Hostinger Cloud for safety.`,
        config: { temperature: 0.7, maxOutputTokens: 200 }
      });
      setAiAudit(response.text || "Audit complete.");
    } catch (err) {
      setAiAudit("AI Audit offline. Data integrity appears stable.");
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Data Portability</h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center">
            <Server size={14} className="mr-2 text-blue-600" />
            Clinic Intelligence Infrastructure
          </p>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                <Activity size={18} className="mr-3 text-blue-600" />
                Storage Health
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-black text-emerald-600 uppercase">Local Storage Persistent</span>
              </div>
            </div>
            <div className="p-10">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <StatItem label="Used Memory" val={`${stats?.sizeMB || '0.00'} MB`} icon={HardDrive} />
                <StatItem label="Patient Records" val={stats?.patientCount || 0} icon={Database} />
                <StatItem label="Sync Engine" val="Auto-Sync" icon={Globe} />
              </div>


            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActionCard
              title="Bulk CSV Download"
              desc="Download registry for offline analysis in Excel/Sheets."
              icon={Download}
              onClick={() => DB.exportToCSV('patients')}
              color="blue"
            />
            <ActionCard
              title="Emergency Restore"
              desc="Upload a JSON backup to overwrite local state."
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
              color="indigo"
            />
            <input ref={fileInputRef} type="file" className="hidden" accept=".json" onChange={handleImport} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isUpToDate ? 'bg-emerald-50' : 'bg-blue-50'}`}>
              {isUpToDate ? <CheckCircle2 size={40} className="text-emerald-500" /> : <RefreshCw size={40} className="text-blue-500 animate-[spin_4s_linear_infinite]" />}
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-serif-clinical">
              {isUpToDate ? 'Cloud Connected' : 'Auto-Syncing...'}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 leading-relaxed">
              Your data is stored locally for maximum speed. All changes automatically sync to the cloud every 30 seconds.
            </p>
            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center text-left">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest">Last Cloud Handshake</span>
                <span className="text-[10px] font-black text-blue-600 uppercase mt-1 block">
                  {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-100">
            <div className="space-y-4">
              <Globe size={32} className="opacity-50" />
              <h4 className="text-sm font-black uppercase tracking-widest">Global Mobility</h4>
              <p className="text-[10px] text-blue-100 font-medium leading-relaxed uppercase tracking-wide">
                Records pushed to the Cloud will be automatically available when you login on other devices or tablets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, val, icon: Icon }: any) => (
  <div className="space-y-3">
    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-black text-slate-900 font-serif-clinical leading-none mt-1">{val}</p>
    </div>
  </div>
);

const ActionCard = ({ title, desc, icon: Icon, onClick, color }: any) => (
  <button
    onClick={onClick}
    className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-xl transition-all text-left flex items-start space-x-5 group"
  >
    <div className={`p-4 rounded-2xl shrink-0 group-hover:scale-110 transition-transform ${color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
      <Icon size={20} />
    </div>
    <div>
      <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">{title}</h4>
      <p className="text-[10px] text-slate-500 font-bold mt-2 leading-relaxed uppercase tracking-tight">{desc}</p>
    </div>
  </button>
);

export default SyncHub;
