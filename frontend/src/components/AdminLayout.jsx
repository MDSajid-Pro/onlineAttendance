import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, BookOpen, CheckCircle, Menu, X, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
    // 1. Clear your auth data (adjust based on your AppContext/LocalStorage)
    localStorage.removeItem('token'); 
    
    // 2. Redirect to login page
    navigate('/'); 
    
    // 3. Close mobile menu if open
    setIsMobileMenuOpen(false);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col md:flex-row">
      
      {/* --- MOBILE HEADER --- */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-white/5 backdrop-blur-lg sticky top-0 z-50">
        <h1 className="text-lg font-bold bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          SDC PORTAL
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#0f172a] border-r border-white/5 p-6 transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:flex md:flex-col md:h-screen md:sticky md:top-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="hidden md:block mb-10 px-2">
          <h1 className="text-xl font-bold bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            SDC PORTAL
          </h1>
        </div>
        
        <nav className="space-y-2 flex-1 md:pt-12">
          <NavItem to="/admin" icon={<LayoutGrid size={20}/>} label="Overview" active={location.pathname === '/admin'} onClick={closeMenu} />
          <NavItem to="/admin/add" icon={<Users size={20}/>} label="Add Employee" active={location.pathname === '/admin/add'} onClick={closeMenu} />
          <NavItem to="/admin/students" icon={<CheckCircle size={20} />} label="Student List" active={location.pathname === '/admin/students'} onClick={closeMenu} />
          <NavItem to="/admin/assign" icon={<CheckCircle size={20}/>} label="Student Allocation" active={location.pathname === '/admin/assign'} onClick={closeMenu} />
        </nav>

        {/* --- BOTTOM SECTION (Profile & Logout) --- */}
        <div className="mt-auto space-y-4">
          <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
            <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider">Admin Mode</p>
            <p className="text-sm text-white font-semibold">Admin</p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={closeMenu} />
      )}
          
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, to, active, onClick }) => (
  <Link to={to} onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
    {icon} <span className="font-medium">{label}</span>
  </Link>
);

export default AdminLayout;