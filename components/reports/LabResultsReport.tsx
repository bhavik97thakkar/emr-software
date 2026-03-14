
import React, { useMemo, useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Calendar,
  ChevronLeft,
  Download,
  Eye,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DB } from '../../services/db';
import { Report, Patient } from '../../types';

const LabResultsReport = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [r, p] = await Promise.all([
        DB.getReports(),
        DB.getPatients()
      ]);
      setAllReports(r);
      setAllPatients(p);
      setLoading(false);
    };
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return allReports.filter(r => {
      const patient = allPatients.find(p => p.mobile === (r as any).patientMobile);
      const matchesPatient = patient?.name.toLowerCase().includes(query.toLowerCase()) || (r as any).patientMobile?.includes(query);
      const matchesDesc = r.description.toLowerCase().includes(query.toLowerCase());
      return matchesPatient || matchesDesc;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allReports, allPatients, query]);

  const handleExport = () => {
    const headers = ["Date", "Patient Name", "Mobile", "Description", "Type", "File Name"];
    const rows = filtered.map(r => {
      const p = allPatients.find(patient => patient.mobile === (r as any).patientMobile);
      return [
        new Date(r.date).toLocaleDateString(),
        p?.name || 'Unknown',
        (r as any).patientMobile || 'N/A',
        r.description,
        r.type,
        r.fileName
      ];
    });
    DB.downloadCSV("Lab_Archives_Report", headers, rows);
  };

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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Lab Archives</h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Practice-wide digitized investigation logs</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search record..."
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
                <th className="px-10 py-5">Patient Details</th>
                <th className="px-10 py-5">Document Metadata</th>
                <th className="px-10 py-5">Upload Date</th>
                <th className="px-10 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(report => {
                const patient = allPatients.find(p => p.mobile === (report as any).patientMobile);
                return (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 ${patient?.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                          {patient?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{patient?.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{(report as any).patientMobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center">
                          {report.fileData.includes('pdf') ? <FileText size={14} /> : <ImageIcon size={14} />}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide truncate max-w-[200px]">{report.description}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{report.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-[11px] font-bold text-slate-600">{new Date(report.date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/patient/${(report as any).patientMobile}`}
                          className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="View Profile"
                        >
                          <Eye size={18} />
                        </Link>
                        <a
                          href={report.fileData}
                          download={report.fileName}
                          className="p-3 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Download"
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No reports found matching your criteria.</p>
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

export default LabResultsReport;
