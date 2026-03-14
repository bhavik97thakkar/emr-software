import React, { useEffect, useState } from 'react';
import { X, Printer, Phone, Mail, MapPin, Stethoscope, MessageCircle, Share2, Check, Send, Share } from 'lucide-react';
import { Patient, Visit } from '../types';

interface PrescriptionPrintProps {
  patient: Patient;
  visit: Visit;
  onClose: () => void;
}

const WhatsAppShareModal = ({
  patient,
  visit,
  onClose,
  onConfirm
}: {
  patient: Patient,
  visit: Visit,
  onClose: () => void,
  onConfirm: (number: string) => void
}) => {
  const [phoneNumber, setPhoneNumber] = useState(patient.mobile || '');

  const handleSend = () => {
    if (phoneNumber.trim().length >= 10) {
      onConfirm(phoneNumber.trim());
    } else {
      alert("Please enter a valid 10-digit mobile number.");
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
        <div className="p-6 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] leading-none">Share via WhatsApp</h3>
              <p className="text-[10px] text-emerald-100 mt-1 uppercase font-bold tracking-tight">Confirm destination number</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="tel"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-lg text-slate-900 transition-all"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter mobile number"
                autoFocus
              />
            </div>
          </div>

          <button
            onClick={handleSend}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-100 flex items-center justify-center space-x-3 active:scale-95"
          >
            <Send size={18} />
            <span>Open WhatsApp Web</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const PrescriptionPrint: React.FC<PrescriptionPrintProps> = ({ patient, visit, onClose }) => {
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const originalTitle = document.title;
    const dateStr = new Date(visit.date).toLocaleDateString('en-GB').replace(/\//g, '_');
    document.title = `Prescription_${patient.name}_${dateStr}`;
    return () => { document.title = originalTitle; };
  }, [patient.name, visit.date]);

  const getClinicalSummary = () => {
    const dateStr = new Date(visit.date).toLocaleDateString('en-GB');
    let vitalsText = '';
    if (visit.vitals) {
      const v = visit.vitals;
      const parts = [];
      if (v.weight) parts.push(`Wt: ${v.weight}kg`);
      if (v.height) parts.push(`Ht: ${v.height}cm`);
      if (v.temp) parts.push(`Temp: ${v.temp}°F`);
      if (v.pulse) parts.push(`Pulse: ${v.pulse}/m`);
      if (parts.length > 0) vitalsText = `\n*Vitals:* ${parts.join(', ')}`;
    }

    const medsText = visit.medicines.map(m => `• *${m.name}* (${m.dosage}) - ${m.frequency} for ${m.duration} days. _${m.instructions}_`).join('\n');
    const testsText = visit.reportsOrdered.length > 0 ? `\n\n*Advised Tests:*\n${visit.reportsOrdered.map(t => `- ${t}`).join('\n')}` : '';
    const ongoingMedsText = visit.existingMedicines ? `\n\n*Current Ongoing Medications:*\n${visit.existingMedicines}` : '';

    return `*MEDICAL PRESCRIPTION*\n` +
      `--------------------------\n` +
      `*Patient:* ${patient.name}\n` +
      `*Age/Gender:* ${patient.age}Y / ${patient.gender}\n` +
      `*Date:* ${dateStr}\n` +
      `*Diagnosis:* ${visit.diagnosis || 'General Checkup'}` +
      `${vitalsText}\n\n` +
      `*Medications (Rx):*\n${medsText}` +
      `${ongoingMedsText}` +
      `${testsText}\n\n` +
      `*Advice:* ${visit.prescriptionNotes || 'General health maintenance.'}\n\n` +
      `--------------------------\n` +
      `_Issued by Dr. Aarti Machhar (MBBS, MD)_\n` +
      `_MedRecord Pro Digital Clinic_`;
  };

  const handleSystemShare = async () => {
    const summary = getClinicalSummary().replace(/\*/g, '').replace(/_/g, ''); // Remove markdown for system share
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Prescription - ${patient.name}`,
          text: summary,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback to email
      const mailtoLink = `mailto:?subject=Prescription: ${patient.name}&body=${encodeURIComponent(summary)}`;
      window.location.href = mailtoLink;
    }
  };

  const handleEmailShare = () => {
    const summary = getClinicalSummary().replace(/\*/g, '').replace(/_/g, '');
    const mailtoLink = `mailto:?subject=Prescription: ${patient.name}&body=${encodeURIComponent(summary)}`;
    window.location.href = mailtoLink;
  };

  const executeWhatsAppShare = (number: string) => {
    const message = getClinicalSummary();
    const encodedMessage = encodeURIComponent(message);
    const cleanNumber = number.startsWith('91') || number.length > 10 ? number : `91${number}`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, '_blank');
    setShowShareModal(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md no-print" onClick={onClose} />

      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative my-4 border border-slate-200 print-container">

        {/* Toolbar */}
        <div className="absolute top-5 right-5 z-[210] flex items-center space-x-2 no-print">
          <div className="bg-white p-1 rounded-2xl shadow-xl border border-slate-100 flex items-center">
            <button
              onClick={handleSystemShare}
              className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="Share to Apps (WhatsApp, Email, etc.)"
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="p-3 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
              title="Direct WhatsApp"
            >
              <MessageCircle size={20} />
            </button>
            <button
              onClick={handleEmailShare}
              className="p-3 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="Direct Email"
            >
              <Mail size={20} />
            </button>
            <div className="w-px h-6 bg-slate-100 mx-1"></div>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100"
            >
              <Printer size={16} />
              <span>Print / PDF</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl shadow-xl border border-slate-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {showShareModal && (
          <WhatsAppShareModal
            patient={patient}
            visit={visit}
            onClose={() => setShowShareModal(false)}
            onConfirm={executeWhatsAppShare}
          />
        )}

        <div className="p-16 print:p-12 text-slate-900 bg-white min-h-[1100px] flex flex-col relative print:shadow-none">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10">
            <div className="flex items-start space-x-6">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg print:shadow-none">
                <Stethoscope size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none font-serif-clinical italic">DR. AARTI MACHHAR</h1>
                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-[0.2em] mt-2 font-sans">MBBS, MD (General Physician)</p>
                <div className="flex items-center space-x-4 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                  <span>Clinical Excellence</span>
                  <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                  <span>Reg: GMC-12345/2025</span>
                </div>
              </div>
            </div>
            <div className="text-right text-[10px] font-bold text-slate-500 space-y-2 uppercase tracking-[0.15em] font-sans">
              <p className="flex items-center justify-end text-slate-800">
                <MapPin size={12} className="mr-2 text-blue-600" /> 102 Crystal Plaza, Sector 15
              </p>
              <p>Mumbai, MH - 400001</p>
              <div className="flex items-center justify-end text-slate-800 font-bold mt-3">
                <Phone size={12} className="mr-2 text-blue-600" /> +91 99999 00000
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 border border-slate-200 rounded-[2.5rem] p-8 mb-12 bg-slate-50/40 print:bg-slate-50/20 font-sans">
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Name</p>
              <p className="text-[16px] font-black text-slate-900 uppercase font-serif-clinical italic leading-none">{patient.name}</p>
            </div>
            <div className="space-y-2 border-l border-slate-200 pl-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact / UID</p>
              <p className="text-[15px] font-bold text-slate-900 leading-none">{patient.mobile}</p>
            </div>
            <div className="space-y-2 border-l border-slate-200 pl-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Demographics</p>
              <p className="text-[15px] font-bold text-slate-900 leading-none">{patient.age}Y • {patient.gender}</p>
            </div>
            <div className="space-y-2 border-l border-slate-200 pl-6 text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Consult Date</p>
              <p className="text-[15px] font-bold text-slate-900 leading-none">{new Date(visit.date).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div className="flex gap-16 flex-1 font-sans">
            <div className="w-[32%] space-y-12 border-r border-slate-100 pr-12">
              {visit.vitals && Object.keys(visit.vitals).length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center">
                    <span className="w-6 h-[2.5px] bg-emerald-500 mr-3 rounded-full"></span> Vitals
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    {visit.vitals.weight && <VitalRow label="Wt" val={`${visit.vitals.weight} kg`} />}
                    {visit.vitals.temp && <VitalRow label="Temp" val={`${visit.vitals.temp}°F`} />}
                    {visit.vitals.pulse && <VitalRow label="Pulse" val={`${visit.vitals.pulse}/m`} />}
                    {(visit.vitals.bp_sys || visit.vitals.bp_dia) && <VitalRow label="BP" val={`${visit.vitals.bp_sys || '-'}/${visit.vitals.bp_dia || '-'}`} />}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center">
                  <span className="w-6 h-[2.5px] bg-blue-600 mr-3 rounded-full"></span> Findings
                </h3>
                <div className="bg-slate-900 text-white p-7 rounded-3xl print:shadow-none shadow-xl border border-white/5">
                  <p className="text-2xl font-black leading-tight uppercase tracking-tight font-serif-clinical italic">{visit.diagnosis || 'General Check-up'}</p>
                </div>
              </div>

              {visit.reportsOrdered.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center">
                    <span className="w-6 h-[2.5px] bg-slate-300 mr-3 rounded-full"></span> Advisories
                  </h3>
                  <div className="space-y-3">
                    {visit.reportsOrdered.map((r, i) => (
                      <div key={i} className="flex items-center space-x-3 text-slate-800 text-[11px] font-bold uppercase py-1 border-b border-slate-50 last:border-none">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0"></div>
                        <span className="leading-tight">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {visit.existingMedicines && (
                <div className="pt-2">
                  <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center">
                    <span className="w-6 h-[2.5px] bg-amber-400 mr-3 rounded-full"></span> Current Meds
                  </h3>
                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 italic text-[10px] font-medium text-amber-900 leading-relaxed whitespace-pre-wrap">
                    {visit.existingMedicines}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-12">
              <div className="flex items-end justify-between border-b-2 border-slate-300 pb-4 mb-10">
                <h3 className="text-7xl font-serif italic font-black text-slate-900 select-none opacity-90 leading-none">Rx</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-sans">Clinical Prescription</p>
              </div>

              <div className="space-y-10">
                {visit.medicines.map((m, i) => (
                  <div key={i} className="pb-10 border-b border-slate-50 last:border-none group">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-5">
                        <h4 className="text-[18px] font-black text-slate-900 uppercase tracking-tight leading-none font-sans">{m.name}</h4>
                        <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200 uppercase leading-none">{m.dosage}</span>
                      </div>
                      <p className="text-[14px] font-black text-blue-600 bg-blue-50/50 px-5 py-2 rounded-xl border border-blue-100 leading-none">{m.frequency}</p>
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-sans italic">{m.instructions} • {m.duration} Days</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-24 flex justify-between items-end font-sans">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] space-y-2.5">
              <p className="text-emerald-600 flex items-center font-black">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-4 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                Authenticated Digital Entry
              </p>
              <p>REF: {visit.id.toUpperCase()}</p>
              <p>Generated via MedRecord Pro Cloud</p>
            </div>
            <div className="text-center w-72">
              <div className="h-[2.5px] bg-slate-900 w-full mb-5 rounded-full"></div>
              <p className="font-black text-slate-900 text-[16px] tracking-tight uppercase font-serif-clinical italic leading-none">Dr. Aarti Machhar</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Medical Superintendent</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VitalRow = ({ label, val }: { label: string, val: string }) => (
  <div className="flex flex-col">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-sans">{label}</p>
    <p className="text-[12px] font-bold text-slate-900 leading-none">{val}</p>
  </div>
);

export default PrescriptionPrint;