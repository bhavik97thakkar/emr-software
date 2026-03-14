
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  IndianRupee,
  ArrowUpRight,
  User,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DB } from '../services/db';
import { Visit, Patient } from '../types';

const MetricCard = ({ title, amount, icon: Icon, colorClass, subtitle }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:border-blue-100 transition-all">
    <div className="flex items-start justify-between">
      <div className={`p-4 rounded-2xl ${colorClass} shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center space-x-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subtitle}</span>
      </div>
    </div>
    <div className="mt-8">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</p>
      <h3 className="text-4xl font-black mt-3 text-slate-900 font-serif-clinical leading-none">
        ₹{amount.toLocaleString()}
      </h3>
    </div>
  </div>
);

const RevenueReport = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [v, p] = await Promise.all([
        DB.getVisits(),
        DB.getPatients()
      ]);
      setVisits(v);
      setPatients(p);
      setLoading(false);
    };
    loadData();
    window.addEventListener('emr-db-update', loadData);
    return () => window.removeEventListener('emr-db-update', loadData);
  }, []);

  const dayData = useMemo(() => {
    const filtered = visits.filter(v => v.date.startsWith(selectedDate));
    
    const cash = filtered.filter(v => v.paymentMethod === 'Cash' && v.paymentStatus === 'Paid').reduce((s, v) => s + v.amount, 0);
    const digital = filtered.filter(v => (v.paymentMethod === 'GPay' || v.paymentMethod === 'UPI' || v.paymentMethod === 'Card') && v.paymentStatus === 'Paid').reduce((s, v) => s + v.amount, 0);
    const dues = filtered.filter(v => v.paymentStatus === 'Pending').reduce((s, v) => s + v.amount, 0);
    
    return {
      list: filtered,
      totalCollected: cash + digital,
      cash,
      digital,
      dues
    };
  }, [visits, selectedDate]);

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Financial Audit</h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Daily Revenue Summary & Transaction Log</p>
        </div>
        
        <div className="flex items-center space-x-4 bg-white p-2 rounded-[1.5rem] border border-slate-200 shadow-sm">
          <button 
            onClick={() => changeDate(-1)}
            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center space-x-3 px-4">
            <Calendar size={18} className="text-blue-600" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-black text-sm uppercase tracking-widest bg-transparent outline-none cursor-pointer"
            />
          </div>
          <button 
            onClick={() => changeDate(1)}
            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard 
          title="Daily Collection" 
          amount={dayData.totalCollected} 
          icon={TrendingUp} 
          colorClass="bg-blue-50 text-blue-600" 
          subtitle="Revenue"
        />
        <MetricCard 
          title="Liquid Cash" 
          amount={dayData.cash} 
          icon={Wallet} 
          colorClass="bg-emerald-50 text-emerald-600" 
          subtitle="On-Hand"
        />
        <MetricCard 
          title="Digital Assets" 
          amount={dayData.digital} 
          icon={CreditCard} 
          colorClass="bg-indigo-50 text-indigo-600" 
          subtitle="UPI/Card"
        />
        <MetricCard 
          title="Outstanding Dues" 
          amount={dayData.dues} 
          icon={Clock} 
          colorClass="bg-rose-50 text-rose-600" 
          subtitle="Receivable"
        />
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center">
            <ArrowUpRight size={18} className="mr-3 text-blue-600" />
            Transaction History ({dayData.list.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-10 py-5">Patient Detail</th>
                <th className="px-10 py-5">Diagnosis</th>
                <th className="px-10 py-5">Payment Channel</th>
                <th className="px-10 py-5 text-right">Amount</th>
                <th className="px-10 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dayData.list.map(visit => {
                const patient = patients.find(p => p.mobile === visit.patientMobile);
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
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide truncate max-w-[150px]">{visit.diagnosis || 'General'}</p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-3">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${visit.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {visit.paymentMethod}
                        </span>
                        {visit.paymentStatus === 'Pending' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <p className="text-[15px] font-black text-slate-900 font-serif-clinical">₹{visit.amount}</p>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <Link 
                        to={`/patient/${visit.patientMobile}`}
                        className="inline-flex p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <ExternalLink size={18} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {dayData.list.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                      <Clock size={32} />
                    </div>
                    <p className="text-slate-900 font-black text-xl tracking-tight uppercase font-serif-clinical">No Transactions recorded</p>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-3">Select a different date or check your registration logs.</p>
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

export default RevenueReport;
