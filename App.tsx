
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  Users,
  PlusCircle,
  Search,
  LayoutDashboard,
  Settings,
  ChevronRight,
  Menu,
  X,
  Stethoscope,
  User,
  UserPlus,
  BarChart4,
  ChevronLeft,
  Bell,
  CalendarCheck,
  Clock,
  ArrowRight,
  Lock,
  Globe,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  AlertCircle,
  IndianRupee,
  ShieldCheck,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';
import { DB } from './services/db';
import { Patient, Appointment, Visit } from './types';
import Dashboard from './components/Dashboard';
import PatientProfile from './components/PatientProfile';
import NewVisit from './components/NewVisit';
import DiagnosisMaster from './components/DiagnosisMaster';
import PatientList from './components/PatientList';
import FamilyList from './components/FamilyList';
import RevenueReport from './components/RevenueReport';
import ReportsHub from './components/ReportsHub';
import LabResultsReport from './components/reports/LabResultsReport';
import ClinicalHistoryReport from './components/reports/ClinicalHistoryReport';
import QualityReport from './components/reports/QualityReport';
import FinancialLedgerReport from './components/reports/FinancialLedgerReport';
import SettlementAnalysisReport from './components/reports/SettlementAnalysisReport';
import DayWiseRevenueReport from './components/reports/DayWiseRevenueReport';
import Login from './components/Login';
import VoiceInput from './components/VoiceInput';
import SyncHub from './components/SyncHub';
import DiseasePrevalenceReport from './components/reports/DiseasePrevalenceReport';
import PatientRetentionReport from './components/reports/PatientRetentionReport';
import DemographicPersonaReport from './components/reports/DemographicPersonaReport';
import MedicationFrequencyReport from './components/reports/MedicationFrequencyReport';
import ReferralSourceReport from './components/reports/ReferralSourceReport';
import { ToastProvider } from './context/ToastContext';
import GuideOverlay, { GuideStep } from './components/GuideOverlay';

