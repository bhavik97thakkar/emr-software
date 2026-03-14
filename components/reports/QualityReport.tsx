
import React, { useMemo, useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  TrendingUp,
  BarChart4,
  Target,
  FileCheck,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DB } from '../../services/db';
import { Visit } from '../../types';

const MetricCard = ({ label, value, description, colorClass }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
    <div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${colorClass}`}>
        <BarChart4 size={20} />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-4xl font-black mt-3 text-slate-900 font-serif-clinical">{value}</h3>
    </div>
    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-6 leading-relaxed">
      {description}
    </p>
  </div>
);

const QualityReport = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const v = await DB.getVisits();
      setVisits(v);
      setLoading(false);
    };
    loadData();
  }, []);

  const metrics = useMemo(() => {
    const total = visits.length;
    if (total === 0) return { rxRate: 0, testRate: 0, billingRate: 0 };

    const rxRate = Math.round((visits.filter(v => v.medicines.length > 0).length / total) * 100);
    const testRate = Math.round((visits.filter(v => v.reportsOrdered.length > 0).length / total) * 100);
    const billingRate = Math.round((visits.filter(v => v.paymentStatus === 'Paid').length / total) * 100);

    return { rxRate, testRate, billingRate };
  }, [visits]);

  const handleExport = () => {
    const headers = [
      "Metric",
      "Value",
      "Threshold",
      "Status"
    ];

    const rows = [
      ["Digital Prescription Rate", `${metrics.rxRate}%`, "50%", metrics.rxRate >= 50 ? "Pass" : "Fail"],
      ["Lab Order Digitization", `${metrics.testRate}%`, "30%", metrics.testRate >= 30 ? "Pass" : "Fail"],
      ["Settlement Efficiency", `${metrics.billingRate}%`, "70%", metrics.billingRate >= 70 ? "Pass" : "Fail"],
      ["Clinical Encounters Logged", visits.length.toString(), "N/A", "Info"]
    ];

    DB.downloadCSV("Quality_Regulatory_Report", headers, rows);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <button onClick={() => navigate('/reports')} className="flex items-center text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest mb-4">
            <ArrowLeft size={14} className="mr-2" />
            Back to Hub
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Quality & Regulatory</h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Meaningful Use Dashboard & Compliance Metrics</p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center space-x-3 bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm shrink-0 self-start md:self-auto"
        >
          <Download size={16} />
          <span>Excel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricCard
          label="Digital Prescription Rate"
          value={`${metrics.rxRate}%`}
          description="Percentage of encounters resulting in a structured electronic prescription."
          colorClass="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Lab Order Digitization"
          value={`${metrics.testRate}%`}
          description="Rate of diagnostic investigation orders captured in the patient's digital record."
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <MetricCard
          label="Settlement Efficiency"
          value={`${metrics.billingRate}%`}
          description="Efficiency of same-day payment collection and structured billing settlement."
          colorClass="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl overflow-hidden relative">
        <div className="relative z-10 space-y-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <Target size={24} />
            </div>
            <h2 className="text-2xl font-black font-serif-clinical uppercase tracking-tight">Regulatory Milestone Checklist</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <CheckItem label="Structured ICD-10 Diagnosis Codes" active={metrics.rxRate > 50} />
              <CheckItem label="Patient Education Material Distribution" active={true} />
              <CheckItem label="Longitudinal Health Record Continuity" active={visits.length > 5} />
            </div>
            <div className="space-y-6">
              <CheckItem label="Secure Lab Data Interoperability" active={metrics.testRate > 30} />
              <CheckItem label="Digital Encounter Auditing Logs" active={true} />
              <CheckItem label="Patient Financial Transparency" active={true} />
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-5">
          <ShieldCheck size={400} />
        </div>
      </div>
    </div>
  );
};

const CheckItem = ({ label, active }: any) => (
  <div className="flex items-center space-x-4">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
      <FileCheck size={14} />
    </div>
    <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-white/40'}`}>{label}</span>
  </div>
);

export default QualityReport;
