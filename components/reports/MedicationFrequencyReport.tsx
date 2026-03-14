
import React, { useMemo, useState, useEffect } from 'react';
import {
    Pill,
    ArrowLeft,
    Download,
    Search,
    TrendingUp,
    Activity,
    ArrowRight,
    PieChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DB } from '../../services/db';
import { Visit } from '../../types';

const MedicationFrequencyReport = () => {
    const navigate = useNavigate();
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const v = await DB.getVisits();
            setVisits(v);
            setLoading(false);
        };
        loadData();
    }, []);

    const data = useMemo(() => {
        const counts: Record<string, number> = {};
        let totalMeds = 0;

        visits.forEach(v => {
            v.medicines.forEach(m => {
                const medName = m.name.toUpperCase();
                counts[medName] = (counts[medName] || 0) + 1;
                totalMeds++;
            });
        });

        return Object.entries(counts)
            .map(([name, count]) => ({
                name,
                count,
                percentage: totalMeds > 0 ? Math.round((count / totalMeds) * 100) : 0
            }))
            .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
            .sort((a, b) => b.count - a.count);
    }, [visits, query]);

    const handleExport = () => {
        const headers = ["Medicine Name", "Prescription Count", "Frequency %"];
        const rows = data.map(item => [item.name, item.count.toString(), `${item.percentage}%`]);
        DB.downloadCSV("Medication_Frequency_Report", headers, rows);
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-[0.3em]">Auditing Pharmaceutical Clusters...</div>;

    return (
        <div className="max-w-[1440px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                    <button onClick={() => navigate('/reports')} className="flex items-center text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest mb-4">
                        <ArrowLeft size={14} className="mr-2" />
                        Back to Hub
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Pharmacy Insights</h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Medication prescription trends and inventory forecasting</p>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search medicine..."
                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-[13px] font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-sm transition-all"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-3 bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download size={16} />
                        <span>Excel</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data.slice(0, 3).map((item, idx) => (
                    <div key={item.name} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${idx === 0 ? 'bg-blue-600 text-white' : idx === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                            <Pill size={20} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {idx === 0 ? 'Top Prescribed' : idx === 1 ? 'High Demand' : 'Standard Rx'}
                        </p>
                        <h3 className="text-2xl font-black mt-3 text-slate-900 font-serif-clinical pr-12 truncate">{item.name}</h3>
                        <div className="mt-8 flex items-baseline space-x-4">
                            <span className="text-4xl font-black text-slate-900">{item.count}</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Orders This Month</span>
                        </div>
                        <div className="absolute top-8 right-8 text-blue-600 flex items-center space-x-1">
                            <TrendingUp size={14} />
                            <span className="text-xs font-black">{item.percentage}%</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center">
                        <Activity size={18} className="mr-3 text-blue-600" />
                        Medication frequency scorecard
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="px-10 py-5">Pharmaceutical Molecule / Name</th>
                                <th className="px-10 py-5">Prescription Volume</th>
                                <th className="px-10 py-5 text-right">Frequency %</th>
                                <th className="px-10 py-5 text-right">Forecast</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map(item => (
                                <tr key={item.name} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-6">
                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-wide">{item.name}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${item.percentage * 5}%` }} // Adjusted multiplier for visibility
                                            ></div>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{item.count} Clinical Rx Issued</p>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <p className="text-[15px] font-black text-slate-900 font-serif-clinical">{item.percentage}%</p>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="inline-flex items-center text-blue-600">
                                            <ArrowRight size={14} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No medication records found for this period.</p>
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

export default MedicationFrequencyReport;
