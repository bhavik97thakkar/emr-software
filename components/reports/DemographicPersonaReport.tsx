
import React, { useMemo, useState, useEffect } from 'react';
import {
    Users,
    ArrowLeft,
    Download,
    Baby,
    User,
    UserCheck,
    PieChart,
    Target,
    BarChart4
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DB } from '../../services/db';
import { Patient } from '../../types';

const DemographicPersonaReport = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const p = await DB.getPatients();
            setPatients(p);
            setLoading(false);
        };
        loadData();
    }, []);

    const stats = useMemo(() => {
        const ageGroups = {
            Pediatric: 0, // 0-12
            Teen: 0,      // 13-19
            Adult: 0,     // 20-59
            Geriatric: 0  // 60+
        };

        const genderSplit = {
            Male: 0,
            Female: 0,
            Other: 0
        };

        patients.forEach(p => {
            // Age Logic
            const age = parseInt(p.age);
            if (age <= 12) ageGroups.Pediatric++;
            else if (age <= 19) ageGroups.Teen++;
            else if (age <= 59) ageGroups.Adult++;
            else ageGroups.Geriatric++;

            // Gender Logic
            if (p.gender === 'Male') genderSplit.Male++;
            else if (p.gender === 'Female') genderSplit.Female++;
            else genderSplit.Other++;
        });

        return { ageGroups, genderSplit, total: patients.length };
    }, [patients]);

    const handleExport = () => {
        const headers = ["Category", "Segment", "Count", "Share %"];
        const rows = [
            ["Age Group", "Pediatric (0-12)", stats.ageGroups.Pediatric.toString(), `${Math.round((stats.ageGroups.Pediatric / stats.total) * 100)}%`],
            ["Age Group", "Teen (13-19)", stats.ageGroups.Teen.toString(), `${Math.round((stats.ageGroups.Teen / stats.total) * 100)}%`],
            ["Age Group", "Adult (20-59)", stats.ageGroups.Adult.toString(), `${Math.round((stats.ageGroups.Adult / stats.total) * 100)}%`],
            ["Age Group", "Geriatric (60+)", stats.ageGroups.Geriatric.toString(), `${Math.round((stats.ageGroups.Geriatric / stats.total) * 100)}%`],
            ["Gender", "Male", stats.genderSplit.Male.toString(), `${Math.round((stats.genderSplit.Male / stats.total) * 100)}%`],
            ["Gender", "Female", stats.genderSplit.Female.toString(), `${Math.round((stats.genderSplit.Female / stats.total) * 100)}%`],
            ["Gender", "Other", stats.genderSplit.Other.toString(), `${Math.round((stats.genderSplit.Other / stats.total) * 100)}%`],
        ];
        DB.downloadCSV("Demographic_Persona_Report", headers, rows);
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-[0.3em]">Mapping Patient Demographics...</div>;

    return (
        <div className="max-w-[1440px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                    <button onClick={() => navigate('/reports')} className="flex items-center text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest mb-4">
                        <ArrowLeft size={14} className="mr-2" />
                        Back to Hub
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Demographic Personas</h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Analysis of age, gender and clinical segments</p>
                </div>

                <button
                    onClick={handleExport}
                    className="flex items-center space-x-3 bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Download size={16} />
                    <span>Excel</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AgeCard label="Pediatric" count={stats.ageGroups.Pediatric} total={stats.total} icon={Baby} colorClass="bg-blue-50 text-blue-600" />
                <AgeCard label="Teenagers" count={stats.ageGroups.Teen} total={stats.total} icon={User} colorClass="bg-indigo-50 text-indigo-600" />
                <AgeCard label="Adults" count={stats.ageGroups.Adult} total={stats.total} icon={UserCheck} colorClass="bg-emerald-50 text-emerald-600" />
                <AgeCard label="Geriatric" count={stats.ageGroups.Geriatric} total={stats.total} icon={Users} colorClass="bg-rose-50 text-rose-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center">
                            <BarChart4 size={18} className="mr-3 text-blue-600" />
                            Gender Distribution
                        </h2>
                    </div>
                    <div className="p-10 space-y-10">
                        <GenderRow label="Female" count={stats.genderSplit.Female} total={stats.total} color="bg-pink-500" />
                        <GenderRow label="Male" count={stats.genderSplit.Male} total={stats.total} color="bg-blue-500" />
                        <GenderRow label="Other / Unspecified" count={stats.genderSplit.Other} total={stats.total} color="bg-slate-400" />
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black font-serif-clinical">Core Practice Persona</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Primary Patient Definition</p>

                        <div className="mt-12 space-y-8">
                            <PersonaDetail
                                label="Primary Age Group"
                                value={Object.entries(stats.ageGroups).sort((a, b) => b[1] - a[1])[0][0]}
                            />
                            <PersonaDetail
                                label="Dominant Gender"
                                value={Object.entries(stats.genderSplit).sort((a, b) => b[1] - a[1])[0][0]}
                            />
                            <div className="pt-6 border-t border-white/5">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                    Your practice is primarily serving {Object.entries(stats.ageGroups).sort((a, b) => b[1] - a[1])[0][0]} patients. This segment accounts for {Math.round((Math.max(...Object.values(stats.ageGroups)) / stats.total) * 100)}% of your total patient count.
                                </p>
                            </div>
                        </div>
                    </div>
                    <PieChart size={300} className="absolute -right-20 -bottom-20 text-blue-600 opacity-10" />
                </div>
            </div>
        </div>
    );
};

const AgeCard = ({ label, count, total, icon: Icon, colorClass }: any) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all h-full">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 shadow-sm ${colorClass}`}>
                <Icon size={18} />
            </div>
            <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</h3>
                <p className="text-2xl font-black mt-2 text-slate-900 font-serif-clinical">{count}</p>
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex-1 bg-slate-50 h-1 rounded-full overflow-hidden mr-4">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="text-[10px] font-black text-blue-600">{percentage}%</span>
                </div>
            </div>
        </div>
    );
};

const GenderRow = ({ label, count, total, color }: any) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-900">
                <span>{label}</span>
                <span>{count} ({percentage}%)</span>
            </div>
            <div className="w-full bg-slate-50 h-3 rounded-xl overflow-hidden">
                <div className={`${color} h-full rounded-xl transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const PersonaDetail = ({ label, value }: any) => (
    <div className="space-y-2">
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black font-serif-clinical tracking-tight">{value}</p>
    </div>
);

export default DemographicPersonaReport;