const ConnectivityBadge = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleApiStatus = (e: any) => setIsOnline(e.detail.online);
    const handleNetworkOnline = () => {
      setIsOnline(true);
      DB.ping(); // Immediate check when browser says we're back
    };
    const handleNetworkOffline = () => setIsOnline(false);

    window.addEventListener('medcore-api-status', handleApiStatus);
    window.addEventListener('online', handleNetworkOnline);
    window.addEventListener('offline', handleNetworkOffline);

    // Proactive heart-beat check
    const interval = setInterval(() => DB.ping(), 20000);

    // Initial check
    DB.ping();

    return () => {
      window.removeEventListener('medcore-api-status', handleApiStatus);
      window.removeEventListener('online', handleNetworkOnline);
      window.removeEventListener('offline', handleNetworkOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={`hidden lg:flex items-center space-x-3 px-4 py-2 rounded-2xl border transition-all shadow-sm ${isOnline ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
      }`}>
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isOnline ? 'text-emerald-600' : 'text-rose-600'
        }`}>
        {isOnline ? 'Cloud Synced' : 'Local Only'}
      </span>
      {isOnline ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-rose-400" />}
    </div>
  );
};

const Sidebar = ({ isOpen, toggle, isCollapsed, onToggleCollapse, currentUser, onLogoutRequest, syncStatus, onStartGuide }: {
  isOpen: boolean,
  toggle: () => void,
  isCollapsed: boolean,
  onToggleCollapse: () => void,
  currentUser: any,
  onLogoutRequest: () => void,
  syncStatus: any,
  onStartGuide: (key: string) => void
}) => {
  const isUpToDate = syncStatus.lastSync && new Date(syncStatus.lastSync) >= new Date(syncStatus.lastChange);

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 bg-[#050912] text-slate-400 transform transition-all duration-300 ease-in-out md:translate-x-0 no-print flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center h-20 border-b border-white/5 transition-all px-4 ${isCollapsed ? 'flex-col justify-center space-y-2 py-4 h-auto' : 'justify-between'}`}>
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/40 shrink-0">
            <Stethoscope size={22} strokeWidth={2.5} />
          </div>
          {!isCollapsed && <span className="text-sm font-black text-white tracking-widest font-serif-clinical">MEDCORE</span>}
        </div>
        <button onClick={onToggleCollapse} className={`hidden md:flex p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all ${isCollapsed ? 'w-10 h-10 items-center justify-center' : ''}`}>
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <div className={`p-4 border-b border-white/5 flex items-center transition-all ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>
        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 border border-white/5 shrink-0">
          <User size={20} />
        </div>
        {!isCollapsed && (
          <div className="flex-1 overflow-hidden">
            <p className="text-[11px] font-black text-white uppercase tracking-wider truncate leading-tight">{currentUser?.name}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight truncate mt-0.5">{currentUser?.email}</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
        <nav className="p-4 space-y-2">
          <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={toggle} isCollapsed={isCollapsed} tourClass="tour-sidebar-dashboard" />
          <NavLink to="/new-visit" icon={<UserPlus size={20} />} label="New Patient" onClick={toggle} isCollapsed={isCollapsed} tourClass="tour-sidebar-newpatient" />
          <NavLink to="/patients" icon={<User size={20} />} label="Patients" onClick={toggle} isCollapsed={isCollapsed} tourClass="tour-sidebar-patients" />
          <NavLink to="/families" icon={<Users size={20} />} label="Families" onClick={toggle} isCollapsed={isCollapsed} tourClass="tour-sidebar-families" />
          <NavLink to="/reports" icon={<BarChart4 size={20} />} label="Analytics" onClick={toggle} isCollapsed={isCollapsed} tourClass="tour-sidebar-analytics" />
          <NavLink to="/diagnosis-master" icon={<Settings size={20} />} label="Templates" onClick={toggle} isCollapsed={isCollapsed} tourClass="tour-sidebar-templates" />
          <NavLink to="/cloud" icon={<Cloud size={20} className={isUpToDate ? "text-emerald-500" : "text-blue-400"} />} label="Cloud" onClick={toggle} isCollapsed={isCollapsed} tourClass="tour-sidebar-cloud" />
        </nav>

        <div className="px-4 mt-4">
          <button
            onClick={() => {
              console.log("[Sidebar] Starting Guide...");
              onStartGuide('global');
            }}
            id="clinical-guide-button"
            className={`flex items-center w-full p-4 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/40 border border-indigo-500/30 group ${isCollapsed ? 'justify-center mx-auto w-12 h-12 p-0' : 'space-x-4'}`}
            title="Start Interactive Clinical Walkthrough"
          >
            <Sparkles size={20} className="group-hover:rotate-12 transition-transform text-indigo-200" />
            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em] font-sans">Interactive Guide</span>}
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 w-full border-t border-white/5 bg-[#050912]/80 backdrop-blur-xl">
        <div className="p-4">
          <button onClick={onLogoutRequest} className={`flex items-center w-full p-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all group ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>
            <LogOut size={20} />
            {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

const NetworkAlertBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleApiStatus = (e: any) => setIsOnline(e.detail.online);
    const handleNetworkOnline = () => setIsOnline(true);
    const handleNetworkOffline = () => setIsOnline(false);

    window.addEventListener('medcore-api-status', handleApiStatus);
    window.addEventListener('online', handleNetworkOnline);
    window.addEventListener('offline', handleNetworkOffline);

    return () => {
      window.removeEventListener('medcore-api-status', handleApiStatus);
      window.removeEventListener('online', handleNetworkOnline);
      window.removeEventListener('offline', handleNetworkOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-rose-600 text-white px-8 py-3 flex items-center justify-between no-print animate-in slide-in-from-top-full duration-500">
      <div className="flex items-center space-x-3">
        <WifiOff size={18} className="animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Offline Mode Active: Practice records are currently saving to local storage only. Cloud sync paused.</span>
      </div>
      <div className="flex items-center space-x-2">
        <AlertCircle size={14} className="opacity-50" />
        <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">Internet connection lost</span>
      </div>
    </div>
  );
};

const NavLink = ({ to, icon, label, onClick, isCollapsed, tourClass }: { to: string, icon: React.ReactNode, label: string, onClick: () => void, isCollapsed: boolean, tourClass?: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link to={to} onClick={onClick} className={`flex items-center transition-all group rounded-2xl p-3.5 ${tourClass || ''} ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30' : 'hover:bg-white/5 text-slate-400 hover:text-white'} ${isCollapsed ? 'justify-center' : 'space-x-5'}`}>
      <div className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>{icon}</div>
      {!isCollapsed && <span className="text-[11px] font-bold uppercase tracking-[0.15em]">{label}</span>}
    </Link>
  );
};

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(DB.getCurrentUser());
  const [syncStatus, setSyncStatus] = useState<any>(DB.getSyncStatus());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeGuide, setActiveGuide] = useState<string | null>(null);

  const GUIDES: Record<string, GuideStep[]> = {
    global: [
      {
        target: 'tour-sidebar-dashboard',
        route: '/',
        title: '👋 Welcome to MedCore',
        description: 'This is your Practice Command Centre — where your clinical day begins. Revenue, patient flow, and your schedule are visible right from this screen. No more switching between apps.'
      },
      {
        target: 'practice-command',
        route: '/',
        title: 'Live Practice Intelligence',
        description: 'These cards update in real time. Total patients seen today, pending dues, daily collections — everything you need to know at a glance, without asking your staff.'
      },
      {
        target: 'tour-dashboard-schedule',
        route: '/',
        title: 'Your Clinical Queue',
        description: "Today's appointments are listed here. You can see why a patient is visiting before they walk in. Tap any appointment to jump directly to their record."
      },
      {
        target: 'tour-dashboard-intelligence',
        route: '/',
        title: 'Disease Pattern Insights',
        description: "Your top diagnoses this month — automatically tracked. No manual entry. Use this to spot outbreaks early, monitor seasonal trends, and benchmark your clinic's health profile."
      },
      {
        target: 'encounter-entry',
        route: '/',
        title: '⚡ Start a Consultation',
        description: "This button opens a new patient visit. You'll capture vitals, symptoms, diagnosis, and prescription — all in one screen. Fast, structured, and printable."
      },
      {
        target: 'tour-sidebar-newpatient',
        route: '/new-visit',
        title: 'Register a New Patient',
        description: "First visit? Takes under 60 seconds. Enter the patient's name, mobile number, and date of birth. The system auto-generates their unique medical record number."
      },
      {
        target: 'tour-sidebar-patients',
        route: '/patients',
        title: 'Full Patient Directory',
        description: "Every patient you've ever seen, searchable by name or mobile number. Tap any patient to open their complete medical history — past visits, prescriptions, lab results, and notes."
      },
      {
        target: 'tour-sidebar-families',
        route: '/families',
        title: 'Family Health Mapping',
        description: "Group a mother, father, and children as one household. Invaluable for paediatric follow-ups, hereditary risk assessments, and spotting household-wide infections."
      },
      {
        target: 'tour-sidebar-analytics',
        route: '/reports',
        title: 'Analytics & Clinical Reports',
        description: "Generate reports for disease prevalence, revenue trends, pharmacy utilization, and patient retention. Built for doctors who want data — not spreadsheets."
      },
      {
        target: 'tour-sidebar-templates',
        route: '/diagnosis-master',
        title: 'Prescription Templates',
        description: "Save your most common treatment protocols once — e.g. 'Viral Fever + Paracetamol + ORS'. Apply them in one tap during a consultation. Saves 2–3 minutes per patient."
      },
      {
        target: 'tour-sidebar-cloud',
        route: '/cloud',
        title: '🔒 Your Private Cloud Vault',
        description: "Patient data is stored on a dedicated Private Cloud server — not shared infrastructure. Only you hold the access keys. Check your sync status and connectivity from here."
      },
      {
        target: 'clinical-guide-button',
        route: '/',
        title: "You're All Set, Doctor! 🎉",
        description: "You've completed the MedCore orientation. Whenever you want to revisit any feature, click the Interactive Guide button in the sidebar. Your clinic, your data, your control."
      }
    ],
    dashboard: [
      {
        target: 'practice-command',
        route: '/',
        title: 'Practice Command Centre',
        description: "Your clinic's live vital signs. Monitor revenue, active patients, household networks, and outstanding receivables — updated every time a visit is recorded."
      },
      {
        target: 'tour-dashboard-schedule',
        route: '/',
        title: 'Clinical Appointment Queue',
        description: 'Your day-view appointment calendar. Switch between Day, Week, and Month. Click any appointment to open the patient profile and prep for the consultation.'
      },
      {
        target: 'tour-dashboard-intelligence',
        route: '/',
        title: 'Case Frequency Intelligence',
        description: 'A visual breakdown of your most frequently diagnosed conditions this period. Spot trends, manage chronic disease load, and generate prevalence reports from here.'
      }
    ],
    profile: [
      {
        target: 'patient-sovereignty',
        route: '/',
        title: 'Patient Health Sovereignty',
        description: "This is the patient's complete longitudinal record. Every vital, every visit, every prescription — in one place. Search, filter, and review in seconds."
      },
      {
        target: 'tour-profile-ledger',
        route: '/',
        title: 'Clinical Encounter Ledger',
        description: 'A chronological log of every consultation this patient has had at your clinic. Tap any visit to review the full SOAP notes, diagnosis, and prescriptions issued.'
      }
    ],
    visit: [
      {
        target: 'vitals-ribbon',
        title: 'Sticky Vitals Ribbon',
        description: "The patient's active vitals — Weight, BP, SpO₂, Temperature — stay pinned to this bar as you scroll through the prescription. Critical context that should never leave your field of view."
      },
      {
        target: 'voice-terminal',
        title: 'AI Voice Terminal',
        description: "Speak your clinical notes naturally. The AI transcribes, structures, and even suggests relevant diagnoses and medications — letting you focus on the patient, not the keyboard."
      },
      {
        target: 'allergy-alert',
        title: '⚠️ Allergy Safety Alert',
        description: "If the patient has documented drug allergies, this panel pulses in rose-red to command your attention. It is the highest-priority alert on this screen — impossible to miss."
      }
    ],
    cloud: [
      {
        target: 'sync-hub',
        route: '/cloud',
        title: 'Cloud Infrastructure Panel',
        description: "Monitor your private server's connectivity, last sync timestamp, and data health. When the indicator is green, your data is continuously backed up to your dedicated Hostinger server."
      },
      {
        target: 'registry-pulse',
        route: '/cloud',
        title: 'Registry Sync Pulse',
        description: "This tracker shows the live count of patient records, visits, and prescriptions that have been successfully pushed to your cloud vault. Your safety net against data loss."
      }
    ]
  };

  useEffect(() => {
    const handleUpdate = () => {
      const user = DB.getCurrentUser();
      setCurrentUser(user);
      setSyncStatus(DB.getSyncStatus());
    };
    window.addEventListener('emr-db-update', handleUpdate);
    return () => window.removeEventListener('emr-db-update', handleUpdate);
  }, []);

  // Integrated Walkthrough Auto-Trigger System
  const location = useLocation();
  // Integrated Walkthrough Auto-Trigger System
  useEffect(() => {
    if (!currentUser) return;

    // 1. Check for first-time global orientation
    if (!localStorage.getItem('medcore_guide_global')) {
      setActiveGuide('global');
      return;
    }

    // 2. Fallback to contextual guides based on path
    const path = location.pathname;
    let contextGuideKey = '';

    if (path === '/') contextGuideKey = 'dashboard';
    else if (path.startsWith('/patient/')) contextGuideKey = 'profile';
    else if (path === '/new-visit') contextGuideKey = 'visit';
    else if (path === '/cloud') contextGuideKey = 'cloud';

    if (contextGuideKey && !localStorage.getItem(`medcore_guide_${contextGuideKey}`)) {
      setActiveGuide(contextGuideKey);
    }
  }, [location.pathname, !!currentUser]);

  if (!currentUser) return <Login onLoginSuccess={(user) => { setCurrentUser(user); }} />;

  return (
    <>
      <div className="min-h-screen bg-[#fcfaf7] flex">
        <Sidebar
          isOpen={isSidebarOpen}
          toggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          currentUser={currentUser}
          onLogoutRequest={() => setShowLogoutConfirm(true)}
          syncStatus={syncStatus}
          onStartGuide={setActiveGuide}
        />
        <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center px-8 justify-between no-print shadow-sm">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 md:hidden text-slate-600 hover:text-slate-900 transition-colors"><Menu size={24} /></button>
            <div className="flex-1 flex justify-center md:justify-start"><div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hidden lg:block">MedCore Clinical Terminal v4.2</div></div>
            <div className="flex items-center space-x-6">
              <ConnectivityBadge />
              <Link to="/new-visit" className="encounter-entry flex items-center space-x-3 bg-[#050912] text-white px-7 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">
                <PlusCircle size={18} /><span>Encounter Entry</span>
              </Link>
            </div>
          </header>
          <NetworkAlertBanner />
          <div className="p-6 md:p-10 flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<PatientList />} />
              <Route path="/families" element={<FamilyList />} />
              <Route path="/patient/:mobile" element={<PatientProfile />} />
              <Route path="/new-visit" element={<NewVisit />} />
              <Route path="/reports" element={<ReportsHub />} />
              <Route path="/reports/lab" element={<LabResultsReport />} />
              <Route path="/reports/history" element={<ClinicalHistoryReport />} />
              <Route path="/reports/quality" element={<QualityReport />} />
              <Route path="/reports/financial" element={<FinancialLedgerReport />} />
              <Route path="/reports/settlement" element={<SettlementAnalysisReport />} />
              <Route path="/reports/day-wise-revenue" element={<DayWiseRevenueReport />} />
              <Route path="/reports/prevalence" element={<DiseasePrevalenceReport />} />
              <Route path="/reports/retention" element={<PatientRetentionReport />} />
              <Route path="/reports/demographics" element={<DemographicPersonaReport />} />
              <Route path="/reports/medication" element={<MedicationFrequencyReport />} />
              <Route path="/reports/referral" element={<ReferralSourceReport />} />
              <Route path="/diagnosis-master" element={<DiagnosisMaster />} />
              <Route path="/cloud" element={<SyncHub />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-xl font-black font-serif-clinical">Exit Clinical Session?</h3>
            <div className="mt-8 space-y-3">
              <button onClick={() => { 
                DB.logout(); 
                setCurrentUser(null); 
                setShowLogoutConfirm(false); 
                // Reset guide so it shows again on next login
                localStorage.removeItem('medcore_guide_global');
              }} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest">Confirm Sign Out</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {activeGuide && (
        <GuideOverlay
          guideKey={activeGuide}
          steps={GUIDES[activeGuide] || []}
          onClose={() => setActiveGuide(null)}
          onComplete={() => setActiveGuide(null)}
        />
      )}
    </>
  );
};
export default App;
