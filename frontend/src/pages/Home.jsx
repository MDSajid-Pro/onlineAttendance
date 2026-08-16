import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { toast } from "react-hot-toast";

const Home = () => {
  const { axios, setToken, setUser } = useAppContext();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
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

        toast.success(`Welcome back, ${user?.name || (role === 'admin' ? 'Admin' : 'Teacher')}!`);

        if ((user?.role || role) === "teacher") {
          navigate("/teacher");
        } else {
          navigate("/admin");
        }
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserRaw = localStorage.getItem("user");
    const storedRole = localStorage.getItem("role");

    if (storedToken) {
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
  }, [setToken, axios, navigate]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-900">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/30 blur-[120px] animate-pulse"></div>

      <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col lg:flex-row items-center gap-12">
        <div className="lg:w-1/2 text-center lg:text-left space-y-6">
          <div className="inline-block px-4 py-1.5 mb-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
            Academic Management & Attendance Portal
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
            Success Degree <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">College</span>
          </h1>
          <p className="text-slate-400 text-lg lg:text-xl max-w-lg leading-relaxed">
            Real-time classroom attendance tracking and faculty course management.
          </p>
        </div>

        <div className="lg:w-1/2 w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/10 p-8 lg:p-10 rounded-[2.5rem] border border-white/20 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white">Portal Sign In</h2>
              <p className="text-slate-400 mt-1 text-sm">Select your account type to proceed</p>
            </div>

            <div className="flex bg-slate-950/40 p-1.5 rounded-2xl mb-6 border border-white/10">
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  role === "teacher"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  role === "admin"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Admin
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">
                  {role === "teacher" ? "Teacher Email" : "Admin Email"}
                </label>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === "teacher" ? "teacher@success.edu" : "admin@success.edu"} 
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 outline-none transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 outline-none transition-all" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Authenticating..." : `Sign In as ${role === 'admin' ? 'Admin' : 'Teacher'}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;