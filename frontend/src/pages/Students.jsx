import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  GraduationCap, 
  Layers, 
  Edit3, 
  Trash2, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Hash, 
  User, 
  SlidersHorizontal,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const COURSES = ['B.Sc', 'B.A', 'B.Com', 'BCA'];
const SEMESTERS = [
  '1st Semester',
  '2nd Semester',
  '3rd Semester',
  '4th Semester',
  '5th Semester',
  '6th Semester'
];

const FORM_COURSES = ['B.Sc', 'B.A', 'B.Com', 'BCA'];
const FORM_SEMESTERS = [
  '1st Semester',
  '2nd Semester',
  '3rd Semester',
  '4th Semester',
  '5th Semester',
  '6th Semester'
];

const Students = () => {
  const { axios } = useAppContext();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');

  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    registerNo: '',
    course: 'B.Sc',
    semester: 'I Semester'
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // 1. Fetch Students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/students/all');
      setStudents(Array.isArray(data.students) ? data.students : Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load student registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [axios]);

  // 2. Dynamic Search & Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const name = (st.fullName || st.name || '').toLowerCase();
      const regNo = (st.registerNo || st.rollNumber || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchSearch = name.includes(q) || regNo.includes(q);

      const matchCourse = selectedCourse === 'ALL' || (st.course || st.courseName) === selectedCourse;
      const matchSemester = selectedSemester === 'ALL' || (st.semester || st.currentSemester) === selectedSemester;

      return matchSearch && matchCourse && matchSemester;
    });
  }, [students, searchQuery, selectedCourse, selectedSemester]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      fullName: '',
      registerNo: '',
      course: selectedCourse === 'ALL' ? 'B.Sc' : selectedCourse,
      semester: selectedSemester === 'ALL' ? 'I Semester' : selectedSemester
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (student) => {
    setEditingId(student._id);
    setFormData({
      fullName: student.fullName || student.name || '',
      registerNo: student.registerNo || student.rollNumber || '',
      course: student.course || student.courseName || 'B.Sc',
      semester: student.semester || student.currentSemester || 'I Semester'
    });
    setIsModalOpen(true);
  };

  // Handle Add / Edit Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.registerNo.trim()) {
      return toast.error("Full Name and Register Number are required");
    }

    setModalSubmitting(true);
    try {
      if (editingId) {
        // UPDATE (PUT)
        const { data } = await axios.put(`/api/students/update/${editingId}`, formData);
        setStudents(prev => prev.map(s => s._id === editingId ? (data.student || { ...s, ...formData }) : s));
        toast.success(`Updated details for ${formData.fullName}!`);
      } else {
        // CREATE (POST)
        const { data } = await axios.post('/api/students/add', formData);
        if (data.student) {
          setStudents(prev => [data.student, ...prev]);
        } else {
          fetchStudents();
        }
        toast.success(`Student ${formData.fullName} enrolled!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save student record");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${name}" from student records?`)) return;

    try {
      await axios.delete(`/api/students/delete/${id}`);
      setStudents(prev => prev.filter(s => s._id !== id));
      toast.success(`Removed ${name} from registry.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete student");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Synchronizing Student Registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 md:p-8 flex justify-center selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="w-full max-w-7xl space-y-6">

        {/* Top Header */}
        <header className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-4xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex items-center gap-4 relative z-10">
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Return to Principal Desk"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Student Directory</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  Registry CRUD
                </span>
              </div>
              <p className="text-slate-400 text-xs md:text-sm mt-0.5">
                Manage, edit, register, and inspect active student profiles across all academic streams.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <UserPlus size={16} /> Enroll New Student
            </button>
          </div>
        </header>

        {/* Stream & Semester Filter Panel */}
        <section className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-4xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-indigo-400" /> Directory Query Filters
            </h2>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl">
              Showing {filteredStudents.length} of {students.length} Students
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GraduationCap size={14} className="text-indigo-400" /> Degree / Stream
              </label>
              <div className="flex flex-wrap gap-2">
                {COURSES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCourse(c)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedCourse === c
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white hover:border-white/15'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Semester Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-400" /> Academic Semester
              </label>
              <div className="flex flex-wrap gap-2">
                {SEMESTERS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSemester(s)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedSemester === s
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white hover:border-white/15'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Students Table Section */}
        <section className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-4xl p-6 md:p-8 space-y-6 shadow-2xl">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search student name or register no..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-2xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="text-xs text-slate-400">
              Active Filters: <span className="text-white font-semibold">{selectedCourse}</span> • <span className="text-white font-semibold">{selectedSemester}</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-white/10 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 uppercase text-[11px] text-slate-400 tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-4 px-5">#</th>
                  <th className="py-4 px-5">Student Name</th>
                  <th className="py-4 px-5">Register / Roll No</th>
                  <th className="py-4 px-5">Course Stream</th>
                  <th className="py-4 px-5">Semester Term</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/20">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      <Users size={32} className="mx-auto mb-2 opacity-50" />
                      No students found matching the selected filters or search terms.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => (
                    <tr key={st._id} className="hover:bg-white/2 transition-colors">
                      <td className="py-4 px-5 text-slate-500 font-mono">{idx + 1}</td>
                      
                      {/* Name & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                            {(st.fullName || st.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs md:text-sm">{st.fullName || st.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Register Number */}
                      <td className="py-4 px-5 font-mono text-indigo-300 font-semibold">
                        {st.registerNo || st.rollNumber || 'N/A'}
                      </td>

                      {/* Course */}
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                          {st.course || st.courseName || 'Unassigned'}
                        </span>
                      </td>

                      {/* Semester */}
                      <td className="py-4 px-5 text-slate-400">
                        {st.semester || st.currentSemester || 'Unassigned'}
                      </td>

                      {/* Actions (Edit / Delete) */}
                      <td className="py-4 px-5 text-right space-x-1.5">
                        <button
                          onClick={() => openEditModal(st)}
                          className="p-2 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all cursor-pointer"
                          title="Edit Student Record"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st._id, st.fullName || st.name)}
                          className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all cursor-pointer"
                          title="Delete Student Record"
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

        {/* Modal: Create & Edit Student CRUD */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-white/15 rounded-4xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
              
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editingId ? "Update Student Profile" : "Enroll New Student"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {editingId ? "Modify registration and academic term records." : "Add a new student to the official directory."}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User size={14} className="text-indigo-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohammed Sajid"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Register Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Hash size={14} className="text-indigo-400" /> Register / Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. U15CS24S001"
                    value={formData.registerNo}
                    onChange={e => setFormData({ ...formData, registerNo: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Course Stream */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-indigo-400" /> Degree Program
                  </label>
                  <select
                    value={formData.course}
                    onChange={e => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm focus:border-indigo-500 focus:outline-none cursor-pointer transition-all"
                  >
                    {FORM_COURSES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>

                {/* Academic Semester */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-400" /> Academic Semester
                  </label>
                  <select
                    value={formData.semester}
                    onChange={e => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm focus:border-indigo-500 focus:outline-none cursor-pointer transition-all"
                  >
                    {FORM_SEMESTERS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>

                {/* Action Buttons */}
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
                    disabled={modalSubmitting}
                    className="px-6 py-3 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {modalSubmitting ? "Processing..." : (
                      <>
                        <span>{editingId ? "Save Changes" : "Register Student"}</span>
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

export default Students;