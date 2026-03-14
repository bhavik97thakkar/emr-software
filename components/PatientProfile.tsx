
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Phone,
  Clock,
  Plus,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  Printer,
  X,
  Check,
  Eye,
  Edit2,
  Image as ImageIcon,
  Calendar,
  Activity,
  History as HistoryIcon,
  CalendarCheck,
  FileEdit,
  Paperclip,
  ArrowRight,
  Trash2,
  Trash,
  AlertCircle,
  Download,
  Files,
  Archive,
  Loader2,
  ClipboardList,
  Stethoscope,
  Pill,
  Wallet,
  CreditCard,
  IndianRupee
} from 'lucide-react';
import { DB } from '../services/db';
import { Patient, Visit, Report, Family, Appointment } from '../types';
import VisitForm from './VisitForm';
import PrescriptionPrint from './PrescriptionPrint';
import { RELATIONSHIPS, GENDERS } from '../constants';
import { useToast } from '../context/ToastContext';

const AppointmentModal = ({
  patientMobile,
  onClose,
  onRefresh,
  initialAppointment
}: {
  patientMobile: string,
  onClose: () => void,
  onRefresh: () => void,
  initialAppointment?: Appointment | null
}) => {
  const [formData, setFormData] = useState<Appointment>({
    id: initialAppointment?.id || Math.random().toString(36).substr(2, 9),
    patientMobile,
    date: initialAppointment?.date || new Date().toISOString().split('T')[0],
    time: initialAppointment?.time || '10:00',
    reason: initialAppointment?.reason || 'Follow-up',
    status: initialAppointment?.status || 'Scheduled'
  });

  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = !!initialAppointment;

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (isEdit) {
        await DB.updateAppointment(formData);
      } else {
        await DB.saveAppointment(formData);
      }
      onRefresh();
      onClose();
    } catch (err) {
      setIsSaving(false);
      toast.error("Error saving appointment. Check connection.");
    }
  };

  const handleDelete = async () => {
    toast.confirm({
      title: "Remove Appointment",
      message: "Permanently remove this appointment record?",
      danger: true,
      onConfirm: async () => {
        await DB.deleteAppointment(formData.id);
        onRefresh();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 no-print animate-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className={`p-6 flex items-center justify-between text-white ${isEdit ? 'bg-indigo-600' : 'bg-slate-900'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
              <CalendarCheck size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] leading-none">
                {isEdit ? 'Update Booking' : 'Schedule Session'}
              </h3>
              <p className="text-[10px] text-white/60 mt-1 uppercase font-bold tracking-tight">
                {isEdit ? `Modifying ID: ${formData.id.toUpperCase()}` : 'Booking follow-up session'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Date</label>
              <input
                type="date"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm text-slate-900 transition-all"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Slot</label>
              <input
                type="time"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm text-slate-900 transition-all"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purpose / Reason</label>
            <input
              type="text"
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm text-slate-900 transition-all"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Test report review"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Status</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Scheduled', 'Completed', 'Cancelled', 'Missed'] as const).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, status })}
                  className={`px-3 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.status === status ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            {isEdit && (
              <button
                onClick={handleDelete}
                className="w-16 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-100 transition-all border border-rose-100 shadow-sm"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex-1 h-14 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 ${isEdit ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} strokeWidth={3} />}
              <span>{isEdit ? 'Sync Changes' : 'Confirm Schedule'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportViewerModal = ({ report, onClose }: { report: Report, onClose: () => void }) => {
  const isPdf = report.fileData.includes('application/pdf') || report.fileName.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 no-print animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 leading-none">Viewing Report</p>
              <h3 className="text-xs font-bold truncate max-w-[200px] md:max-w-md mt-1">{report.description}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={report.fileData}
              download={report.fileName}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white flex items-center space-x-2"
            >
              <Download size={18} />
            </a>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-4">
          {isPdf ? (
            <iframe
              src={`${report.fileData}#toolbar=0`}
              className="w-full h-full rounded-xl border border-slate-200 bg-white"
              title={report.description}
            />
          ) : (
            <img
              src={report.fileData}
              alt={report.description}
              className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const EditPatientModal = ({ patient, onClose, onUpdate }: { patient: Patient, onClose: () => void, onUpdate: (updated: Patient) => void }) => {
  const [formData, setFormData] = useState({ ...patient });

  const handleSave = async () => {
    if (formData.name.trim() && formData.age !== undefined) {
      await DB.savePatient(formData);
      onUpdate(formData);
      onClose();
    }
  };

  const updateHabit = (field: keyof NonNullable<Patient['habits']>, value: string) => {
    setFormData(prev => ({ ...prev, habits: { ...prev.habits, [field]: value } }));
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let ageCalculated = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      ageCalculated--;
    }
    return ageCalculated;
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobVal = e.target.value;
    setFormData({ ...formData, dob: dobVal, age: calculateAge(dobVal) });
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 no-print animate-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] leading-none">Edit Profile</h3>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">Updating information for {patient.mobile}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Demographics */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b pb-2">Demographics</h4>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birth Date</label>
                  <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm text-slate-700" value={formData.dob || ''} onChange={handleDobChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age (Years)</label>
                  <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.age || ''} onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm appearance-none" value={formData.gender || 'Female'} onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blood Group</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.bloodGroup || ''} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Occupation</label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.occupation || ''} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} placeholder="Job Title" />
              </div>
            </div>

            {/* Address & Contact */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b pb-2">Contact & Location</h4>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Street details" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Area</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.area || ''} onChange={(e) => setFormData({ ...formData, area: e.target.value })} placeholder="Locality" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City/Town</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.city || ''} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.state || ''} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PIN Code</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.pin || ''} onChange={(e) => setFormData({ ...formData, pin: e.target.value })} placeholder="Postal Code" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email ID</label>
                <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="patient@example.com" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
            {/* Clinical Markers */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-rose-800 uppercase tracking-widest border-b border-rose-100 pb-2">Clinical Markers</h4>

              <div className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Medicine Allergies</label>
                  <input type="text" value={formData.allergyMedicine || ''} onChange={(e) => setFormData({ ...formData, allergyMedicine: e.target.value })} className="w-full px-4 py-3 bg-rose-50/50 border border-rose-100 rounded-xl outline-none focus:border-rose-300 font-bold text-sm text-rose-700" placeholder="e.g. Penicillin" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Food/Other Allergies</label>
                  <input type="text" value={formData.allergyOther || ''} onChange={(e) => setFormData({ ...formData, allergyOther: e.target.value })} className="w-full px-4 py-3 bg-rose-50/50 border border-rose-100 rounded-xl outline-none focus:border-rose-300 font-bold text-sm text-rose-700" placeholder="e.g. Peanuts, Dust" />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Habits & Addictions</label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Smoke</label>
                    <select value={formData.habits?.smoke || 'No'} onChange={(e) => updateHabit('smoke', e.target.value)} className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold">
                      <option value="No">No</option><option value="Yes">Yes</option><option value="Occasional">Occasional</option><option value="Past">Past</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alcohol</label>
                    <select value={formData.habits?.alcohol || 'No'} onChange={(e) => updateHabit('alcohol', e.target.value)} className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold">
                      <option value="No">No</option><option value="Yes">Yes</option><option value="Occasional">Occasional</option><option value="Past">Past</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Drugs</label>
                    <select value={formData.habits?.drugAbuse || 'No'} onChange={(e) => updateHabit('drugAbuse', e.target.value)} className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold">
                      <option value="No">No</option><option value="Yes">Yes</option><option value="Past">Past</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b pb-2">Referral Info</h4>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referred By</label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.referredBy || ''} onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })} placeholder="Dr. Name / Portal" />
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-100 flex items-center justify-center space-x-2"
          >
            <Check size={18} strokeWidth={3} />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const FamilyModal = ({
  primaryMobile,
  onClose,
  onRefresh
}: {
  primaryMobile: string,
  onClose: () => void,
  onRefresh: () => void
}) => {
  const toast = useToast();
  const [mobile, setMobile] = useState('');
  const [relationship, setRelationship] = useState('Relative');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLink = async () => {
    if (mobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (mobile === primaryMobile) {
      toast.error("Cannot link a patient to themselves.");
      return;
    }

    setIsProcessing(true);
    try {
      await DB.linkFamilyMember(primaryMobile, mobile, relationship);
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while linking family member.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 no-print animate-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] leading-none">Link Family Member</h3>
              <p className="text-[10px] text-white/60 mt-1 uppercase font-bold tracking-tight">Expand patient household network</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relative's Mobile</label>
            <input
              type="tel"
              maxLength={10}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm text-slate-900 transition-all"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile number"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relationship</label>
            <select
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm text-slate-900 appearance-none transition-all"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button
            onClick={handleLink}
            disabled={isProcessing}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} strokeWidth={3} />}
            <span>{isProcessing ? 'Processing...' : 'Confirm Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const PatientProfile = () => {
  const toast = useToast();
  const { mobile } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAddingVisit, setIsAddingVisit] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [printVisit, setPrintVisit] = useState<Visit | null>(null);
  const [selectedReportForView, setSelectedReportForView] = useState<Report | null>(null);
  const [family, setFamily] = useState<Family | undefined>();
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [selectedEncounters, setSelectedEncounters] = useState<Set<string>>(new Set());

  const consultationFormRef = useRef<HTMLDivElement>(null);

  const refreshData = useCallback(async (m: string) => {
    const [h, r, f, a, p] = await Promise.all([
      DB.getPatientHistory(m),
      DB.getPatientReports(m),
      DB.getFamilyByMember(m),
      DB.getAppointments(),
      DB.getPatients()
    ]);
    setVisits(h);
    setReports(r.sort((a, b) => b.date.localeCompare(a.date)));
    setFamily(f);
    setAppointments(a.filter(item => item.patientMobile === m).sort((a, b) => b.date.localeCompare(a.date)));
    setAllPatients(p);
    setSelectedEncounters(new Set());
  }, []);

  useEffect(() => {
    const init = async () => {
      if (mobile) {
        const patients = await DB.getPatients();
        setAllPatients(patients);
        const p = patients.find(pat => pat.mobile === mobile);
        if (p) {
          setPatient(p);
          await refreshData(p.mobile);
          if (searchParams.get('print') === 'true') {
            const currentVisits = await DB.getPatientHistory(p.mobile);
            if (currentVisits.length > 0) {
              setPrintVisit(currentVisits[0]);
              navigate(`/patient/${p.mobile}`, { replace: true });
            }
          }
        } else {
          navigate('/');
        }
      }
    };
    init();

    const handleUpdate = () => {
      if (mobile) refreshData(mobile);
    };
    window.addEventListener('emr-db-update', handleUpdate);
    return () => window.removeEventListener('emr-db-update', handleUpdate);
  }, [mobile, navigate, searchParams, refreshData]);

  useEffect(() => {
    if (editingVisit) {
      setTimeout(() => {
        consultationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [editingVisit]);

  const handleRecordVisitClick = () => {
    setEditingVisit(null);
    setIsAddingVisit(true);
    setTimeout(() => {
      consultationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const totalDues = useMemo(() => {
    return visits.filter(v => v.paymentStatus === 'Pending').reduce((sum, v) => sum + v.amount, 0);
  }, [visits]);

  const handleSaveVisit = async (visit: Visit, shouldPrint: boolean = false) => {
    if (editingVisit) await DB.updateVisit(visit); else await DB.saveVisit(visit);
    setIsAddingVisit(false);
    setEditingVisit(null);
    if (patient) await refreshData(patient.mobile);
    if (shouldPrint) setPrintVisit(visit);
  };

  const handleUnlink = async (e: React.MouseEvent, mMobile: string) => {
    e.stopPropagation();
    toast.confirm({
      title: "Remove Family Member",
      message: "Are you sure you want to remove this member from the family group?",
      danger: true,
      onConfirm: async () => {
        await DB.unlinkFamilyMember(mMobile);
        if (patient) await refreshData(patient.mobile);
        toast.success("Family relationship removed");
      }
    });
  };

  const toggleEncounterSelection = (visitId: string) => {
    setSelectedEncounters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(visitId)) {
        newSet.delete(visitId);
      } else {
        newSet.add(visitId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEncounters.size === visits.length) {
      setSelectedEncounters(new Set());
    } else {
      setSelectedEncounters(new Set(visits.map(v => v.id)));
    }
  };

  const handleDeleteEncounter = async (visitId: string) => {
    toast.confirm({
      title: "Delete Encounter",
      message: "Delete this encounter record? This action cannot be undone.",
      danger: true,
      onConfirm: async () => {
        await DB.deleteVisit(visitId);
        setSelectedEncounters(prev => {
          const newSet = new Set(prev);
          newSet.delete(visitId);
          return newSet;
        });
        if (patient) await refreshData(patient.mobile);
      }
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedEncounters.size === 0) return;
    toast.confirm({
      title: "Delete Selected",
      message: `Delete ${selectedEncounters.size} selected encounter(s)? This action cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        await DB.deleteVisits(Array.from(selectedEncounters));
        setSelectedEncounters(new Set());
        if (patient) await refreshData(patient.mobile);
      }
    });
  };

  if (!patient) return null;

  return (
    <div className="space-y-6 pb-16 max-w-[1440px] mx-auto animate-in fade-in duration-500">
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div className="flex items-center space-x-6">
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-white border-4 border-white shadow-lg shrink-0 transition-colors ${patient.gender === 'Female' ? 'bg-pink-500' : 'bg-blue-600'}`}>
            <User size={28} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center font-serif-clinical">
                {patient.name}
                <button onClick={() => setIsEditingProfile(true)} className="ml-3 p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Profile"><Edit2 size={14} /></button>
                <div className="relative group/delete">
                  <button
                    onClick={() => {
                      toast.confirm({
                        title: "Delete Patient",
                        message: "Are you sure you want to permanently delete this patient and all their medical records? This cannot be undone.",
                        danger: true,
                        onConfirm: () => {
                          DB.deletePatient(patient.mobile).then(() => {
                            toast.success("Patient record deleted successfully");
                            navigate('/');
                          });
                        }
                      });
                    }}
                    className="ml-1 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg transition-all flex items-center space-x-2 border border-rose-100 opacity-30 hover:opacity-100 group-hover/delete:opacity-100"
                    title="Delete Profile"
                  >
                    <Trash2 size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Delete Patient</span>
                  </button>
                </div>
              </h1>
              {totalDues > 0 && <span className="bg-rose-50 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-widest">Awaiting Payment</span>}
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3 mt-2 font-bold uppercase tracking-widest">
              <span className="flex items-center bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] text-slate-700 font-black"><Phone size={12} className="mr-1.5 opacity-40" /> {patient.mobile}</span>
              <span className="flex items-center bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] text-slate-700 font-black uppercase"><Calendar size={12} className="mr-1.5 opacity-40" /> {patient.age}y</span>
              <span className="flex items-center bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] text-slate-700 font-black uppercase">{patient.gender}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 w-full md:w-auto">
          <button onClick={() => { setEditingAppointment(null); setIsScheduling(true); }} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-white border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95"><CalendarCheck size={18} /><span>Schedule</span></button>
          <button onClick={handleRecordVisitClick} className="flex-[1.5] md:flex-none flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-100 active:scale-95"><Plus size={18} /><span>Record Visit</span></button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-[10px] tracking-widest uppercase flex items-center">
            <HistoryIcon size={18} className="mr-3 text-indigo-600" />
            Past Medical History & chronic Records
          </h3>
          <button onClick={handleRecordVisitClick} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={14} /></button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <FileEdit size={12} className="mr-2" /> Clinical Summary
            </p>
            <div className="bg-indigo-50/20 p-5 rounded-2xl border border-indigo-100/30 min-h-[100px]">
              {patient.pastHistoryNotes ? (
                <p className="text-xs font-medium text-indigo-900 leading-relaxed whitespace-pre-wrap">{patient.pastHistoryNotes}</p>
              ) : (
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest py-8 text-center italic">No chronic history recorded</p>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <Paperclip size={12} className="mr-2" /> Historical Documents
            </p>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">
              {reports.filter(r => r.type === 'Past Record').length > 0 ? (
                reports.filter(r => r.type === 'Past Record').map(r => (
                  <div key={r.id} onClick={() => setSelectedReportForView(r)} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-400 cursor-pointer group transition-all">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <FileText size={14} className="text-indigo-500" />
                      <span className="text-[10px] font-black text-slate-700 truncate uppercase">{r.description}</span>
                    </div>
                    <ArrowRight size={12} className="text-slate-300 group-hover:text-indigo-600" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No archives</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* Encounter Ledger (Showing exact time) */}
        <div className="lg:col-span-12">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-[10px] tracking-widest uppercase flex items-center">
                <HistoryIcon size={18} className="mr-3 text-blue-600" />
                Clinical Encounter Ledger
              </h3>
              <div className="flex items-center space-x-4">
                {selectedEncounters.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="text-[10px] font-black text-white bg-rose-600 hover:bg-rose-700 border border-rose-700 px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center space-x-2 transition-colors"
                  >
                    <Trash2 size={12} />
                    <span>Delete {selectedEncounters.size}</span>
                  </button>
                )}
                <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-lg uppercase tracking-widest">{visits.length} Encounters</span>
                {totalDues > 0 && (
                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-lg uppercase tracking-widest flex items-center">
                    <IndianRupee size={12} className="mr-1" /> ₹{totalDues} Outstanding
                  </span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-4 py-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={visits.length > 0 && selectedEncounters.size === visits.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnosis</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Prescription (Rx)</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Advice / Notes</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Billing & Settlement</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visits.length > 0 ? (
                    visits.map((v) => (
                      <tr key={v.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-4 py-5 align-top text-center w-12">
                          <input
                            type="checkbox"
                            checked={selectedEncounters.has(v.id)}
                            onChange={() => toggleEncounterSelection(v.id)}
                            className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-5 align-top whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-black text-slate-900 uppercase">
                              {new Date(v.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] font-bold text-blue-600 uppercase mt-0.5 flex items-center">
                              <Clock size={10} className="mr-1" />
                              {new Date(v.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                            <span className="text-[8px] font-bold text-slate-300 uppercase mt-1 tracking-tighter">ID: {v.id.substring(0, 8)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top max-w-[180px]">
                          <p className="text-[11px] font-black text-slate-700 uppercase leading-tight group-hover:text-blue-600 transition-colors">{v.diagnosis || 'General Checkup'}</p>
                        </td>
                        <td className="px-6 py-5 align-top max-w-[280px]">
                          <div className="flex flex-wrap gap-1">
                            {v.medicines.length > 0 ? v.medicines.map((m, i) => (
                              <div key={i} className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 flex items-center shadow-sm">
                                <div className="w-1 h-1 bg-blue-500 rounded-full mr-1.5"></div>
                                {m.name} ({m.dosage})
                              </div>
                            )) : <span className="text-[10px] text-slate-300 italic">No drugs prescribed</span>}
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top max-w-[240px]">
                          <div className="space-y-2">
                            <p className="text-[10px] font-medium text-slate-500 line-clamp-2 leading-relaxed italic">
                              {v.prescriptionNotes || 'Routine clinical advice provided.'}
                            </p>
                            {v.existingMedicines && (
                              <div className="flex items-center space-x-1.5 px-2 py-1 bg-amber-50 border border-amber-100 rounded-md">
                                <Pill size={10} className="text-amber-500" />
                                <p className="text-[8px] font-black text-amber-700 uppercase tracking-tighter truncate max-w-[150px]">
                                  Current: {v.existingMedicines}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top whitespace-nowrap">
                          <div className="flex flex-col space-y-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-black text-slate-900 font-serif-clinical italic">₹{v.amount}</span>
                              <span className="text-[9px] font-black text-slate-300 uppercase opacity-60">Via</span>
                              <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase border border-slate-200">{v.paymentMethod}</span>
                            </div>
                            <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${v.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'}`}>
                              {v.paymentStatus === 'Paid' ? 'Cleared' : 'Pending Payment'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top text-right">
                          <div className="flex items-center justify-end space-x-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setPrintVisit(v)}
                              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Print Rx"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => { setEditingVisit(v); setIsAddingVisit(true); }}
                              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Refine Entry"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteEncounter(v.id)}
                              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Delete Encounter"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-24 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-inner">
                          <ClipboardList size={32} />
                        </div>
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">No previous clinical history found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Row 2: Grid for Vault, Sessions Tracker, and Relatives (3 equal columns) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-[10px] tracking-widest uppercase flex items-center">
                <Archive size={18} className="mr-3 text-indigo-600" />
                Digital Records Vault
              </h3>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{reports.length} Total Files</span>
            </div>
            <div className="p-6 flex-1 overflow-y-auto max-h-[400px]">
              <div className="grid grid-cols-1 gap-4">
                {reports.length > 0 ? (
                  reports.map(r => (
                    <div key={r.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-blue-400 hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-pointer">
                      <div className="flex items-center space-x-4 overflow-hidden" onClick={() => setSelectedReportForView(r)}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${r.fileData.includes('pdf') ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                          {r.fileData.includes('pdf') ? <FileText size={22} /> : <ImageIcon size={22} />}
                        </div>
                        <div className="truncate">
                          <p className="text-[11px] font-black text-slate-900 uppercase truncate tracking-tight group-hover:text-blue-600 transition-colors">{r.description}</p>
                          <div className="flex items-center space-x-2 mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            <Calendar size={10} />
                            <span>{new Date(r.date).toLocaleDateString()}</span>
                            <span className="opacity-30">•</span>
                            <span>{r.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center border-2 border-dashed border-slate-50 rounded-[3rem] bg-slate-50/20">
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest italic">No clinical files in vault</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-[10px] tracking-widest uppercase flex items-center"><CalendarCheck size={18} className="mr-3 text-emerald-600" />Sessions Tracker</h3>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar flex-1">
              {appointments.length > 0 ? (
                appointments.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:border-blue-200">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-[11px] font-black text-slate-900 uppercase">{a.date}</p>
                        <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border ${a.status === 'Scheduled' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                          a.status === 'Completed' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                            'bg-rose-100 text-rose-600 border-rose-200'
                          }`}>
                          {a.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 truncate">{a.time} • {a.reason}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-12 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No bookings recorded</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-[10px] tracking-widest uppercase flex items-center"><Users size={18} className="mr-3 text-indigo-600" /> Relatives</h3>
              <button onClick={() => setShowFamilyModal(true)} className="w-6 h-6 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 shadow-lg transition-all"><Plus size={16} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto flex-1">
              {family ? (
                <>{family.members.map(member => {
                  const profile = allPatients.find(p => p.mobile === member.mobile);
                  const isSelf = member.mobile === patient.mobile;
                  return (
                    <div key={member.mobile} onClick={() => !isSelf && navigate(`/patient/${member.mobile}`)} className={`flex items-center justify-between group p-3.5 rounded-2xl border transition-all ${isSelf ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-50 hover:border-indigo-100 cursor-pointer shadow-sm hover:shadow-md'}`}>
                      <div className="flex items-center space-x-4 truncate">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${isSelf ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {isSelf ? 'P' : (profile?.name?.charAt(0) || 'U')}
                        </div>
                        <div className="truncate">
                          <p className="text-[12px] font-black text-slate-900 truncate leading-none uppercase tracking-tight">{isSelf ? 'Principal' : (profile?.name || member.mobile)}</p>
                          <p className="text-[9px] text-slate-400 font-black uppercase mt-1.5 italic tracking-widest opacity-60">{member.relationship}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}</>
              ) : (
                <div className="text-center py-10">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Standalone Profile</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-12">
          {(isAddingVisit || editingVisit) && (
            <div ref={consultationFormRef} className="scroll-mt-24 mb-6">
              <VisitForm
                patient={patient}
                onSave={handleSaveVisit}
                onCancel={() => { setIsAddingVisit(false); setEditingVisit(null); }}
                initialVisit={editingVisit || undefined}
              />
            </div>
          )}
        </div>
      </div>

      {showFamilyModal && <FamilyModal primaryMobile={patient.mobile} onClose={() => setShowFamilyModal(false)} onRefresh={() => refreshData(patient.mobile)} />}
      {isEditingProfile && <EditPatientModal patient={patient} onClose={() => setIsEditingProfile(false)} onUpdate={(updated) => setPatient(updated)} />}
      {isScheduling && (
        <AppointmentModal
          patientMobile={patient.mobile}
          onClose={() => { setIsScheduling(false); setEditingAppointment(null); }}
          onRefresh={() => refreshData(patient.mobile)}
          initialAppointment={editingAppointment}
        />
      )}
      {printVisit && <PrescriptionPrint patient={patient} visit={printVisit} onClose={() => setPrintVisit(null)} />}
      {selectedReportForView && <ReportViewerModal report={selectedReportForView} onClose={() => setSelectedReportForView(null)} />}
    </div>
  );
};

export default PatientProfile;
