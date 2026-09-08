import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  LayoutGrid, 
  UserPlus, 
  Users2, 
  GraduationCap, 
  UserCheck, 
  Menu, 
  X, 
  LogOut, 
  ShieldCheck,
  CalendarDays // Added for holiday management
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken, setUser, axios } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const storedUserRaw = localStorage.getItem("user");
  const storedUser = storedUserRaw && storedUserRaw !== "undefined" ? JSON.parse(storedUserRaw) : null;

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    if (setUser) setUser(null);
    delete axios.defaults.headers.common["Authorization"];
    toast.success("Logged out successfully");
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 flex flex-col md:flex-row selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Mobile Top Navbar */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-indigo-500/25">
            SDC
          </div>
          <h1 className="text-base font-extrabold bg-linear-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent tracking-wide">
            SDC PORTAL
          </h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="p-2 text-slate-300 hover:text-white rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Slide-Out Drawer (Mobile) & Fixed Sidebar (Desktop) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#090d16] border-r border-white/10 p-5 flex flex-col h-screen transition-transform duration-300 ease-in-out
        md:translate-x-0 md:sticky md:top-0 md:z-20
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl shadow-black' : '-translate-x-full'}
      `}>
        
        {/* Drawer Header with Title & Close Icon on Mobile */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-500/30 border border-white/20">
              SDC
            </div>
            <div>
              <h1 className="text-base font-black bg-linear-to-r from-indigo-400 to-violet-200 bg-clip-text text-transparent tracking-wide leading-tight">
                SDC PORTAL
              </h1>
              <p className="text-[10px] uppercase font-mono tracking-widest text-indigo-400/80">
                Admin Console
              </p>
            </div>
          </div>

          <button 
            onClick={closeMenu}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close Menu"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Primary Navigation Links */}
        <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Core Registry</p>
          
          <NavItem 
            to="/admin" 
            icon={<LayoutGrid size={18} />} 
            label="Overview Dashboard" 
            active={location.pathname === '/admin'} 
            onClick={closeMenu} 
          />
          
          <NavItem 
            to="/admin/employees" 
            icon={<Users2 size={18} />} 
            label="Employee Directory" 
            active={location.pathname === '/admin/employees'} 
            onClick={closeMenu} 
          />

          <NavItem 
            to="/admin/add" 
            icon={<UserPlus size={18} />} 
            label="Add Faculty / Staff" 
            active={location.pathname === '/admin/add'} 
            onClick={closeMenu} 
          />

          <div className="pt-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Student & Classes</p>
            
            <NavItem 
              to="/admin/students" 
              icon={<GraduationCap size={18} />} 
              label="Student Directory" 
              active={location.pathname === '/admin/students'} 
              onClick={closeMenu} 
            />

            <NavItem 
              to="/admin/assign" 
              icon={<UserCheck size={18} />} 
              label="Course Allocation" 
              active={location.pathname === '/admin/assign'} 
              onClick={closeMenu} 
            />
          </div>

          {/* Schedule & Holidays Navigation */}
          <div className="pt-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Schedule & Planning</p>
            
            <NavItem 
              to="/admin/holidays" 
              icon={<CalendarDays size={18} />} 
              label="Manage Holidays" 
              active={location.pathname.startsWith('/admin/holidays')} 
              onClick={closeMenu} 
            />
          </div>
        </nav>

        {/* Bottom Profile Badge & Logout */}
        <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                {(storedUser?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="truncate max-w-32.5">
                <p className="text-xs font-bold text-white truncate">{storedUser?.name || 'Administrator'}</p>
                <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1">
                  <ShieldCheck size={10} /> Principal Desk
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer hover:shadow-lg hover:shadow-rose-500/10"
          >
            <LogOut size={14} /> Exit System
          </button>
        </div>

      </aside>

      {/* Dark Dim Backdrop for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" 
          onClick={closeMenu} 
        />
      )}
          
      {/* Dynamic Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

const NavItem = ({ icon, label, to, active, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick} 
    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-150 text-xs font-bold cursor-pointer ${
      active 
        ? 'bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30' 
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
    }`}
  >
    {icon} 
    <span>{label}</span>
  </Link>
);

export default AdminLayout;