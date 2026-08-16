import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { 
  UserPlus, 
  User, 
  Mail, 
  Lock, 
  BadgeCheck, 
  ShieldCheck, 
  GraduationCap, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Shuffle,
  Briefcase,
  KeyRound,
  Check
} from 'lucide-react';

const DOMAINS = ['@success.edu', '@faculty.edu', '@college.ac.in'];

const AddEmployee = () => {
  const { axios } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    role: 'teacher'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uiMessage, setUiMessage] = useState({ type: '', text: '' });

  // 1. Dynamic Password Strength Analyzer
  const passwordStrength = useMemo(() => {
    const pwd = formData.password;
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-slate-700' };
    
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500', text: 'text-blue-400' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  }, [formData.password]);

  // 2. Smart Employee ID Auto-Generator
  const generateEmployeeId = () => {
    const prefix = formData.role === 'admin' ? 'ADM' : 'FAC';
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generated = `${prefix}-${year}-${random}`;
    setFormData(prev => ({ ...prev, employeeId: generated }));
  };

  // 3. One-Click Domain Appender
  const handleAppendDomain = (domain) => {
    const base = formData.email.split('@')[0] || 'faculty';
    setFormData(prev => ({ ...prev, email: `${base}${domain}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUiMessage({ type: '', text: '' });

    try {
      const response = await axios.post('/api/auth/register-employee', formData);

      if (response.status === 201 || response.status === 200 || response.data?.success) {
        setUiMessage({ 
          type: 'success', 
          text: `Faculty profile for "${formData.name}" activated successfully!` 
        });
        setFormData({ 
          name: '', 
          email: '', 
          password: '', 
          employeeId: '', 
          role: 'teacher'
        });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to authenticate credential payload with server.';
      setUiMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 md:p-8 flex justify-center items-center">
      <div className="w-full max-w-6xl space-y-6">
        
        {/* Floating Top Banner */}
        <header className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24"></div>

          <div className="space-y-1 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles size={13} className="animate-pulse" /> Faculty Provisioning Console
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Register Faculty Member
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Create academic accounts, generate digital identification credentials, and configure system permissions.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Auth Gateway: <span className="text-emerald-400 font-bold">Online</span>
            </div>
          </div>
        </header>

        {/* Feedback Alert Pill */}
        {uiMessage.text && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border transition-all ${
            uiMessage.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
          }`}>
            {uiMessage.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-400 shrink-0" />
            )}
            <span>{uiMessage.text}</span>
          </div>
        )}

        {/* Form + ID Card Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Form Fields */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-2xl">
            
            {/* Account Role Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Briefcase size={14} className="text-indigo-400" /> Account Authorization Level
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'teacher' })}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    formData.role === 'teacher'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <GraduationCap size={16} /> Faculty / Instructor
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    formData.role === 'admin'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShieldCheck size={16} /> Campus Administrator
                </button>
              </div>
            </div>

            {/* Full Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User size={14} className="text-indigo-400" /> Full Name & Title
              </label>
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Prof. Johnathan Doe"
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            {/* Employee ID with Auto-Gen Button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BadgeCheck size={14} className="text-indigo-400" /> Staff Identifier (EMP ID)
                </label>
                <button
                  type="button"
                  onClick={generateEmployeeId}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Shuffle size={12} /> Auto-Generate
                </button>
              </div>
              <input 
                type="text" 
                required 
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="FAC-2026-X8B9"
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none transition-all font-mono tracking-wider"
              />
            </div>

            {/* Work Email with Quick Domain Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Mail size={14} className="text-indigo-400" /> Official Faculty Email
              </label>
              <input 
                type="email" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="j.doe@success.edu"
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none transition-all"
              />
              {/* Domain Shortcut Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {DOMAINS.map(dom => (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => handleAppendDomain(dom)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-slate-400 hover:text-indigo-300 transition-all cursor-pointer"
                  >
                    + {dom}
                  </button>
                ))}
              </div>
            </div>

            {/* Password with Strength Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-indigo-400" /> Temporary Login Key
                </label>
                {formData.password && (
                  <span className={`text-[11px] font-bold ${passwordStrength.text}`}>
                    Strength: {passwordStrength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full pl-4 pr-12 py-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Dynamic Strength Progress Bars */}
              {formData.password && (
                <div className="grid grid-cols-4 gap-1.5 pt-1.5">
                  {[1, 2, 3, 4].map(step => (
                    <div 
                      key={step} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= step ? passwordStrength.color : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold tracking-wide shadow-xl shadow-indigo-500/25 transition-all transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-base"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enroll Faculty Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Holographic ID Badge Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/40 border border-white/15 rounded-[2rem] p-7 shadow-2xl relative overflow-hidden space-y-6">
              
              {/* Top Card Badge Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase">
                    Digital Campus Pass
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 uppercase tracking-wider">
                  {formData.role}
                </span>
              </div>

              {/* User Avatar + Name Identity */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-extrabold text-2xl text-white shadow-xl shadow-indigo-500/30 border border-white/20">
                  {(formData.name || 'F').charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-white text-lg leading-tight">
                    {formData.name || 'Faculty Member Name'}
                  </h3>
                  <p className="font-mono text-xs text-indigo-300">
                    ID: {formData.employeeId || 'FAC-XXXX-XXXX'}
                  </p>
                </div>
              </div>

              {/* Card Meta Readout */}
              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400">Portal Username</span>
                  <span className="font-mono text-white truncate max-w-[180px]">
                    {formData.email || 'user@college.edu'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400">Issued On</span>
                  <span className="font-mono text-slate-300">
                    {new Date().toISOString().split('T')[0]}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400">Access Tier</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <Check size={13} /> Full Privileges
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                <span>Success Degree College</span>
                <span>SEC-256</span>
              </div>
            </div>

            {/* Quick Helper Badge */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 space-y-1">
              <p className="font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-400" /> Immediate Activation
              </p>
              <p>
                Once registered, instructors can immediately log into the terminal, review assigned student rosters, and record roll calls.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AddEmployee;