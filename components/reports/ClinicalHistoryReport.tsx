
import React, { useMemo, useState, useEffect } from 'react';
import {
  History,
  Search,
  ArrowLeft,
  ExternalLink,
  Filter,
  Stethoscope,
  CalendarDays,
  Download
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DB } from '../../services/db';
import { Visit, Patient } from '../../types';

const ClinicalHistoryReport = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const handleExport = () => {
    const headers = ["Date", "Patient Name", "Mobile", "Diagnosis", "Encounter ID"];
    const rows = filtered.map(v => {
      const p = allPatients.find(patient => patient.mobile === v.patientMobile);
      return [
        new Date(v.date).toLocaleDateString(),
        p?.name || 'Unknown',
        v.patientMobile,
        v.diagnosis || 'General',
        v.id
      ];
    });
    DB.downloadCSV(`Clinical_History_${range}_Report`, headers, rows);
  };

  // Read range parameter from URL (passed from Dashboard)
  const range = searchParams.get('range') || 'All';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [v, p] = await Promise.all([
        DB.getVisits(),
        DB.getPatients()
      ]);
      setAllVisits(v);
      setAllPatients(p);
      setLoading(false);
    };
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Temporal boundary logic matching the dashboard engine
    const getDaysLimit = (r: string) => {
      switch (r) {
        case 'Week': return 7;
        case 'Month': return 30;
        case 'Quarter': return 90;
        case 'Year': return 365;
        default: return 0;
      }
    };

    const daysLimit = getDaysLimit(range);
    const filterDate = new Date();
    filterDate.setDate(now.getDate() - daysLimit);

    return allVisits.filter(v => {
      // 1. Temporal Precision Filtering
      if (range === 'Day') {
        if (!v.date.startsWith(todayStr)) return false;
      } else if (range !== 'All') {
        if (new Date(v.date) < filterDate) return false;
      }

      // 2. Multi-Context Search (Patient Identity or Clinical Case)
      const patient = allPatients.find(p => p.mobile === v.patientMobile);
      const matchesPatient = patient?.name.toLowerCase().includes(query.toLowerCase()) || v.patientMobile.includes(query);
      const matchesDx = (v.diagnosis || '').toLowerCase().includes(query.toLowerCase());

      return matchesPatient || matchesDx;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allVisits, allPatients, query, range]);

  const getPageTitle = () => {
    switch (range) {
      case 'Day': return "Today's Clinical Volume";
      case 'Week': return "Weekly Throughput";
      case 'Month': return "Monthly Registry";
      case 'Quarter': return "Quarterly Summary";
      case 'Year': return "Annual History";
      default: return "Practice History";
    }
  };

  const getFilterLabel = () => {
    switch (range) {
      case 'Day': return "Daily View";
      case 'Week': return "Last 7 Days";
      case 'Month': return "Last 30 Days";
      case 'Quarter': return "Last 90 Days";
      case 'Year': return "Last 365 Days";
      default: return "Master Archive";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-col space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrating Historical Ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <button onClick={() => navigate('/reports')} className="flex items-center text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group">
            <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Hub
          </button>
          <div className="flex items-center space-x-4">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">
              {getPageTitle()}
            </h1>
            {range !== 'All' && (
              <span className="bg-blue-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center shadow-lg shadow-blue-200">
                <CalendarDays size={10} className="mr-2" /> {getFilterLabel()}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-3">
            Longitudinal log of practice encounters for the selected period
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {range !== 'All' && (
            <button
              onClick={() => navigate('/reports/history')}
              className="text-[10px] font-black text-blue-600 bg-blue-50 px-6 py-3.5 rounded-2xl hover:bg-blue-100 transition-all uppercase tracking-widest border border-blue-100"
            >
              Clear Filter
            </button>
          )}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Filter by diagnosis or patient..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-[13px] font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-sm transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-3 bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm shrink-0"
          >
            <Download size={16} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-10 py-6">Encounter Timestamp</th>
                <th className="px-10 py-6">Patient Identity</th>
                <th className="px-10 py-6">Diagnosis Cluster</th>
                <th className="px-10 py-6 text-right">Access Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((visit, idx) => {
                const patient = allPatients.find(p => p.mobile === visit.patientMobile);
                const visitDate = new Date(visit.date);
                return (
                  <tr key={visit.id} className="hover:bg-slate-50/50 transition-colors group animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-5">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-900 rounded-2xl text-white shadow-sm border border-slate-700 shrink-0 group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors duration-500">
                          <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-blue-100">{visitDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-lg font-black leading-none font-serif-clinical">{visitDate.getDate()}</span>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Encounter ID</p>
                          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tighter">{visit.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-700 transition-colors">{patient?.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">{visit.patientMobile}</p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-500 opacity-70">
                          <Stethoscope size={14} />
                        </div>
                        <p className="text-[12px] font-black text-slate-700 uppercase tracking-tight italic">{visit.diagnosis || 'General Clinical Review'}</p>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <Link
                        to={`/patient/${visit.patientMobile}`}
                        className="p-4 text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 rounded-2xl transition-all inline-flex border border-transparent hover:border-blue-100"
                      >
                        <ExternalLink size={18} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-40 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-200">
                      <History size={40} />
                    </div>
                    <p className="text-slate-900 font-black text-2xl tracking-tight uppercase font-serif-clinical italic">Registry Exhausted</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.25em] mt-4 max-w-sm mx-auto leading-relaxed">
                      No patient encounters matched the selected period ({range.toLowerCase()}) or search criteria.
                    </p>
                    <button
                      onClick={() => navigate('/reports/history')}
                      className="mt-10 text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
                    >
                      View Master History →
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClinicalHistoryReport;
