import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Loader2,
  LogOut
} from 'lucide-react';

const Home = () => {
  const { axios, setToken, setUser } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("teacher");
  const [loading, setLoading] = useState(false);

  // Custom Floating Toast State
  const [toastNotification, setToastNotification] = useState({
    visible: false,
    type: 'success', // 'success' | 'error' | 'logout'
    title: '',
    message: ''
  });

  const showCustomToast = useCallback((type, title, message) => {
    setToastNotification({
      visible: true,
      type,
      title,
      message
    });

    const timer = setTimeout(() => {
      setToastNotification(prev => ({ ...prev, visible: false }));
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  // Detect Logout Redirect
  useEffect(() => {
    if (location.state?.loggedOut || location.state?.logoutMessage) {
      showCustomToast(
        'logout', 
        'Session Closed', 
        location.state.logoutMessage || 'You have been successfully logged out.'
      );
      window.history.replaceState({}, document.title);
      return;
    }

    const logoutFlag = sessionStorage.getItem('just_logged_out');
    if (logoutFlag) {
      showCustomToast('logout', 'Session Closed', 'Logged out successfully from portal.');
      sessionStorage.removeItem('just_logged_out');
    }
  }, [location, showCustomToast]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showCustomToast('error', 'Authentication Failed', 'Please provide both email and password.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = role === "admin" ? "/api/admin/login" : "/api/auth/login";
      const { data } = await axios.post(endpoint, { email, password, role });

      if (data.success || data.token) {
        const token = data.token;
        const user = data.user || data.teacher || data.admin || null;

        setToken(token);
        if (setUser && user) setUser(user);
        
        localStorage.setItem("token", token);
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        } else {
          localStorage.removeItem("user");
        }
        localStorage.setItem("role", user?.role || role);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Set Session Storage fallback marker for immediate greeting
        sessionStorage.setItem("faculty_just_logged_in", "true");

        if ((user?.role || role) === "teacher") {
          navigate("/teacher", { state: { justLoggedIn: true } });
        } else {
          navigate("/admin", { state: { justLoggedIn: true } });
        }
      } else {
        showCustomToast('error', 'Sign In Rejected', data.message || "Invalid credentials provided.");
      }
    } catch (error) {
      showCustomToast(
        'error', 
        'Sign In Error', 
        error.response?.data?.message || error.message || "Unable to reach authentication server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserRaw = localStorage.getItem("user");
    const storedRole = localStorage.getItem("role");

    if (storedToken && !location.state?.loggedOut) {
      setToken(storedToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      
      let parsedUser = null;
      if (storedUserRaw && storedUserRaw !== "undefined" && storedUserRaw !== "null") {
        try {
          parsedUser = JSON.parse(storedUserRaw);
        } catch {
          localStorage.removeItem("user");
        }
      }

      const activeRole = parsedUser?.role || storedRole;
      if (activeRole === "teacher") {
        navigate("/teacher");
      } else if (activeRole === "admin") {
        navigate("/admin");
      }
    }
  }, [setToken, axios, navigate, location]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#06080e] text-slate-100 p-4 md:p-8 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Ambient Lighting Background Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-125 h-125 rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-125 h-125 rounded-full bg-violet-600/15 blur-[140px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-87.5 h-87.5 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none"></div>

      {/* Floating Glass Custom Notification Toast */}
      {toastNotification.visible && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full animate-fadeIn transition-all">
          <div className={`p-4 rounded-2xl backdrop-blur-2xl border shadow-2xl flex items-start gap-3.5 ${
            toastNotification.type === 'success' 
              ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10' 
              : 'bg-slate-900/95 border-rose-500/40 text-rose-300 shadow-rose-500/10'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              toastNotification.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {toastNotification.type === 'success' ? <CheckCircle2 size={20} /> : toastNotification.type === 'logout' ? <LogOut size={18} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-white leading-tight">{toastNotification.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastNotification.message}</p>
            </div>
            <button 
              onClick={() => setToastNotification(prev => ({ ...prev, visible: false }))}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
        
        {/* Left Hero Showcase */}
        <div className="lg:w-1/2 text-center lg:text-left space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-indigo-400" />
            Institutional Academic Terminal
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Success Degree <br />
              <span className="bg-linear-to-br from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
                College Portal
              </span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base lg:text-lg max-w-lg leading-relaxed">
              Real-time roll-call logging, automated registers, and faculty course management matrix.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 max-w-md mx-auto lg:mx-0">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase">
                <GraduationCap size={15} /> Stream Matrix
              </div>
              <p className="text-slate-400 text-xs mt-1">B.Sc, B.A, B.Com & BCA</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase">
                <ShieldCheck size={15} /> Automated Sync
              </div>
              <p className="text-slate-400 text-xs mt-1">Real-Time Registry</p>
            </div>
          </div>

        </div>

        {/* Right Glass Authentication Card */}
        <div className="lg:w-1/2 w-full max-w-md">
          <div className="backdrop-blur-2xl bg-slate-900/60 p-8 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl shadow-black/50 relative overflow-hidden">
            
            {/* Header */}
            <div className="mb-6 space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">Access Terminal</h2>
              <p className="text-slate-400 text-xs">Authorize with registered institution credentials.</p>
            </div>

            {/* Role Switcher Pill Bar */}
            <div className="flex bg-slate-950/80 p-1.5 rounded-2xl mb-6 border border-white/10 relative">
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  role === "teacher"
                    ? "bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <GraduationCap size={15} />
                <span>Faculty</span>
              </button>
              
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  role === "admin"
                    ? "bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ShieldCheck size={15} />
                <span>Principal / Admin</span>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Mail size={13} className="text-indigo-400" />
                  <span>{role === "teacher" ? "Faculty Email" : "Administrator Email"}</span>
                </label>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === "teacher" ? "lecturer@sdc.edu.in" : "admin@sdc.edu.in"} 
                  className="w-full px-4 py-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>

              {/* Password with Show / Hide Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Lock size={13} className="text-indigo-400" />
                  <span>Security Password</span>
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••" 
                    className="w-full pl-4 pr-12 py-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-2 py-4 bg-linear-to-br from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/25 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying Access...</span>
                  </>
                ) : (
                  <>
                    <span>Enter {role === 'admin' ? 'Principal Desk' : 'Faculty Console'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

            </form>

            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              <p className="text-[11px] text-slate-500 font-medium">
                Success Degree College &bull; Faculty Attendance Portal
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;