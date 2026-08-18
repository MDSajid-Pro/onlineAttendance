import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import { 
  Users2, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  GraduationCap, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  Mail, 
  BadgeCheck, 
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const EmployeeList = () => {
  const { axios } = useAppContext();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'teacher' | 'admin'

  // Modal State for Edit Employee
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    role: 'teacher',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Employees / Faculty
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/teacher');
      const list = Array.isArray(data) ? data : data.teachers || [];
      setEmployees(list);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load staff directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [axios]);

  // 2. Dynamic Search & Role Filter
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const name = (emp.name || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const empId = (emp.employeeId || '').toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = name.includes(q) || email.includes(q) || empId.includes(q);
      const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [employees, searchQuery, roleFilter]);

  // Open Edit Modal
  const openEditModal = (emp) => {
    setEditingId(emp._id);
    setModalForm({
      name: emp.name || '',
      email: emp.email || '',
      employeeId: emp.employeeId || '',
      role: emp.role || 'teacher',
      password: '' // empty means no password change
    });
    setIsModalOpen(true);
  };

  // Submit Edit Form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: modalForm.name.trim(),
        email: modalForm.email.trim(),
        employeeId: modalForm.employeeId.trim(),
        role: modalForm.role,
        ...(modalForm.password ? { password: modalForm.password } : {})
      };

      const { data } = await axios.put(`/api/teacher/${editingId}`, payload);

      setEmployees(prev => prev.map(emp => emp._id === editingId ? (data.teacher || { ...emp, ...payload }) : emp));
      toast.success(`Profile updated for ${modalForm.name}`);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update employee");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Staff Member
  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from system records?`)) return;

    try {
      await axios.delete(`/api/teacher/${id}`);
      setEmployees(prev => prev.filter(emp => emp._id !== id));
      toast.success(`Employee ${name} removed.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete employee");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Synchronizing Staff Directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Top Banner */}
      <header className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-4xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Users2 size={13} /> Human Resources & Staffing
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Faculty & Employee Directory
          </h1>
          <p className="text-slate-400 text-xs md:text-sm">
            Inspect, manage roles, reset passwords, and remove instructor records.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => navigate('/admin/add')}
            className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <UserPlus size={16} /> Enroll New Staff
          </button>
        </div>
      </header>

      {/* Filter & Search Bar */}
      <section className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-2xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-2xl border border-white/10 text-xs">
            {[
              { id: 'ALL', label: 'All Staff' },
              { id: 'teacher', label: 'Faculty Only' },
              { id: 'admin', label: 'Admins Only' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  roleFilter === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Employees Table */}
        <div className="overflow-x-auto border border-white/10 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 uppercase text-[11px] text-slate-400 tracking-wider border-b border-white/10">
              <tr>
                <th className="py-4 px-5">#</th>
                <th className="py-4 px-5">Staff Member</th>
                <th className="py-4 px-5">Staff ID</th>
                <th className="py-4 px-5">Contact Email</th>
                <th className="py-4 px-5">Role Privileges</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-900/20">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500">
                    <Users2 size={32} className="mx-auto mb-2 opacity-50" />
                    No employees found matching the active search or role criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, idx) => (
                  <tr key={emp._id} className="hover:bg-white/2 transition-colors">
                    <td className="py-4 px-5 text-slate-500 font-mono">{idx + 1}</td>
                    
                    {/* Name + Avatar */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {(emp.name || 'F').charAt(0).toUpperCase()}
                        </div>
                        <p className="font-bold text-white text-xs md:text-sm">{emp.name}</p>
                      </div>
                    </td>

                    {/* Staff ID */}
                    <td className="py-4 px-5 font-mono text-indigo-300 font-semibold">
                      {emp.employeeId || 'N/A'}
                    </td>

                    {/* Email */}
                    <td className="py-4 px-5 text-slate-400 font-mono">
                      {emp.email}
                    </td>

                    {/* Role Pill */}
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        emp.role === 'admin' 
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                          : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      }`}>
                        {emp.role === 'admin' ? 'Administrator' : 'Teacher / Faculty'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-2 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all cursor-pointer"
                        title="Edit Employee"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp._id, emp.name)}
                        className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all cursor-pointer"
                        title="Delete Employee"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </section>

      {/* Modal: Edit Employee Information */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-white/15 rounded-4xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Modify Staff Profile</h3>
                  <p className="text-xs text-slate-400">Update account credentials and system privileges.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={modalForm.name}
                  onChange={e => setModalForm({ ...modalForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Staff Identifier (EMP ID)</label>
                  <input
                    type="text"
                    required
                    value={modalForm.employeeId}
                    onChange={e => setModalForm({ ...modalForm, employeeId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">System Role</label>
                  <select
                    value={modalForm.role}
                    onChange={e => setModalForm({ ...modalForm, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="teacher" className="bg-slate-900">Teacher / Faculty</option>
                    <option value="admin" className="bg-slate-900">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={modalForm.email}
                  onChange={e => setModalForm({ ...modalForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Reset Password (Optional)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Leave blank to keep existing</span>
                </label>
                <input
                  type="password"
                  placeholder="New temporary password..."
                  value={modalForm.password}
                  onChange={e => setModalForm({ ...modalForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? "Updating..." : (
                    <>
                      <span>Save Changes</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeList;