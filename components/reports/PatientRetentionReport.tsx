
import React, { useMemo, useState, useEffect } from 'react';
import {
    History,
    ArrowLeft,
    Download,
    Users,
    CalendarCheck,
    Target,
    ArrowRight,
    TrendingUp,
    RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DB } from '../../services/db';
import { Visit, Patient } from '../../types';

const PatientRetentionReport = () => {
    const navigate = useNavigate();
    const [visits, setVisits] = useState<Visit[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);

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
        const patientMap: Record<string, number> = {};
        visits.forEach(v => {
            patientMap[v.patientMobile] = (patientMap[v.patientMobile] || 0) + 1;
        });

        const totalPatients = Object.keys(patientMap).length;
        const returningPatients = Object.values(patientMap).filter(count => count > 1).length;
        const retentionRate = totalPatients > 0 ? Math.round((returningPatients / totalPatients) * 100) : 0;

        const visitFrequency: Record<number, number> = {};
        Object.values(patientMap).forEach(count => {
            visitFrequency[count] = (visitFrequency[count] || 0) + 1;
        });

        return { totalPatients, returningPatients, retentionRate, visitFrequency };
    }, [visits]);

    const handleExport = () => {
        const headers = ["Visit Frequency", "Patient Count"];
        const rows = Object.entries(stats.visitFrequency).map(([freq, count]) => [`${freq} Visit(s)`, count.toString()]);
        DB.downloadCSV("Patient_Retention_Report", headers, rows);
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-[0.3em]">Calculating Retention Dynamics...</div>;

    return (
        <div className="max-w-[1440px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                    <button onClick={() => navigate('/reports')} className="flex items-center text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest mb-4">
                        <ArrowLeft size={14} className="mr-2" />
                        Back to Hub
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Retention & Follow-up</h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Analysis of patient loyalty and clinical continuity</p>
                </div>

                <button
                    onClick={handleExport}
                    className="flex items-center space-x-3 bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Download size={16} />
                    <span>Excel</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-sm"><Users size={20} /></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Patient Base</p>
                    <h3 className="text-4xl font-black mt-3 text-slate-900 font-serif-clinical">{stats.totalPatients}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-6 leading-relaxed">Unique patients treated in your clinic.</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-sm"><RotateCcw size={20} /></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Returning Patients</p>
                    <h3 className="text-4xl font-black mt-3 text-slate-900 font-serif-clinical">{stats.returningPatients}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-6 leading-relaxed">Patients with more than one clinical encounter.</p>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20"><TrendingUp size={20} /></div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retention Rate</p>
                        <h3 className="text-5xl font-black mt-3 font-serif-clinical text-blue-400">{stats.retentionRate}%</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-6 leading-relaxed">Your practice's clinical stickiness score.</p>
                    </div>
                    <Target size={200} className="absolute -right-16 -bottom-16 text-white opacity-5 group-hover:scale-110 transition-transform duration-700" />
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">Visit Frequency Distribution</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="px-10 py-5">Loyalty Tier</th>
                                <th className="px-10 py-5">Patient Volume</th>
                                <th className="px-10 py-5 text-right">Segment Share %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {Object.entries(stats.visitFrequency).sort((a, b) => Number(b[0]) - Number(a[0])).map(([freq, count]) => {
                                const percentage = Math.round(((count as number) / (stats.totalPatients as number)) * 100);
                                return (
                                    <tr key={freq} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-2 rounded-lg text-xs font-bold ${Number(freq) > 5 ? 'bg-blue-600 text-white' : Number(freq) > 2 ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    {freq}x
                                                </div>
                                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-wide">{Number(freq) === 1 ? 'Single Consult' : `${freq} Clinical Encounters`}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-[15px] font-black text-slate-900">{count}</td>
                                        <td className="px-10 py-6 text-right font-serif-clinical text-xl font-black text-slate-900">{percentage}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PatientRetentionReport;
