import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ArrowRight,
  UserX,
  MessageSquare,
  Send,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  Phone
} from 'lucide-react';

const COURSES = ['B.Sc', 'B.A', 'B.Com', 'BCA'];
const SEMESTERS = [
  '1st Semester',
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

  // Daily Absentees State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenteesList, setAbsenteesList] = useState([]);
  const [loadingAbsentees, setLoadingAbsentees] = useState(false);
  const [isAbsenteesModalOpen, setIsAbsenteesModalOpen] = useState(false);
  const [absenteeSearch, setAbsenteeSearch] = useState('');
  
  // Student Enrollment Modal State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    registerNo: '',
    course: 'B.Sc',
    semester: '1st Semester',
    parentPhone: ''
  });
  const [submittingStudent, setSubmittingStudent] = useState(false);

  // Custom Toast Notification State
  const [customToast, setCustomToast] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showCustomToast = useCallback((type, title, message) => {
    setCustomToast({ visible: true, type, title, message });
    const timer = setTimeout(() => {
      setCustomToast(prev => ({ ...prev, visible: false }));
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

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
      showCustomToast('error', 'Sync Failure', 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [axios]);

  // 2. Fetch Daily Absentees with Strict Student-First Metadata Resolution
  const fetchAbsenteesByDate = async (date) => {
    try {
      setLoadingAbsentees(true);
      const { data } = await axios.get('/api/attendance/history', {
        params: { date }
      });

      const logs = Array.isArray(data.attendances) ? data.attendances : Array.isArray(data) ? data : [];
      const extractedAbsentees = [];

      // Create a fast lookup map from the active student state
      const studentMap = {};
      students.forEach(st => {
        if (st._id) studentMap[String(st._id)] = st;
      });

      logs.forEach(log => {
        const subject = log.subject || log.assignment?.subject || 'Class Subject';

        log.records?.forEach(rec => {
          if (rec.status === 'Absent') {
            const rawStudent = rec.student || {};
            const studentId = typeof rawStudent === 'object' ? rawStudent._id : rawStudent;
            
            // Resolve from populated object or fall back to main directory lookup
            const matchedStudent = (typeof rawStudent === 'object' && rawStudent.fullName) 
              ? rawStudent 
              : (studentMap[String(studentId)] || {});

            // Strict Priority: Student Schema > Assignment/Log Schema > Fallback
            const resolvedCourse = matchedStudent.course || log.courseName || log.course || 'B.Sc';
            const resolvedSemester = matchedStudent.semester || log.semester || '1st Semester';
            const resolvedFullName = matchedStudent.fullName || matchedStudent.name || 'Unknown Student';
            const resolvedRegisterNo = matchedStudent.registerNo || matchedStudent.rollNumber || 'N/A';
            const resolvedParentPhone = (matchedStudent.parentPhone || matchedStudent.phone || '').trim();

            extractedAbsentees.push({
              _id: studentId || rec._id,
              fullName: resolvedFullName,
              registerNo: resolvedRegisterNo,
              course: resolvedCourse,
              semester: resolvedSemester,
              subject,
              parentPhone: resolvedParentPhone,
              date
            });
          }
        });
      });

      setAbsenteesList(extractedAbsentees);
    } catch {
      showCustomToast('error', 'Fetch Error', 'Failed to load absentees for the selected date.');
      setAbsenteesList([]);
    } finally {
      setLoadingAbsentees(false);
    }
  };

  const openAbsenteesModal = () => {
    setIsAbsenteesModalOpen(true);
    fetchAbsenteesByDate(selectedDate);
  };

  // 3. Direct SMS Dispatch Actions
  const handleNotifyParentSMS = (absentee) => {
    const rawPhone = (absentee.parentPhone || '').replace(/\D/g, '');
    if (!rawPhone) {
      showCustomToast('error', 'Missing Number', `No parent contact registered for ${absentee.fullName}.`);
      return;
    }

    const message = `Dear Parent, your ward ${absentee.fullName} (Reg: ${absentee.registerNo}) was marked ABSENT for ${absentee.subject} (${absentee.course} - ${absentee.semester}) on ${absentee.date} at Success Degree College.`;

    const smsUrl = `sms:${rawPhone}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_self');
    showCustomToast('info', 'Opening SMS App', `Composing alert to ${rawPhone}...`);
  };

  const handleNotifyAllParentsSMS = () => {
    const withPhone = absenteesList.filter(a => a.parentPhone && a.parentPhone.replace(/\D/g, '').length >= 10);
    if (withPhone.length === 0) {
      showCustomToast('error', 'No Contacts Found', 'No valid parent mobile numbers available in the absentee list.');
      return;
    }

    const phoneList = withPhone.map(a => a.parentPhone.replace(/\D/g, '')).join(',');
    const batchMessage = `Dear Parent, this is an official absence alert from Success Degree College for students marked absent on ${selectedDate}. Please contact the college administration for details.`;

    const smsUrl = `sms:${phoneList}?body=${encodeURIComponent(batchMessage)}`;
    window.open(smsUrl, '_self');
    showCustomToast('success', 'Batch SMS Composed', `Dispatched alerts for ${withPhone.length} parents.`);
  };

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

  // Filtered Absentees in Modal
  const filteredAbsentees = useMemo(() => {
    return absenteesList.filter(st => {
      const name = (st.fullName || '').toLowerCase();
      const reg = (st.registerNo || '').toLowerCase();
      const sub = (st.subject || '').toLowerCase();
      const course = (st.course || '').toLowerCase();
      const sem = (st.semester || '').toLowerCase();
      const q = absenteeSearch.toLowerCase();
      return name.includes(q) || reg.includes(q) || sub.includes(q) || course.includes(q) || sem.includes(q);
    });
  }, [absenteesList, absenteeSearch]);

  // Handle Student Enrollment Submission
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentForm.fullName.trim() || !studentForm.registerNo.trim()) {
      return showCustomToast('error', 'Validation Error', 'Please provide both name and register number.');
    }

    setSubmittingStudent(true);
    try {
      const payload = {
        fullName: studentForm.fullName.trim(),
        registerNo: studentForm.registerNo.trim().toUpperCase(),
        course: studentForm.course,
        semester: studentForm.semester,
        parentPhone: studentForm.parentPhone.trim()
      };

      const { data } = await axios.post('/api/students/add', payload);

      if (data.success || data.student) {
        showCustomToast('success', 'Student Enrolled', `Registered ${payload.fullName} into the database!`);
        setStudentForm({
          fullName: '',
          registerNo: '',
          course: 'B.Sc',
          semester: '1st Semester',
          parentPhone: ''
        });
        setIsStudentModalOpen(false);
        fetchData();
      } else {
        showCustomToast('error', 'Registration Failed', data.message || 'Failed to add student.');
      }
    } catch (err) {
      showCustomToast('error', 'Error', err.response?.data?.message || 'Error adding student record.');
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
      showCustomToast('success', 'Allocation Removed', `Deleted ${subject} batch link.`);
    } catch (err) {
      showCustomToast('error', 'Delete Failed', err.response?.data?.message || 'Failed to delete allocation.');
    }
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
      
      {/* Floating Custom Toast */}
      {customToast.visible && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full animate-fadeIn transition-all">
          <div className={`p-4 rounded-2xl backdrop-blur-2xl border shadow-2xl flex items-start gap-3.5 ${
            customToast.type === 'success' 
              ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10' 
              : customToast.type === 'info'
                ? 'bg-slate-900/95 border-indigo-500/40 text-indigo-300 shadow-indigo-500/10'
                : 'bg-slate-900/95 border-rose-500/40 text-rose-300 shadow-rose-500/10'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              customToast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : customToast.type === 'info' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {customToast.type === 'success' && <CheckCircle2 size={19} />}
              {customToast.type === 'info' && <Info size={19} />}
              {customToast.type === 'error' && <AlertCircle size={19} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-white leading-tight">{customToast.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{customToast.message}</p>
            </div>
            <button 
              onClick={() => setCustomToast(prev => ({ ...prev, visible: false }))}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

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

          <div className="flex flex-wrap items-center gap-3">
            {/* View Absentees Trigger Button */}
            <button
              onClick={openAbsenteesModal}
              className="flex items-center gap-2 px-5 py-3 bg-linear-to-br from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
            >
              <UserX size={16} /> Daily Absentees & SMS Alerts
            </button>

            {/* Enroll Student Trigger */}
            <button
              onClick={() => setIsStudentModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-linear-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <UserPlus size={16} /> Enroll Student
            </button>
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

        {/* MODAL 1: Daily Absentees & Direct SMS Notifications */}
        {isAbsenteesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                    <UserX size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Daily Defaulters & Absentees</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                        {absenteesList.length} Absent
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Review absentees and trigger parent text alerts.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Date Selector */}
                  <div className="flex items-center gap-2 bg-slate-950/90 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
                    <Calendar size={14} className="text-rose-400" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        fetchAbsenteesByDate(e.target.value);
                      }}
                      className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                    />
                  </div>

                  <button 
                    onClick={() => setIsAbsenteesModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Action & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by student, register, or course..."
                    value={absenteeSearch}
                    onChange={(e) => setAbsenteeSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {absenteesList.length > 0 && (
                  <button
                    onClick={handleNotifyAllParentsSMS}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Send size={14} /> Send SMS to All Parents
                  </button>
                )}
              </div>

              {/* Absentees Scrollable Table */}
              <div className="flex-1 overflow-y-auto border border-white/10 rounded-2xl bg-slate-950/40">
                {loadingAbsentees ? (
                  <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    Checking attendance rolls for {selectedDate}...
                  </div>
                ) : filteredAbsentees.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs space-y-1">
                    <CheckCircle2 size={28} className="mx-auto text-emerald-400 opacity-60 mb-2" />
                    <p className="font-semibold text-slate-300">No absentees logged for this date.</p>
                    <p>All students present or no lectures recorded.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 tracking-wider sticky top-0 border-b border-white/10 z-10">
                      <tr>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Register No</th>
                        <th className="py-3 px-4">Enrolled Course & Term</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Parent Mobile</th>
                        <th className="py-3 px-4 text-right">Direct Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAbsentees.map((st, idx) => (
                        <tr key={`${st._id}-${idx}`} className="hover:bg-white/2">
                          <td className="py-3 px-4 font-bold text-white">
                            {st.fullName}
                          </td>
                          <td className="py-3 px-4 font-mono text-indigo-300">
                            {st.registerNo}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <span className="font-semibold text-white">{st.course}</span> &bull; <span className="text-indigo-400 font-medium">{st.semester}</span>
                          </td>
                          <td className="py-3 px-4 text-rose-300 font-medium">
                            {st.subject}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {st.parentPhone ? (
                              <span className="flex items-center gap-1">
                                <Phone size={11} className="text-slate-500" />
                                {st.parentPhone}
                              </span>
                            ) : (
                              <span className="text-slate-600">Not Provided</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleNotifyParentSMS(st)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
                              title="Send Parent Text SMS"
                            >
                              <MessageSquare size={13} className="text-indigo-400" />
                              <span>Send Text SMS</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Showing records for: <strong className="text-white font-mono">{selectedDate}</strong></span>
                <button
                  onClick={() => setIsAbsenteesModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL 2: Add New Student Record */}
        {isStudentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
              
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
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
                    <User size={14} className="text-indigo-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohammed Sajid"
                    value={studentForm.fullName}
                    onChange={e => setStudentForm({ ...studentForm, fullName: e.target.value })}
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
                    value={studentForm.registerNo}
                    onChange={e => setStudentForm({ ...studentForm, registerNo: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Parent Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-400" /> Parent Mobile Number (for SMS Alerts)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={studentForm.parentPhone}
                    onChange={e => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Course Stream */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-indigo-400" /> Degree Program
                  </label>
                  <select
                    value={studentForm.course}
                    onChange={e => setStudentForm({ ...studentForm, course: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm focus:border-indigo-500 focus:outline-none cursor-pointer transition-all"
                  >
                    {COURSES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>

                {/* Academic Semester */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-400" /> Academic Semester
                  </label>
                  <select
                    value={studentForm.semester}
                    onChange={e => setStudentForm({ ...studentForm, semester: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm focus:border-indigo-500 focus:outline-none cursor-pointer transition-all"
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
                    className="px-6 py-3 bg-linear-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
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