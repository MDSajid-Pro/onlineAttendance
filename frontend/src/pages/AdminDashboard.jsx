import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Search, 
  UserPlus, 
  Trash2, 
  Layers, 
  UserCheck, 
  X, 
  LogOut,
  TrendingUp,
  User,
  Hash,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const COURSES = ['B.Sc', 'B.A', 'B.Com', 'BCA'];
const SEMESTERS = ['1st Semester',
  '2nd Semester',
  '3rd Semester',
  '4th Semester',
  '5th Semester',
  '6th Semester'
];

const AdminDashboard = () => {
  const { axios, setToken, setUser } = useAppContext();
  const navigate = useNavigate();

  const [allocations, setAllocations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Student Enrollment Modal State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    registerNo: '',
    course: 'B.Sc',
    semester: 'I Semester'
  });
  const [submittingStudent, setSubmittingStudent] = useState(false);

  // 1. Initial Load: Concurrent Fetch
  const fetchData = async () => {
    try {
      setLoading(true);
      const [allocRes, teachersRes, studentsRes] = await Promise.all([
        axios.get('/api/teacher/all-allocations'),
        axios.get('/api/teacher'),
        axios.get('/api/students/all')
      ]);

      setAllocations(Array.isArray(allocRes.data) ? allocRes.data : []);
      setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data?.teachers || []);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data?.students || []);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [axios]);

  // Filtered Allocations based on search query
  const filteredAllocations = useMemo(() => {
    return allocations.filter(a => {
      const teacherName = (a.teacher?.name || '').toLowerCase();
      const subject = (a.subject || '').toLowerCase();
      const course = (a.courseName || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      return teacherName.includes(q) || subject.includes(q) || course.includes(q);
    });
  }, [allocations, searchQuery]);

  // Handle Student Enrollment Submission
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentForm.fullName.trim() || !studentForm.registerNo.trim()) {
      return toast.error("Please provide both name and register number");
    }

    setSubmittingStudent(true);
    try {
      const payload = {
        fullName: studentForm.fullName.trim(),
        registerNo: studentForm.registerNo.trim().toUpperCase(),
        course: studentForm.course,
        semester: studentForm.semester
      };

      const { data } = await axios.post('/api/students/add', payload);

      if (data.success || data.student) {
        toast.success(`Student ${payload.fullName} registered!`);
        setStudentForm({
          fullName: '',
          registerNo: '',
          course: 'B.Sc',
          semester: 'I Semester'
        });
        setIsStudentModalOpen(false);
        fetchData(); // Refresh students counter and table
      } else {
        toast.error(data.message || "Failed to add student");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding student record");
    } finally {
      setSubmittingStudent(false);
    }
  };

  // Delete Allocation Link
  const handleDeleteAllocation = async (id, subject) => {
    if (!window.confirm(`Are you sure you want to delete the allocation for "${subject}"?`)) return;

    try {
      await axios.delete(`/api/teacher/allocation/${id}`);
      setAllocations(prev => prev.filter(a => a._id !== id));
      toast.success("Allocation removed!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete allocation");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    if (setUser) setUser(null);
    delete axios.defaults.headers.common["Authorization"];
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading Academic Registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 md:p-8 flex justify-center selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="w-full max-w-7xl space-y-8">

        {/* Top Glass Navbar */}
        <header className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/20">
              <LayoutDashboard size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Administrator Console</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  Principal Desk
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-0.5">Live Student Enrollment & Faculty Allocation Matrix</p>
            </div>
          </div>
        </header>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
              <GraduationCap size={18} className="text-blue-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{students.length}</p>
            <span className="text-[11px] text-blue-400 font-medium">Registered in College</span>
          </div>

          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Faculty Staff</span>
              <UserCheck size={18} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{teachers.length}</p>
            <span className="text-[11px] text-emerald-400 font-medium">Active Instructors</span>
          </div>

          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Allocated Batches</span>
              <Layers size={18} className="text-indigo-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{allocations.length}</p>
            <span className="text-[11px] text-indigo-400 font-medium">Subject Links</span>
          </div>

          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Coverage Rate</span>
              <TrendingUp size={18} className="text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">
              {allocations.length > 0 ? Math.round((allocations.reduce((acc, a) => acc + (a.students?.length || 0), 0) / (students.length || 1)) * 100) : 0}%
            </p>
            <span className="text-[11px] text-amber-400 font-medium">Roster Utilization</span>
          </div>
        </div>

        {/* Allocations Management Table */}
        <section className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Faculty Allocation Registry</h2>
              <p className="text-slate-400 text-xs mt-0.5">Assigned subject sessions and enrolled student rosters.</p>
            </div>

            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search teacher, subject, or course..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-white/10 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 uppercase text-[11px] text-slate-400 tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-4 px-5">Teacher / Faculty</th>
                  <th className="py-4 px-5">Subject Paper</th>
                  <th className="py-4 px-5">Course & Term</th>
                  <th className="py-4 px-5">Assigned Students</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/20">
                {filteredAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      No allocation records found matching the query.
                    </td>
                  </tr>
                ) : (
                  filteredAllocations.map(a => (
                    <tr key={a._id} className="hover:bg-white/2 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center">
                            {(a.teacher?.name || 'T').charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white">{a.teacher?.name || 'Unknown Teacher'}</p>
                            <p className="text-[11px] font-mono text-slate-400">{a.teacher?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-semibold text-indigo-300">
                        {a.subject}
                      </td>

                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 mr-2">
                          {a.courseName}
                        </span>
                        <span className="text-slate-400">{a.semester}</span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 font-bold">
                          <Users size={13} /> {a.students?.length || 0} Students
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleDeleteAllocation(a._id, a.subject)}
                          className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all cursor-pointer"
                          title="Delete Allocation"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal: Add New Student Record */}
        {isStudentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/15 rounded-4xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
              
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Enroll New Student</h3>
                    <p className="text-xs text-slate-400">Add an academic record to the student database.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsStudentModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleStudentSubmit} className="space-y-4">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User size={14} className="text-emerald-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohammed Sajid"
                    value={studentForm.fullName}
                    onChange={e => setStudentForm({ ...studentForm, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Register Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Hash size={14} className="text-emerald-400" /> Register / Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. U15CS24S001"
                    value={studentForm.registerNo}
                    onChange={e => setStudentForm({ ...studentForm, registerNo: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Course Stream */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-emerald-400" /> Degree Program
                  </label>
                  <select
                    value={studentForm.course}
                    onChange={e => setStudentForm({ ...studentForm, course: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm focus:border-emerald-500 focus:outline-none cursor-pointer transition-all"
                  >
                    {COURSES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>

                {/* Academic Semester */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers size={14} className="text-emerald-400" /> Academic Semester
                  </label>
                  <select
                    value={studentForm.semester}
                    onChange={e => setStudentForm({ ...studentForm, semester: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm focus:border-emerald-500 focus:outline-none cursor-pointer transition-all"
                  >
                    {SEMESTERS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>

                {/* Submit Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsStudentModalOpen(false)}
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStudent}
                    className="px-6 py-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingStudent ? "Registering..." : (
                      <>
                        <span>Add Student</span>
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
    </div>
  );
};

export default AdminDashboard;