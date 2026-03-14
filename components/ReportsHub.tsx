
import React, { useMemo, useState, useEffect } from 'react';
import {
  ClipboardList,
  ShieldCheck,
  Wallet,
  History,
  FileText,
  Clock,
  TrendingUp,
  PieChart,
  Target,
  Download,
  Database,
  ArrowRight,
  CalendarDays,
  Users,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DB } from '../services/db';
import { Visit, Patient, Report } from '../types';

const ReportCategory = ({ title, description, icon: Icon, colorClass, children }: any) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-400/50 transition-all duration-300">
    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-4">
      <div className={`p-3 rounded-xl ${colorClass} shadow-sm shrink-0`}><Icon size={18} /></div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">{title}</h3>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{description}</p>
      </div>
    </div>
    <div className="p-2 space-y-1 flex-1">
      {children}
    </div>
  </div>
);

const ReportItem = ({ label, count, link, icon: Icon, onClick, subtitle }: any) => {
  const isNew = count === 'NEW';
  const content = (
    <>
      <div className="flex items-center space-x-4">
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover/item:text-blue-600 group-hover/item:bg-blue-50 transition-all border border-slate-100/50">
          <Icon size={16} />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-600 group-hover/item:text-slate-900 leading-none">{label}</span>
          {subtitle && <p className="text-[9px] font-medium text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <span className={`text-[11px] font-bold px-3 py-1 rounded-lg border ${isNew ? 'bg-blue-600 text-white border-blue-600 animate-pulse' : 'bg-slate-100 text-slate-900 border-slate-100'}`}>
          {count}
        </span>
        <ArrowRight size={16} className="text-slate-200 group-hover/item:text-blue-600 transform group-hover/item:translate-x-1 transition-all" />
      </div>
    </>
  );
  const className = "w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all group/item";
  return onClick ? (
    <button onClick={onClick} className={className}>{content}</button>
  ) : (
    <Link to={link} className={className}>{content}</Link>
  );
};

const ReportsHub = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [v, p, r] = await Promise.all([DB.getVisits(), DB.getPatients(), DB.getReports()]);
      setVisits(v); setPatients(p); setReports(r); setLoading(false);
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const rxRate = visits.length > 0 ? Math.round((visits.filter(v => v.medicines.length > 0).length / visits.length) * 100) : 0;
    return { totalVisits: visits.length, totalPatients: patients.length, totalReports: reports.length, rxRate, pendingCount: visits.filter(v => v.paymentStatus === 'Pending').length };
  }, [visits, patients, reports]);

  if (loading) return <div className="p-10 animate-pulse text-slate-400 font-medium">Analyzing practice data...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="border-b border-slate-100 pb-6">
        <h1 className="text-2xl font-bold text-slate-900">Practice Insights</h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">Reporting and clinical audit hub</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ReportCategory title="Clinical Records" description="Histories & Archives" icon={ClipboardList} colorClass="bg-blue-50 text-blue-600">
          <ReportItem label="Consolidated Labs" subtitle="Digitized Investigation Results" count={stats.totalReports} icon={FileText} link="/reports/lab" />
          <ReportItem label="Disease Prevalence" subtitle="Primary Clinical Clusters" count="INDEX" icon={PieChart} link="/reports/prevalence" />
          <ReportItem label="Medication Insights" subtitle="Pharmacy Usage Patterns" count="Rx" icon={Target} link="/reports/medication" />
        </ReportCategory>
        <ReportCategory title="Practice Growth" description="Loyalty & Channel Mapping" icon={TrendingUp} colorClass="bg-indigo-50 text-indigo-600">
          <ReportItem label="Patient Retention" subtitle="Clinical Continuity Score" count={`${stats.rxRate}%`} icon={Clock} link="/reports/retention" />
          <ReportItem label="Demographic Personas" subtitle="Age/Gender Segment Audit" count="LIVE" icon={Users} link="/reports/demographics" />
          <ReportItem label="Growth Channels" subtitle="Referral Source Analysis" count="NEW" icon={Globe} link="/reports/referral" />
        </ReportCategory>
        <ReportCategory title="Practice Revenue" description="Billing & Collections" icon={Wallet} colorClass="bg-emerald-50 text-emerald-600">
          <ReportItem label="Pending Accounts" subtitle="Outstanding Dues Ledger" count={stats.pendingCount} icon={Clock} link="/reports/financial" />
          <ReportItem label="Day-wise Patient Revenue" subtitle="Detailed Historical Ledger" count="NEW" icon={CalendarDays} link="/reports/day-wise-revenue" />
          <ReportItem label="Channel Analysis" subtitle="Cash vs Card vs UPI Breakdown" count="NEW" icon={PieChart} link="/reports/settlement" />
        </ReportCategory>
        <ReportCategory title="Administration" description="Database Maintenance" icon={Database} colorClass="bg-slate-100 text-slate-600">
          <ReportItem label="Patient Registry" subtitle="Bulk Patient CSV Export" count="DL" icon={Download} onClick={() => DB.exportToCSV('patients')} />
        </ReportCategory>
      </div>

      <div className="bg-slate-900 rounded-2xl p-10 text-white shadow-xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-xl font-bold">System Quality Audit</h2>
            <p className="text-slate-400 text-xs font-medium leading-relaxed uppercase tracking-wider">
              Based on meaningful use standards, your practice is operating with <span className="text-blue-400 font-bold">{stats.rxRate}% digital compliance</span>. Data integrity score is currently <span className="text-emerald-400 font-bold">OPTIMAL</span>.
            </p>
          </div>
          <div className="text-center shrink-0">
            <p className="text-6xl font-bold text-blue-400">{stats.rxRate}%</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mt-4">E-Rx ADHERENCE</p>
          </div>
        </div>
        <ShieldCheck size={200} className="absolute -right-12 -bottom-12 text-white opacity-5 group-hover:scale-110 transition-transform duration-700" />
      </div>
    </div>
  );
};

export default ReportsHub;
