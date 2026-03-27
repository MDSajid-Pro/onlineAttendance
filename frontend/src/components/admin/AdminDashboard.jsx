import React from 'react';
import { LayoutDashboard, Users, BookOpen, Bell, Settings, Search, ArrowUpRight } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-indigo-600">Success College</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Overview" active />
          <NavItem icon={<Users size={20}/>} label="Teachers" />
          <NavItem icon={<BookOpen size={20}/>} label="Departments" />
          <NavItem icon={<Bell size={20}/>} label="Alerts" />
        </nav>
        <div className="p-4 border-t">
          <NavItem icon={<Settings size={20}/>} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search student, teacher or roll no..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">P</div>
            <span className="font-medium text-slate-700">Principal Desk</span>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Students" value="1,240" change="+12" iconColor="text-blue-600" bgColor="bg-blue-50" />
            <StatCard title="Avg. Attendance" value="88.2%" change="-2.4%" color="text-rose-600" iconColor="text-emerald-600" bgColor="bg-emerald-50" />
            <StatCard title="Staff Active" value="42/45" change="0" iconColor="text-amber-600" bgColor="bg-amber-50" />
            <StatCard title="Low Attendance" value="18" change="+3" color="text-rose-600" iconColor="text-rose-600" bgColor="bg-rose-50" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Department Performance</h2>
            <div className="h-64 flex items-end justify-around gap-4 pt-10">
              {/* Simple Bar visualization using Tailwind */}
              <ProgressBar label="BCA" value="92%" height="h-[92%]" color="bg-indigo-500" />
              <ProgressBar label="B.Sc" value="85%" height="h-[85%]" color="bg-emerald-500" />
              <ProgressBar label="B.Com" value="78%" height="h-[78%]" color="bg-amber-500" />
              <ProgressBar label="B.A" value="70%" height="h-[70%]" color="bg-rose-500" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper Components
const NavItem = ({ icon, label, active = false }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>
    {icon} <span>{label}</span>
  </div>
);

const StatCard = ({ title, value, change, iconColor, bgColor }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <div className="flex items-end justify-between mt-2">
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      <span className={`text-xs font-bold px-2 py-1 rounded-md ${bgColor} ${iconColor}`}>
        {change}
      </span>
    </div>
  </div>
);

const ProgressBar = ({ label, value, height, color }) => (
  <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
    <span className="text-xs font-bold text-slate-600">{value}</span>
    <div className={`w-full max-w-15 ${height} ${color} rounded-t-lg transition-all duration-500 hover:opacity-80`}></div>
    <span className="text-sm font-medium text-slate-500">{label}</span>
  </div>
);

export default AdminDashboard;