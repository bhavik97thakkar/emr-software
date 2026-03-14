
import React, { useMemo, useState, useEffect } from 'react';
import {
  Wallet,
  Search,
  ArrowLeft,
  ExternalLink,
  Clock,
  AlertCircle,
  Calendar,
  Download
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DB } from '../../services/db';
import { Visit, Patient } from '../../types';

const FinancialLedgerReport = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const handleExport = () => {
    const headers = ["Encounter Date", "Patient Name", "Mobile", "Diagnosis", "Days Aging", "Balance Due"];
    const rows = pendingDues.map(v => {
      const p = allPatients.find(patient => patient.mobile === v.patientMobile);
      const visitDate = new Date(v.date);
      const daysAging = Math.floor((new Date().getTime() - visitDate.getTime()) / (1000 * 3600 * 24));
      return [
        visitDate.toLocaleDateString(),
        p?.name || 'Unknown',
        v.patientMobile,
        v.diagnosis || 'General',
        daysAging.toString(),
        v.amount.toString()
      ];
    });
    DB.downloadCSV("Outstanding_Ledger_Report", headers, rows);
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

  const pendingDues = useMemo(() => {
    const list = allVisits.filter(v => v.paymentStatus === 'Pending');
    return list.filter(v => {
      const patient = allPatients.find(p => p.mobile === v.patientMobile);
      return patient?.name.toLowerCase().includes(query.toLowerCase()) || v.patientMobile.includes(query);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allVisits, allPatients, query]);

  const totalOutstanding = useMemo(() => {
    return pendingDues.reduce((sum, v) => sum + v.amount, 0);
  }, [pendingDues]);

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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Outstanding Ledger</h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Revenue recovery & Pending settlement tracker</p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 flex items-center space-x-3">
            <AlertCircle size={18} className="text-rose-600" />
            <div>
              <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest leading-none">Total Uncollected</p>
              <p className="text-lg font-black text-rose-700 font-serif-clinical mt-1">₹{totalOutstanding.toLocaleString()}</p>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Filter by patient..."
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
                <th className="px-10 py-5">Patient Identity</th>
                <th className="px-10 py-5">Encounter Date</th>
                <th className="px-10 py-5">Days Aging</th>
                <th className="px-10 py-5">Original Diagnosis</th>
                <th className="px-10 py-5 text-right">Balance Due</th>
                <th className="px-10 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pendingDues.map(visit => {
                const patient = allPatients.find(p => p.mobile === visit.patientMobile);
                const visitDate = new Date(visit.date);
                const daysAging = Math.floor((new Date().getTime() - visitDate.getTime()) / (1000 * 3600 * 24));

                const formattedDate = visitDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const formattedTime = visitDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                return (
                  <tr key={visit.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 ${patient?.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                          {patient?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{patient?.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{visit.patientMobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <Calendar size={12} className="text-slate-300" />
                          <span className="text-[11px] font-black text-slate-700 uppercase">{formattedDate}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock size={10} className="text-slate-300" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{formattedTime}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${daysAging > 30 ? "bg-rose-500 animate-pulse" : "bg-amber-500"}`}></div>
                        <p className={`text-[11px] font-black uppercase ${daysAging > 30 ? "text-rose-600" : "text-slate-600"}`}>
                          {daysAging === 0 ? 'Today' : `${daysAging} Days ago`}
                        </p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide truncate max-w-[150px]">{visit.diagnosis || 'Consultation'}</p>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <p className="text-[15px] font-black text-rose-600 font-serif-clinical">₹{visit.amount}</p>
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
              {pendingDues.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No outstanding dues found.</p>
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

export default FinancialLedgerReport;
