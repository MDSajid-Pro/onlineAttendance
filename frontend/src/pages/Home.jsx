
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useState, useEffect } from 'react';
import { toast } from "react-hot-toast";

const Home = () => {

  const { axios, setToken } = useAppContext();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post("/api/teacher/login", {
        email,
        password,
      });

      if (data.success) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = data.token;
        toast.success("Welcome back, Admin!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Login failed");
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common["Authorization"] = storedToken;
    }
  }, [setToken, axios]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-900">
      
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/30 blur-[120px] animate-pulse"></div>

      <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col lg:flex-row items-center gap-12">
        
        {/* Left Side: Branding Text */}
        <div className="lg:w-1/2 text-center lg:text-left space-y-6">
          <div className="inline-block px-4 py-1.5 mb-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
            Official Faculty Portal
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
            Success Degree <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-violet-400">College</span>
          </h1>
          <p className="text-slate-400 text-lg lg:text-xl max-w-lg leading-relaxed">
            Manage your classroom with precision. Empowering educators with real-time attendance and student analytics.
          </p>
        </div>

        {/* Right Side: Glassmorphism Login Card */}
        <div className="lg:w-1/2 w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/10 p-8 lg:p-10 rounded-[2.5rem] border border-white/20 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white">Teacher Login</h2>
              <p className="text-slate-400 mt-2">Enter your credentials to access the dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Work Email</label>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@success.edu" 
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

              <div className="flex items-center justify-between text-sm px-1">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input type="checkbox" className="rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-0" />
                  Remember me
                </label>
                <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">Forgot Password?</a>
              </div>

              <button type='submit' className="w-full mt-4 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.98]">
                Access Dashboard
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;