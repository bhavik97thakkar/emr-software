
import React, { useState } from 'react';
import { Stethoscope, Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Globe, Zap } from 'lucide-react';
import { DB } from '../services/db';
import { DEMO_CREDENTIALS } from '../services/demoSeed';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await DB.login(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const useDemoCredentials = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
  };

  return (
    <div className="min-h-screen bg-[#050912] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-[440px] z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
          <div className="bg-slate-900 p-10 text-center relative">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-900/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <Stethoscope size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-white text-2xl font-black mt-6 tracking-tight font-serif-clinical">MedRecord Pro</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Clinic Intelligence System</p>
            
            <div className="absolute top-4 right-4 flex items-center space-x-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Secure Cloud</span>
            </div>
          </div>

          <div className="p-10 space-y-8">
            <div className="text-center">
              <h2 className="text-slate-900 text-lg font-black uppercase tracking-tight">Clinical Access</h2>
              <p className="text-slate-400 text-[11px] font-bold mt-1 uppercase tracking-widest">Provide your authorized credentials</p>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 animate-in shake duration-300">
                <div className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center shrink-0">
                  <Lock size={14} />
                </div>
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-tight leading-snug">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white font-bold text-sm text-slate-900 transition-all placeholder:text-slate-300"
                    placeholder="dr.aarti@medcore.in"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Key</label>
                  <button type="button" className="text-[9px] font-black text-blue-600 hover:underline uppercase tracking-widest">Reset Key?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white font-bold text-sm text-slate-900 transition-all placeholder:text-slate-300"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-16 bg-slate-950 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center space-x-3 group relative overflow-hidden active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span>Unlock Dashboard</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2">
                <button 
                  type="button"
                  onClick={useDemoCredentials}
                  className="w-full h-12 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border border-blue-200 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:from-blue-100 hover:to-indigo-100 transition-all flex items-center justify-center space-x-2 group"
                >
                  <Zap size={14} className="group-hover:scale-110 transition-transform" />
                  <span>Try Demo Mode</span>
                </button>
              </div>
            </form>
          </div>
          
          <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center space-x-2">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>Compliant Encryption Active</span>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center flex flex-col items-center space-y-4">
          <div className="w-full max-w-[440px] bg-blue-50 border border-blue-200 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Zap size={14} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-2">Demo Credentials Available</p>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-[9px] text-blue-800 font-bold">
                    <span className="text-blue-600 font-black">Email:</span>
                    <code className="bg-white px-2 py-1 rounded border border-blue-100 font-mono">{DEMO_CREDENTIALS.email}</code>
                  </div>
                  <div className="flex items-center space-x-2 text-[9px] text-blue-800 font-bold">
                    <span className="text-blue-600 font-black">Password:</span>
                    <code className="bg-white px-2 py-1 rounded border border-blue-100 font-mono">{DEMO_CREDENTIALS.password}</code>
                  </div>
                </div>
                <p className="text-[8px] text-blue-600 mt-2 uppercase tracking-tighter font-bold">Click "Try Demo Mode" button above to auto-fill</p>
              </div>
            </div>
          </div>
          
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Don't have an account? <span className="text-blue-500 cursor-pointer hover:underline">Contact System Admin</span>
          </p>
          <div className="flex items-center space-x-6">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center">
              <Globe size={10} className="mr-1.5" /> Region: MH-Mumbai
            </p>
            <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Version 4.2.0-STABLE</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
