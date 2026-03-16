
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
import { seedDemoData } from './services/demoSeed';
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
    <aside className={`fixed inset-y-0 left-0 z-50 bg-[#050912] text-slate-400 transform transition-all duration-300 ease-in-out md:translate-x-0 no-print ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-20' : 'w-64'}`}>
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

      <nav className="p-4 space-y-2">
        <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={toggle} isCollapsed={isCollapsed} />
        <NavLink to="/new-visit" icon={<UserPlus size={20} />} label="New Patient" onClick={toggle} isCollapsed={isCollapsed} />
        <NavLink to="/patients" icon={<User size={20} />} label="Patients" onClick={toggle} isCollapsed={isCollapsed} />
        <NavLink to="/families" icon={<Users size={20} />} label="Families" onClick={toggle} isCollapsed={isCollapsed} />
        <NavLink to="/reports" icon={<BarChart4 size={20} />} label="Analytics" onClick={toggle} isCollapsed={isCollapsed} />
        <NavLink to="/diagnosis-master" icon={<Settings size={20} />} label="Templates" onClick={toggle} isCollapsed={isCollapsed} />
        <NavLink to="/cloud" icon={<Cloud size={20} className={isUpToDate ? "text-emerald-500" : "text-blue-400"} />} label="Cloud" onClick={toggle} isCollapsed={isCollapsed} />
      </nav>

      <div className="px-4 mt-6">
        <button 
          onClick={() => onStartGuide('global')}
          className={`flex items-center w-full p-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/20 group ${isCollapsed ? 'justify-center mx-auto w-10 h-10 p-0' : 'space-x-4'}`}
          title="Clinical Walkthrough"
        >
          <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
          {!isCollapsed && <span className="text-[9px] font-black uppercase tracking-[0.2em]">Clinical Guide</span>}
        </button>
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

const NavLink = ({ to, icon, label, onClick, isCollapsed }: { to: string, icon: React.ReactNode, label: string, onClick: () => void, isCollapsed: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link to={to} onClick={onClick} className={`flex items-center transition-all group rounded-2xl p-3.5 ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30' : 'hover:bg-white/5 text-slate-400 hover:text-white'} ${isCollapsed ? 'justify-center' : 'space-x-5'}`}>
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
      { target: 'sidebar', title: 'Clinical OS Navigation', description: 'Access patient records, analytics, and clinical templates from this high-performance sidebar.', position: 'right' },
      { target: 'encounter-entry', title: 'Rapid Encounter Entry', description: 'Start a new clinical consultation instantly with AI-powered suggestions and voice-first vitals capture.', position: 'bottom' },
      { target: 'connectivity', title: 'Cloud Sovereignty', description: 'Your data syncs automatically with your Hostinger Private Vault. Work offline; we handle the sync.', position: 'bottom' }
    ],
    dashboard: [
      { target: 'practice-command', title: 'Practice Command Centre', description: 'Your 360-degree clinical dashboard. Monitor revenue, patient flow, and epidemiological trends in real-time.', position: 'bottom' },
      { target: 'clinical-schedule', title: 'Clinical Queue', description: 'Manage your daily appointments. See reason-for-visit at a glance and navigate to patient profiles instantly.', position: 'right' },
      { target: 'case-frequency', title: 'Disease Intelligence', description: 'Visualize top diagnoses in your practice. Automatically tracks clinic quality and disease prevalence.', position: 'left' }
    ],
    profile: [
      { target: 'patient-sovereignty', title: 'Patient Sovereignty', description: 'Complete longitudinal medical record. Track vitals trends, family history, and past clinical encounters.', position: 'bottom' },
      { target: 'clinical-ledger', title: 'Clinical Ledger', description: 'A transparent record of every visit, diagnosis, and prescription ever issued to this patient.', position: 'top' }
    ],
    visit: [
      { target: 'vitals-ribbon', title: 'Sticky Clinical Context', description: 'Active vitals stay pinned here, ensuring you never lose context while entrying prescriptions.', position: 'bottom' },
      { target: 'voice-terminal', title: 'AI Voice Terminal', description: 'Enter clinical notes using natural language. Our AI extracts diagnoses and suggests medications automatically.', position: 'bottom' },
      { target: 'allergy-alert', title: 'High-Alert Safety', description: 'Safety-first alerts pulse in Rose Pink to ensure you NEVER miss a critical medicine allergy during a visit.', position: 'bottom' }
    ],
    cloud: [
      { target: 'sync-hub', title: 'Data Sovereignty Hub', description: 'Manage your private cloud connection. Hostinger KVM-2 ensures your patient data is under your exclusive control.', position: 'bottom' },
      { target: 'registry-pulse', title: 'Registry Pulse', description: 'Monitor live data transfer between your local terminal and your cloud vault.', position: 'bottom' }
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
  useEffect(() => {
    const pathGuideMap: Record<string, string> = {
      '/': 'dashboard',
      '/patient/': 'profile',
      '/new-visit': 'visit',
      '/cloud': 'cloud'
    };

    const path = location.pathname;
    let guideKey = '';
    
    if (path === '/') guideKey = 'dashboard';
    else if (path.startsWith('/patient/')) guideKey = 'profile';
    else if (path === '/new-visit') guideKey = 'visit';
    else if (path === '/cloud') guideKey = 'cloud';

    if (guideKey && !localStorage.getItem(`medcore_guide_${guideKey}`)) {
      setActiveGuide(guideKey);
    }
  }, [location.pathname]);

  if (!currentUser) return <Login onLoginSuccess={(user) => { seedDemoData(); DB.markDataChanged(); setCurrentUser(user); }} />;

  return (
    <ToastProvider>
      <HashRouter>
        <div className="min-h-screen bg-slate-50 flex">
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
                <button onClick={() => { DB.logout(); setCurrentUser(null); setShowLogoutConfirm(false); }} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest">Confirm Sign Out</button>
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
      </HashRouter>
    </ToastProvider>
  );
};
export default App;
