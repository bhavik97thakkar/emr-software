
import React, { useMemo, useState, useEffect } from 'react';
import {
  PieChart,
  ArrowLeft,
  Wallet,
  CreditCard,
  MessageCircle,
  Clock,
  ArrowRight,
  User,
  ExternalLink,
  IndianRupee,
  Smartphone,
  Download
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DB } from '../../services/db';
import { Visit, Patient } from '../../types';

const AnalysisCard = ({ title, amount, count, icon: Icon, colorClass, isActive, onClick }: any) => (
  <button
    onClick={onClick}
    className={`p-8 rounded-[2.5rem] border transition-all text-left group flex flex-col justify-between h-full ${isActive
      ? 'bg-white shadow-2xl border-blue-400'
      : 'bg-white/50 border-slate-200 hover:border-blue-200 shadow-sm'
      }`}
  >
    <div className="flex items-start justify-between">
      <div className={`p-4 rounded-2xl shadow-sm ${colorClass} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {count} Cases
      </div>
    </div>
    <div className="mt-8">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</p>
      <h3 className="text-3xl font-black mt-2 text-slate-900 font-serif-clinical">₹{amount.toLocaleString()}</h3>
    </div>
  </button>
);

const SettlementAnalysisReport = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<'Due' | 'Cash' | 'Card' | 'Digital'>('Due');

  const handleExport = () => {
    const headers = ["Date", "Patient Name", "Mobile", "Diagnosis", "Channel", "Amount", "Status"];
    const rows = visits.map(v => {
      const p = patients.find(patient => patient.mobile === v.patientMobile);
      let channel = v.paymentMethod;
      if (v.paymentStatus === 'Pending') channel = 'Due';
      return [
        new Date(v.date).toLocaleDateString(),
        p?.name || 'Unknown',
        v.patientMobile,
        v.diagnosis || 'General',
        channel,
        v.amount.toString(),
        v.paymentStatus
      ];
    });
    DB.downloadCSV("Channel_Analysis_Report", headers, rows);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [v, p] = await Promise.all([DB.getVisits(), DB.getPatients()]);
      setVisits(v);
      setPatients(p);
      setLoading(false);
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    // Due: status is Pending
    const dueVisits = visits.filter(v => v.paymentStatus === 'Pending');
    // Cash: method is Cash and status is Paid
    const cashVisits = visits.filter(v => v.paymentMethod === 'Cash' && v.paymentStatus === 'Paid');
    // Card: method is Card and status is Paid
    const cardVisits = visits.filter(v => v.paymentMethod === 'Card' && v.paymentStatus === 'Paid');
    // Digital: method is UPI or GPay and status is Paid
    const digitalVisits = visits.filter(v => (v.paymentMethod === 'UPI' || v.paymentMethod === 'GPay') && v.paymentStatus === 'Paid');

    return {
      due: {
        visits: dueVisits,
        amount: dueVisits.reduce((s, v) => s + v.amount, 0),
        count: dueVisits.length
      },
      cash: {
        visits: cashVisits,
        amount: cashVisits.reduce((s, v) => s + v.amount, 0),
        count: cashVisits.length
      },
      card: {
        visits: cardVisits,
        amount: cardVisits.reduce((s, v) => s + v.amount, 0),
        count: cardVisits.length
      },
      digital: {
        visits: digitalVisits,
        amount: digitalVisits.reduce((s, v) => s + v.amount, 0),
        count: digitalVisits.length
      }
    };
  }, [visits]);

  const activeList = useMemo(() => {
    switch (activeChannel) {
      case 'Due': return stats.due.visits;
      case 'Cash': return stats.cash.visits;
      case 'Card': return stats.card.visits;
      case 'Digital': return stats.digital.visits;
      default: return [];
    }
  }, [activeChannel, stats]);

  if (loading) return <div className="p-20 text-center animate-pulse">Computing practice financials...</div>;

  return (
    <div className="max-w-[1440px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <button onClick={() => navigate('/reports')} className="flex items-center text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest mb-4">
            <ArrowLeft size={14} className="mr-2" />
            Back to Hub
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Channel Analysis</h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Revenue distribution by payment instrument</p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center space-x-3 bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm shrink-0 self-start md:self-auto"
        >
          <Download size={16} />
          <span>Excel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        <AnalysisCard
          title="Outstanding Dues"
          amount={stats.due.amount}
          count={stats.due.count}
          icon={Clock}
          colorClass="bg-rose-50 text-rose-600"
          isActive={activeChannel === 'Due'}
          onClick={() => setActiveChannel('Due')}
        />
        <AnalysisCard
          title="Cash Collections"
          amount={stats.cash.amount}
          count={stats.cash.count}
          icon={Wallet}
          colorClass="bg-emerald-50 text-emerald-600"
          isActive={activeChannel === 'Cash'}
          onClick={() => setActiveChannel('Cash')}
        />
        <AnalysisCard
          title="UPI / GPay"
          amount={stats.digital.amount}
          count={stats.digital.count}
          icon={Smartphone}
          colorClass="bg-indigo-50 text-indigo-600"
          isActive={activeChannel === 'Digital'}
          onClick={() => setActiveChannel('Digital')}
        />
        <AnalysisCard
          title="Card Payments"
          amount={stats.card.amount}
          count={stats.card.count}
          icon={CreditCard}
          colorClass="bg-blue-50 text-blue-600"
          isActive={activeChannel === 'Card'}
          onClick={() => setActiveChannel('Card')}
        />
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden mx-2">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div>
            <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center">
              <PieChart size={18} className="mr-3 text-blue-600" />
              {activeChannel} Ledger Segment
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Listing all contributing encounters</p>
          </div>
          <div className="text-right">
            <p className="text-[16px] font-black text-slate-900 font-serif-clinical">₹{activeList.reduce((s, v) => s + v.amount, 0).toLocaleString()}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Segment Total</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-10 py-5">Date</th>
                <th className="px-10 py-5">Patient Identity</th>
                <th className="px-10 py-5">Diagnosis</th>
                <th className="px-10 py-5 text-right">Amount</th>
                <th className="px-10 py-5 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeList.map(visit => {
                const patient = patients.find(p => p.mobile === visit.patientMobile);
                return (
                  <tr key={visit.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <p className="text-[11px] font-bold text-slate-600">{new Date(visit.date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${patient?.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                          {patient?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{patient?.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{visit.patientMobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide truncate max-w-[150px]">{visit.diagnosis || 'General'}</p>
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
              {activeList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No encounters recorded in this channel.</p>
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

export default SettlementAnalysisReport;
