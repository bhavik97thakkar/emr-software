
import React, { useMemo, useState, useEffect } from 'react';
import {
  CalendarDays,
  Search,
  ArrowLeft,
  ExternalLink,
  IndianRupee,
  Wallet,
  Clock,
  ChevronDown,
  Download
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DB } from '../../services/db';
import { Visit, Patient } from '../../types';

const DayWiseRevenueReport = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const handleExport = () => {
    const headers = ["Date", "Patient Name", "Mobile", "Diagnosis", "Method", "Amount", "Status"];
    const rows = allVisits.map(v => {
      const p = allPatients.find(patient => patient.mobile === v.patientMobile);
      return [
        new Date(v.date).toLocaleDateString(),
        p?.name || 'Unknown',
        v.patientMobile,
        v.diagnosis || 'General',
        v.paymentMethod,
        v.amount.toString(),
        v.paymentStatus
      ];
    });
    DB.downloadCSV("Daily_Revenue_Ledger", headers, rows);
  };

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

  const groupedData = useMemo(() => {
    const filteredVisits = allVisits.filter(v => {
      const patient = allPatients.find(p => p.mobile === v.patientMobile);
      const searchMatch = patient?.name.toLowerCase().includes(query.toLowerCase()) ||
        v.patientMobile.includes(query) ||
        v.date.includes(query);
      return searchMatch;
    });

    const groups: Record<string, { visits: Visit[], total: number }> = {};

    filteredVisits.forEach(v => {
      const dateKey = v.date.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = { visits: [], total: 0 };
      }
      groups[dateKey].visits.push(v);
      groups[dateKey].total += v.amount;
    });

    // Sort dates descending
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allVisits, allPatients, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <button onClick={() => navigate('/reports')} className="flex items-center text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest mb-4">
            <ArrowLeft size={14} className="mr-2" />
            Back to Hub
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Daily Revenue Ledger</h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Historical audit of day-wise patient revenue collections</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search patient, mobile or date..."
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

      <div className="space-y-10">
        {groupedData.length > 0 ? (
          groupedData.map(([date, data]) => {
            const dateObj = new Date(date);
            return (
              <div key={date} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                <div className="px-10 py-6 bg-[#050912] text-white flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-white/10 rounded-2xl border border-white/10">
                      <span className="text-[8px] font-black uppercase text-blue-400">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-xl font-black leading-none font-serif-clinical">{dateObj.getDate()}</span>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dateObj.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                      <p className="text-xs font-bold mt-0.5">{dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end text-blue-400"><IndianRupee size={16} className="mr-1" /><span className="text-2xl font-black font-serif-clinical">{data.total.toLocaleString()}</span></div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1.5">{data.visits.length} Encounters Collected</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-10 py-5">Patient Identity</th>
                        <th className="px-10 py-5">Diagnosis</th>
                        <th className="px-10 py-5">Settlement Channel</th>
                        <th className="px-10 py-5 text-right">Fee</th>
                        <th className="px-10 py-5 text-right">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.visits.map(visit => {
                        const patient = allPatients.find(p => p.mobile === visit.patientMobile);
                        return (
                          <tr key={visit.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-10 py-6">
                              <div className="flex items-center space-x-4">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${patient?.gender === 'Female' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                  {patient?.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{patient?.name}</p>
                                  <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{visit.patientMobile}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide truncate max-w-[200px]">{visit.diagnosis || 'General Checkup'}</p>
                            </td>
                            <td className="px-10 py-6">
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${visit.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                  {visit.paymentMethod}
                                </span>
                              </div>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <p className="text-[15px] font-black text-slate-900 font-serif-clinical">₹{visit.amount}</p>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <Link
                                to={`/patient/${visit.patientMobile}`}
                                className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all inline-flex"
                              >
                                <ExternalLink size={18} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200">
              <CalendarDays size={32} />
            </div>
            <p className="text-slate-900 font-black text-xl tracking-tight uppercase font-serif-clinical">No Revenue Data Available</p>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-3">Try clearing your search filters or record new patient visits.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayWiseRevenueReport;
