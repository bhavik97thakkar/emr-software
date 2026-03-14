
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Phone, ChevronRight, UserPlus, Filter, CreditCard, Stethoscope, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { DB } from '../services/db';
import { Patient, Visit } from '../types';

const PatientList = () => {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterPayment, setFilterPayment] = useState<'All' | 'Pending'>('All');
  const [filterDiagnosis, setFilterDiagnosis] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [p, v] = await Promise.all([DB.getPatients(), DB.getVisits()]);
      setPatients(p);
      setAllVisits(v);
      setLoading(false);
    };
    loadData();
    window.addEventListener('emr-db-update', loadData);
    return () => window.removeEventListener('emr-db-update', loadData);
  }, []);

  const filtered = useMemo(() => {
    return patients.filter(p => {
      const basicMatch = p.name.toLowerCase().includes(query.toLowerCase()) || p.mobile.includes(query);
      if (!basicMatch) return false;
      const patientVisits = allVisits.filter(v => v.patientMobile === p.mobile);
      if (filterPayment === 'Pending') {
        const hasDues = patientVisits.some(v => v.paymentStatus === 'Pending');
        if (!hasDues) return false;
      }
      if (filterDiagnosis.trim()) {
        const hasDx = patientVisits.some(v => (v.diagnosis || '').toLowerCase().includes(filterDiagnosis.toLowerCase()));
        if (!hasDx) return false;
      }
      return true;
    });
  }, [patients, allVisits, query, filterPayment, filterDiagnosis]);

  if (loading) return <div className="p-10 animate-pulse text-slate-400 font-medium">Loading registry...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Registry</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">{filtered.length} patients found</p>
        </div>
        <Link to="/new-visit" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-blue-100">
          <UserPlus size={16} /> <span>New Intake</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, ID or mobile..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-xl border flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider transition-all ${showFilters ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
        >
          <Filter size={16} /> <span>Filter</span>
        </button>
      </div>

      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
              <CreditCard size={12} className="mr-2" /> Outstanding Bills
            </label>
            <div className="flex space-x-2">
              <button onClick={() => setFilterPayment('All')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${filterPayment === 'All' ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'bg-transparent border-slate-200 text-slate-400'}`}>All</button>
              <button onClick={() => setFilterPayment('Pending')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${filterPayment === 'Pending' ? 'bg-white border-rose-500 text-rose-600 shadow-sm' : 'bg-transparent border-slate-200 text-slate-400'}`}>With Dues</button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
              <Stethoscope size={12} className="mr-2" /> Last Diagnosis
            </label>
            <input
              type="text"
              placeholder="Filter by diagnosis..."
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
              value={filterDiagnosis}
              onChange={(e) => setFilterDiagnosis(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {filtered.map(p => {
            const visits = allVisits.filter(v => v.patientMobile === p.mobile).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return (
              <Link key={p.mobile} to={`/patient/${p.mobile}`} className="flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-all group">
                <div className="flex items-center space-x-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${p.gender === 'Female' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                    {p.name.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className={`text-sm font-bold group-hover:text-blue-600 transition-colors leading-none ${!p.name ? 'text-rose-400 italic' : 'text-slate-900'}`}>{p.name || 'Unnamed Patient'}</p>
                    <div className="flex items-center space-x-4 mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <span className="flex items-center"><Phone size={10} className="mr-1.5 opacity-40" /> {p.mobile || 'No Mobile'}</span>
                      <span className="opacity-30">•</span>
                      <span>{p.age || 0}Y</span>
                      <span className="opacity-30">•</span>
                      <span>{p.gender}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  {visits.length > 0 && (
                    <div className="hidden md:block text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Last Visit</p>
                      <p className="text-[10px] font-bold text-slate-700 mt-1">{new Date(visits[0].date).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm(`Permanently delete ${p.name || 'this record'}?`)) {
                          const success = await DB.deletePatient(p.mobile);
                          if (success) toast.success("Patient removed from registry");
                        }
                      }}
                      className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Patient"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-20 text-center space-y-3">
              <Search size={32} className="mx-auto text-slate-200" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No matching records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientList;
