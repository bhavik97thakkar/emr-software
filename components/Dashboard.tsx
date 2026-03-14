
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Wallet,
  Clock,
  UserCheck,
  Plus,
  CalendarCheck,
  Activity,
  Stethoscope,
  ChevronRight,
  AlertCircle,
  Calendar,
  CloudUpload,
  Network,
  X,
  Search,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { DB } from '../services/db';
import { Visit, Patient, Appointment, Family } from '../types';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, trend, trendValue, onClick, to }: any) => {
  const CardWrapper = to ? Link : 'div';
  return (
    <CardWrapper 
      to={to}
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col justify-between transition-all hover:border-blue-400/50 shadow-sm group ${onClick || to ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ${colorClass} shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 mt-2 font-serif-clinical tracking-tight">{value}</h3>
        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{subtitle}</p>
      </div>
    </CardWrapper>
  );
};

type TimeRange = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year';

const Dashboard = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [syncStatus, setSyncStatus] = useState<any>(DB.getSyncStatus());
  const [loading, setLoading] = useState(true);
  const [scheduleTab, setScheduleTab] = useState<'today' | 'tomorrow'>('today');
  const [timeRange, setTimeRange] = useState<TimeRange>('Day');

  useEffect(() => {
    const load = async () => {
      const [v, p, a, f] = await Promise.all([
        DB.getVisits(), 
        DB.getPatients(), 
        DB.getAppointments(),
        DB.getFamilies()
      ]);
      setVisits(v); setPatients(p); setAppointments(a); setFamilies(f);
      setSyncStatus(DB.getSyncStatus());
      setLoading(false);
    };
    load();
    window.addEventListener('emr-db-update', load);
    return () => window.removeEventListener('emr-db-update', load);
  }, []);
  
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(); tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Temporal Filtering Logic
    const getDaysLimit = (range: TimeRange) => {
      switch(range) {
        case 'Week': return 7;
        case 'Month': return 30;
        case 'Quarter': return 90;
        case 'Year': return 365;
        default: return 0; // Day is handled specially
      }
    };

    const daysLimit = getDaysLimit(timeRange);
    const filterDate = new Date();
    filterDate.setDate(now.getDate() - daysLimit);
    
    const filteredVisits = timeRange === 'Day' 
      ? visits.filter(v => v.date.startsWith(todayStr))
      : visits.filter(v => new Date(v.date) >= filterDate);

    // Calculation Metrics
    const periodRev = filteredVisits.reduce((sum, v) => sum + v.amount, 0);
    const uniquePatientsInPeriod = new Set(filteredVisits.map(v => v.patientMobile)).size;

    const todayQueue = appointments
      .filter(a => a.date === todayStr && a.status === 'Scheduled')
      .map(a => ({ ...a, patient: patients.find(p => p.mobile === a.patientMobile) }));

    const tomorrowQueue = appointments
      .filter(a => a.date === tomorrowStr && a.status === 'Scheduled')
      .map(a => ({ ...a, patient: patients.find(p => p.mobile === a.patientMobile) }));

    const pendingDuesList = visits
      .filter(v => v.paymentStatus === 'Pending')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
      .map(v => ({ ...v, patient: patients.find(p => p.mobile === v.patientMobile) }));

    const diagCounts: Record<string, number> = {};
    visits.forEach(v => { if (v.diagnosis) { const d = v.diagnosis.toUpperCase(); diagCounts[d] = (diagCounts[d] || 0) + 1; } });
    const topDiagnoses = Object.entries(diagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

    return {
      periodEncounters: filteredVisits.length,
      totalOutstanding: visits.filter(v => v.paymentStatus === 'Pending').reduce((sum, v) => sum + v.amount, 0),
      periodRev,
      periodUniquePatients: uniquePatientsInPeriod,
      totalPatients: patients.length,
      totalFamilies: families.length,
      todayQueue,
      tomorrowQueue,
      pendingDuesList,
      topDiagnoses
    };
  }, [appointments, patients, visits, families, timeRange]);

  const activeQueue = scheduleTab === 'today' ? stats.todayQueue : stats.tomorrowQueue;

  const isUpToDate = syncStatus.lastSync && new Date(syncStatus.lastSync) >= new Date(syncStatus.lastChange);

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synchronizing Registry...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Sync Banner */}
      {!isUpToDate && (
        <div className="mx-2 p-5 bg-blue-50 border border-blue-100 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
           <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"><CloudUpload size={20} /></div>
              <div>
                 <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-tight">Clinical Sync Pending</h4>
                 <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest opacity-70">Pushing local records to the cloud is recommended for security.</p>
              </div>
           </div>
           <Link to="/cloud" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">Start Cloud Push</Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Practice Command</h1>
          <p className="text-[11px] text-slate-500 mt-2 font-bold uppercase tracking-widest flex items-center"><Activity size={14} className="mr-2 text-blue-500" />Clinic Intelligence Hub</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Temporal Filter Control */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            {(['Day', 'Week', 'Month', 'Quarter', 'Year'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/reports/financial" className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 px-6 py-3 rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest">
              Audit Ledger
            </Link>
            <Link to="/new-visit" className="bg-[#050912] text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center space-x-3">
              <Plus size={18} /> <span>New Intake Entry</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 px-2">
        <StatCard 
          title={`Throughput (${timeRange})`} 
          value={stats.periodEncounters} 
          subtitle="Encounter Registry" 
          icon={UserCheck} 
          colorClass="bg-blue-50 text-blue-600" 
          to={`/reports/history?range=${timeRange}`}
        />
        <StatCard 
          title="Total Receivable" 
          value={`₹${stats.totalOutstanding}`} 
          subtitle="Outstanding" 
          icon={Clock} 
          colorClass="bg-rose-50 text-rose-600" 
          to="/reports/financial"
        />
        <StatCard 
          title={`${timeRange} Collections`} 
          value={`₹${stats.periodRev}`} 
          subtitle="Revenue Streams" 
          icon={Wallet} 
          colorClass="bg-emerald-50 text-emerald-600" 
          to="/reports/day-wise-revenue"
        />
        <StatCard 
          title={`Patients (${timeRange})`} 
          value={stats.periodUniquePatients} 
          subtitle="Distinct Lives" 
          icon={BarChart3} 
          colorClass="bg-indigo-50 text-indigo-600" 
          to="/patients"
        />
        <StatCard 
          title="Household Networks" 
          value={stats.totalFamilies} 
          subtitle="Family Groups" 
          icon={Network} 
          colorClass="bg-purple-50 text-purple-600" 
          to="/families" 
        />
      </div>

      {/* MAIN EQUAL WIDTH GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
        
        {/* CLINICAL SCHEDULE */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col h-[600px] w-full overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3"><CalendarCheck size={18} className="text-blue-600" /><h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Clinical Schedule</h2></div>
            <div className="flex bg-slate-200/50 p-1 rounded-full border border-slate-200">
               <button 
                onClick={() => setScheduleTab('today')}
                className={`inline-flex items-center px-4 py-1.5 rounded-full transition-all text-[8px] font-black uppercase tracking-tighter ${scheduleTab === 'today' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-300/30'}`}
               >
                 <span className="mr-1.5">{stats.todayQueue.length}</span> TODAY
               </button>
               <button 
                onClick={() => setScheduleTab('tomorrow')}
                className={`inline-flex items-center px-4 py-1.5 rounded-full transition-all text-[8px] font-black uppercase tracking-tighter ml-1 ${scheduleTab === 'tomorrow' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-300/30'}`}
               >
                 <span className="mr-1.5">{stats.tomorrowQueue.length}</span> TOMORROW
               </button>
            </div>
          </div>
          <div className="p-6 flex-1 space-y-4 overflow-y-auto custom-scrollbar">
            <p className="px-2 text-[9px] font-black text-blue-600/50 uppercase tracking-[0.2em] mb-4">
              {scheduleTab === 'today' ? 'Happening Now' : 'Planned for Tomorrow'}
            </p>
            {activeQueue.length > 0 ? activeQueue.map(apt => (
              <Link key={apt.id} to={`/patient/${apt.patientMobile}`} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-blue-50/30 border border-blue-100/50 transition-all hover:bg-blue-50 group">
                <div className="flex items-center space-x-5">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-[10px] shadow-lg shadow-blue-200 shrink-0">{apt.time}</div>
                  <div className="min-w-0">
                    <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate block">{apt.patient?.name || 'Unknown'}</span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex items-center"><Stethoscope size={10} className="mr-1 opacity-40" /> {apt.reason}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-blue-600/30 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
              </Link>
            )) : (
              <div className="py-20 text-center opacity-40"><p className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Queue is clear for {scheduleTab}</p></div>
            )}
          </div>
        </div>

        {/* PENDING DUES */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col h-[600px] w-full overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3"><AlertCircle size={18} className="text-rose-500" /><h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Pending Dues</h2></div>
            <Link to="/reports/financial" className="text-[9px] font-black text-rose-600 hover:underline uppercase tracking-widest border border-rose-100 px-3 py-1 rounded-full bg-white">Full Ledger</Link>
          </div>
          <div className="p-4 flex-1 space-y-2 overflow-y-auto custom-scrollbar">
            {stats.pendingDuesList.length > 0 ? stats.pendingDuesList.map(due => {
              const date = new Date(due.date);
              return (
                <Link key={due.id} to={`/patient/${due.patientMobile}`} className="flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-slate-50 transition-all group">
                  <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex flex-col items-center justify-center font-black leading-tight shadow-sm shrink-0">
                      <span className="text-[8px] uppercase opacity-70 mb-0.5">{date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
                      <span className="text-lg leading-none">{date.getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight truncate block">{due.patient?.name || due.patientMobile}</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex items-center"><Calendar size={10} className="mr-1 opacity-40" /> {date.toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end text-rose-600"><span className="text-[10px] font-black">₹</span><p className="text-xl font-black font-serif-clinical leading-none">{due.amount}</p></div>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1.5">Due</p>
                  </div>
                </Link>
              );
            }) : (
              <div className="py-20 text-center opacity-40"><p className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">No outstanding accounts</p></div>
            )}
          </div>
        </div>

        {/* CASE FREQUENCY */}
        <div className="bg-[#050912] rounded-[2.5rem] p-10 text-white shadow-2xl h-[600px] flex flex-col relative overflow-hidden w-full">
          <div className="relative z-10 space-y-10 flex-1">
            <div>
              <h3 className="text-3xl font-black font-serif-clinical italic leading-tight">Case Frequency</h3>
              <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-widest">Diagnostic Cluster Insights</p>
            </div>
            <div className="space-y-8">
              {stats.topDiagnoses.length > 0 ? stats.topDiagnoses.map(dx => (
                <div key={dx.name} className="space-y-3">
                  <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-200 truncate max-w-[180px]">{dx.name}</span>
                    <span className="text-blue-400 text-sm italic">{dx.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, (dx.count / (stats.totalPatients || 1)) * 500)}%` }}></div>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center opacity-40"><p className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">Epidemiological data pending...</p></div>
              )}
            </div>
          </div>
          <div className="relative z-10 pt-6 mt-auto border-t border-white/5">
             <Link to="/reports/quality" className="inline-flex items-center text-[10px] font-black text-blue-400 hover:text-white uppercase tracking-[0.2em] transition-all group/link">Audit Registry <ArrowRight size={14} className="ml-3 group-hover/link:translate-x-2 transition-transform" /></Link>
          </div>
          <Stethoscope size={300} className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none" />
        </div>

      </div>
    </div>
  );
};

const ArrowRight = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;

export default Dashboard;
