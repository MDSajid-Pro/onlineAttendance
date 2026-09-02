import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Search, 
  Trash2, 
  Layers, 
  UserCheck, 
  X, 
  UserX, 
  MessageSquare, 
  Send, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Phone, 
  BellRing,
  ClockAlert,
  MessageCircle,
  Lock,
  ShieldCheck,
  Share2
} from 'lucide-react';

// Formats 'YYYY-MM-DD' into readable 'DD/MM/YYYY'
const formatDisplayDate = (isoDate) => {
  if (!isoDate) return '';
  const parts = String(isoDate).split('T')[0].split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const AdminDashboard = () => {
  const { axios } = useAppContext();
  const navigate = useNavigate();

  const [allocations, setAllocations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Daily Date Selector State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Absentees Modal State
  const [absenteesList, setAbsenteesList] = useState([]);
  const [loadingAbsentees, setLoadingAbsentees] = useState(false);
  const [isAbsenteesModalOpen, setIsAbsenteesModalOpen] = useState(false);
  const [absenteeSearch, setAbsenteeSearch] = useState('');

  // Faculty Reminder Modal State
  const [isFacultyReminderModalOpen, setIsFacultyReminderModalOpen] = useState(false);
  const [facultySearch, setFacultySearch] = useState('');

  // Strict Message Dispatcher Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [customRecipient, setCustomRecipient] = useState({
    name: '',
    role: '',
    phone: '',
    subject: '',
    context: '',
    registerNo: ''
  });
  const [strictMessage, setStrictMessage] = useState('');

  // Toast State
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

  // 1. Initial Load
  const fetchData = async () => {
    try {
      setLoading(true);
      const [allocRes, teachersRes, studentsRes, attRes] = await Promise.all([
        axios.get('/api/teacher/all-allocations'),
        axios.get('/api/teacher'),
        axios.get('/api/students/all'),
        axios.get('/api/attendance/history', { params: { date: selectedDate } }).catch(() => ({ data: [] }))
      ]);

      setAllocations(Array.isArray(allocRes.data) ? allocRes.data : []);
      setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data?.teachers || []);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data?.students || []);

      const attLogs = Array.isArray(attRes.data?.attendances)
        ? attRes.data.attendances
        : Array.isArray(attRes.data)
        ? attRes.data
        : [];
      setAttendanceRecords(attLogs);
    } catch {
      showCustomToast('error', 'Sync Failure', 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [axios, selectedDate]);

  // 2. Fetch Absentees
  const fetchAbsenteesByDate = async (date) => {
    try {
      setLoadingAbsentees(true);
      const { data } = await axios.get('/api/attendance/history', { params: { date } });
      const logs = Array.isArray(data.attendances) ? data.attendances : Array.isArray(data) ? data : [];
      const extractedAbsentees = [];

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
            const matchedStudent = (typeof rawStudent === 'object' && rawStudent.fullName) 
              ? rawStudent 
              : (studentMap[String(studentId)] || {});

            extractedAbsentees.push({
              _id: studentId || rec._id,
              fullName: matchedStudent.fullName || matchedStudent.name || 'Unknown Student',
              registerNo: matchedStudent.registerNo || matchedStudent.rollNumber || 'N/A',
              course: matchedStudent.course || log.courseName || log.course || 'B.Sc',
              semester: matchedStudent.semester || log.semester || '1st Semester',
              subject,
              parentPhone: (matchedStudent.parentPhone || matchedStudent.phone || '').trim(),
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

  // 3. Compute Pending Allocations per Class Session
  const pendingAllocations = useMemo(() => {
    return allocations.filter(alloc => {
      const allocTeacherId = String(alloc.teacher?._id || alloc.teacher || '');
      const allocSubject = (alloc.subject || '').trim().toLowerCase();
      const allocCourse = (alloc.courseName || alloc.course || '').trim().toLowerCase();
      const allocSemester = (alloc.semester || '').trim().toLowerCase();

      const isMarked = attendanceRecords.some(att => {
        // Direct allocation ID match if provided by backend attendance schema
        const attAllocId = String(att.allocation?._id || att.allocation || att.assignment?._id || att.assignment || '');
        if (attAllocId && String(alloc._id) === attAllocId) {
          return true;
        }

        const attTeacherId = String(att.teacher?._id || att.teacher || '');
        const attSubject = (att.subject || att.assignment?.subject || '').trim().toLowerCase();
        const attCourse = (att.courseName || att.course || '').trim().toLowerCase();
        const attSemester = (att.semester || '').trim().toLowerCase();

        // Check teacher match (optional if records only log courses)
        const matchesTeacher = !attTeacherId || !allocTeacherId || attTeacherId === allocTeacherId;

        // Must strictly match the specific class unit: subject, course, and semester
        const matchesSubject = attSubject === allocSubject;
        const matchesCourse = attCourse === allocCourse;
        const matchesSemester = attSemester === allocSemester;

        return matchesTeacher && matchesSubject && matchesCourse && matchesSemester;
      });

      return !isMarked;
    });
  }, [allocations, attendanceRecords]);

  // Filters
  const filteredPending = useMemo(() => {
    return pendingAllocations.filter(alloc => {
      const teacherName = (alloc.teacher?.name || '').toLowerCase();
      const subject = (alloc.subject || '').toLowerCase();
      const course = (alloc.courseName || '').toLowerCase();
      const q = facultySearch.toLowerCase();
      return teacherName.includes(q) || subject.includes(q) || course.includes(q);
    });
  }, [pendingAllocations, facultySearch]);

  const filteredAllocations = useMemo(() => {
    return allocations.filter(a => {
      const teacherName = (a.teacher?.name || '').toLowerCase();
      const subject = (a.subject || '').toLowerCase();
      const course = (a.courseName || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      return teacherName.includes(q) || subject.includes(q) || course.includes(q);
    });
  }, [allocations, searchQuery]);

  const filteredAbsentees = useMemo(() => {
    return absenteesList.filter(st => {
      const name = (st.fullName || '').toLowerCase();
      const reg = (st.registerNo || '').toLowerCase();
      const sub = (st.subject || '').toLowerCase();
      const q = absenteeSearch.toLowerCase();
      return name.includes(q) || reg.includes(q) || sub.includes(q);
    });
  }, [absenteesList, absenteeSearch]);

  // 4. Strict Official Message Templates
  const openCustomMessenger = (type, data) => {
    const formattedDate = formatDisplayDate(type === 'teacher' ? selectedDate : data.date);

    if (type === 'teacher') {
      const name = data.teacher?.name || 'Faculty Member';
      const phone = (data.teacher?.phone || '').trim();

      const strictNotice = 
`[OFFICIAL NOTIFICATION: ATTENDANCE SUBMISSION]
Success Degree College, Basavakalyan

Respected Prof. ${name},
This is an urgent reminder that attendance has not yet been marked for:
- Subject: ${data.subject}
- Class: ${data.courseName} (${data.semester})
- Date: ${formattedDate}

Please log in to the faculty portal and submit the verified roll call immediately to maintain academic compliance.

Regards,
Office of the Principal
Success Degree College`;

      setCustomRecipient({
        name,
        role: 'Faculty Member',
        phone,
        subject: data.subject,
        context: `${data.courseName} - ${data.semester}`,
        registerNo: ''
      });
      setStrictMessage(strictNotice);
    } else {
      const name = data.fullName;
      const phone = (data.parentPhone || '').trim();

      const strictNotice = 
`[OFFICIAL PARENTAL ALERT: ABSENCE RECORD]
Success Degree College, Basavakalyan

Dear Parent/Guardian,
This is to formally notify you that your ward ${name} has been recorded ABSENT from scheduled lectures:
- Student: ${name}
- Reg No: ${data.registerNo}
- Class: ${data.course} (${data.semester})
- Subject: ${data.subject}
- Date: ${formattedDate}

Regular attendance is mandatory for semester university examination eligibility. Kindly contact the department if this absence was unexcused.

Office of Academic Affairs
Success Degree College`;

      setCustomRecipient({
        name,
        role: 'Parent / Guardian',
        phone,
        subject: data.subject,
        context: `${data.course} - ${data.semester}`,
        registerNo: data.registerNo
      });
      setStrictMessage(strictNotice);
    }
    setIsReminderModalOpen(true);
  };

  // 5. Channel Dispatch: Direct or Contact Picker Fallback
  const handleSendStrictChannel = (channel) => {
    const rawPhone = (customRecipient.phone || '').replace(/\D/g, '');
    const hasValidPhone = rawPhone.length >= 10;
    const encodedText = encodeURIComponent(strictMessage);

    if (channel === 'whatsapp') {
      if (hasValidPhone) {
        const sanitizedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
        window.open(`https://wa.me/${sanitizedPhone}?text=${encodedText}`, '_blank');
        showCustomToast('success', 'Dispatched', `WhatsApp directed to ${customRecipient.name}`);
      } else {
        // Fallback: Opens WhatsApp chat chooser with text pre-filled
        window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
        showCustomToast('info', 'Choose Contact', 'No number registered. Select contact in WhatsApp.');
      }
    } else {
      if (hasValidPhone) {
        window.open(`sms:${rawPhone}?body=${encodedText}`, '_self');
        showCustomToast('info', 'SMS Prepared', `SMS opened for ${customRecipient.name}`);
      } else {
        // Fallback: Opens SMS app with empty recipient and text pre-filled
        window.open(`sms:?body=${encodedText}`, '_self');
        showCustomToast('info', 'Choose Contact', 'No number registered. Select recipient in SMS app.');
      }
    }
    setIsReminderModalOpen(false);
  };

  // 6. Delete Allocation
  const handleDeleteAllocation = async (id, subject) => {
    if (!window.confirm(`Are you sure you want to delete the allocation for "${subject}"?`)) return;
    try {
      await axios.delete(`/api/teacher/allocation/${id}`);
      setAllocations(prev => prev.filter(a => a._id !== id));
      showCustomToast('success', 'Deleted', `Removed ${subject} link.`);
    } catch (err) {
      showCustomToast('error', 'Delete Failed', err.response?.data?.message || 'Failed to remove.');
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
      
      {/* Toast Notification */}
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
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl space-y-8">

        {/* Top Navbar Header */}
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
              <p className="text-slate-400 text-sm mt-0.5">Faculty Attendance Status & Direct Communications</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex items-center gap-2 bg-slate-950/80 border border-white/10 px-3.5 py-2.5 rounded-2xl text-xs hover:border-indigo-500/40 transition-colors">
              <Calendar size={15} className="text-indigo-400 shrink-0" />
              <span className="text-white font-medium tracking-wide">
                {formatDisplayDate(selectedDate)}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            <div className="inline-flex items-center gap-2.5">
              <button
                onClick={openAbsenteesModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-br from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-rose-500/25 transition-all cursor-pointer h-10"
              >
                <UserX size={16} />
                <span>Daily Absentees</span>
              </button>

              <button
                onClick={() => setIsFacultyReminderModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-br from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-amber-500/25 transition-all cursor-pointer h-10"
              >
                <BellRing size={16} />
                <span>Faculty Reminders</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/20 text-white font-mono leading-none">
                  {pendingAllocations.length}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Unmarked Classes</span>
              <ClockAlert size={18} className="text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{pendingAllocations.length}</p>
            <span className="text-[11px] text-amber-400 font-medium">Pending on {formatDisplayDate(selectedDate)}</span>
          </div>

          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Active Faculty</span>
              <UserCheck size={18} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{teachers.length}</p>
            <span className="text-[11px] text-emerald-400 font-medium">Staff Members</span>
          </div>

          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Allocated Batches</span>
              <Layers size={18} className="text-indigo-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{allocations.length}</p>
            <span className="text-[11px] text-indigo-400 font-medium">Class Sessions</span>
          </div>

          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Enrolled Students</span>
              <GraduationCap size={18} className="text-blue-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{students.length}</p>
            <span className="text-[11px] text-blue-400 font-medium">Registered Database</span>
          </div>
        </div>

        {/* Allocations Registry Table */}
        <section className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">All Faculty Allocations Registry</h2>
              <p className="text-slate-400 text-xs mt-0.5">Master roster of teacher assignments and student cohorts.</p>
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
                          className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all cursor-pointer inline-flex items-center"
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

        {/* MODAL 1: FACULTY REMINDERS */}
        {isFacultyReminderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] flex flex-col">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <BellRing size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Faculty Attendance Reminders</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                        {pendingAllocations.length} Pending
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Classes where attendance has not been recorded for {formatDisplayDate(selectedDate)}.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsFacultyReminderModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search pending faculty or subject..."
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto border border-white/10 rounded-2xl bg-slate-950/40">
                {filteredPending.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs space-y-1">
                    <CheckCircle2 size={28} className="mx-auto text-emerald-400 opacity-60 mb-2" />
                    <p className="font-semibold text-slate-300">All faculty members have submitted attendance!</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 tracking-wider sticky top-0 border-b border-white/10 z-10">
                      <tr>
                        <th className="py-3 px-4">Faculty Member</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Course & Term</th>
                        <th className="py-3 px-4">Registered Contact</th>
                        <th className="py-3 px-4 text-right">Dispatch Notice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredPending.map(alloc => (
                        <tr key={alloc._id} className="hover:bg-white/2">
                          <td className="py-3 px-4 font-bold text-white">
                            {alloc.teacher?.name || 'Unassigned Teacher'}
                          </td>
                          <td className="py-3 px-4 text-amber-300 font-medium">
                            {alloc.subject}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <span className="font-semibold text-white">{alloc.courseName}</span> &bull; <span className="text-indigo-400">{alloc.semester}</span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {alloc.teacher?.phone ? (
                              <span className="text-slate-300">{alloc.teacher.phone}</span>
                            ) : (
                              <span className="text-rose-400/80 text-[11px] font-sans italic">Not registered</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openCustomMessenger('teacher', alloc)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                            >
                              <Send size={12} />
                              <span>Notify</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Displaying records for: <strong className="text-white font-mono">{formatDisplayDate(selectedDate)}</strong></span>
                <button
                  onClick={() => setIsFacultyReminderModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL 2: DAILY ABSENTEES */}
        {isAbsenteesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] flex flex-col">
              
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
                    <p className="text-xs text-slate-400">Review student absentees and trigger official parental alerts.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsAbsenteesModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search absentee or subject..."
                    value={absenteeSearch}
                    onChange={(e) => setAbsenteeSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto border border-white/10 rounded-2xl bg-slate-950/40">
                {loadingAbsentees ? (
                  <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    Checking attendance records for {formatDisplayDate(selectedDate)}...
                  </div>
                ) : filteredAbsentees.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs space-y-1">
                    <CheckCircle2 size={28} className="mx-auto text-emerald-400 opacity-60 mb-2" />
                    <p className="font-semibold text-slate-300">No absentees logged for this date.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 tracking-wider sticky top-0 border-b border-white/10 z-10">
                      <tr>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Register No</th>
                        <th className="py-3 px-4">Class & Term</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Parent Mobile</th>
                        <th className="py-3 px-4 text-right">Official Alert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAbsentees.map((st, idx) => (
                        <tr key={`${st._id}-${idx}`} className="hover:bg-white/2">
                          <td className="py-3 px-4 font-bold text-white">{st.fullName}</td>
                          <td className="py-3 px-4 font-mono text-indigo-300">{st.registerNo}</td>
                          <td className="py-3 px-4 text-slate-300">
                            <span className="font-semibold text-white">{st.course}</span> &bull; <span className="text-indigo-400 font-medium">{st.semester}</span>
                          </td>
                          <td className="py-3 px-4 text-rose-300 font-medium">{st.subject}</td>
                          <td className="py-3 px-4 font-mono">
                            {st.parentPhone ? (
                              <span className="text-slate-300">{st.parentPhone}</span>
                            ) : (
                              <span className="text-rose-400/80 text-[11px] font-sans italic">Not registered</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openCustomMessenger('student', st)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                              title="Send Official Parental Alert"
                            >
                              <MessageSquare size={13} />
                              <span>Notify</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Displaying records for: <strong className="text-white font-mono">{formatDisplayDate(selectedDate)}</strong></span>
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

        {/* MODAL 3: STRICT OFFICIAL MESSAGE DISPATCHER */}
        {isReminderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Official Institutional Notice</h3>
                    <p className="text-xs text-slate-400">Standardized compliance dispatch</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReminderModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Recipient Roster Info */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="font-semibold text-white">{customRecipient.name} <span className="text-slate-400 font-normal">({customRecipient.role})</span></span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Course / Unit:</span>
                  <span className="text-indigo-300 font-mono">{customRecipient.subject} &bull; {customRecipient.context}</span>
                </div>

                {customRecipient.registerNo && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Roll / Reg No:</span>
                    <span className="text-indigo-300 font-mono">{customRecipient.registerNo}</span>
                  </div>
                )}

                {/* Registered Contact Status */}
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Lock size={12} className="text-amber-400" />
                    <span>Registered Contact:</span>
                  </span>
                  {customRecipient.phone ? (
                    <span className="font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-semibold">
                      +91 {customRecipient.phone.replace(/\D/g, '').slice(-10)}
                    </span>
                  ) : (
                    <span className="text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1">
                      <Share2 size={11} /> Not registered &bull; Chooser fallback active
                    </span>
                  )}
                </div>
              </div>

              {/* Immutable Official Message Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock size={12} className="text-slate-400" />
                    <span>Official Template (Read-Only)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Locked by Admin Policy</span>
                </div>
                <div className="w-full p-3.5 bg-slate-950/90 border border-white/10 rounded-2xl text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto border-l-2 border-l-indigo-500">
                  {strictMessage}
                </div>
              </div>

              {/* Dispatch Options */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleSendStrictChannel('whatsapp')}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>{customRecipient.phone ? 'Send via WhatsApp' : 'Open WhatsApp Chooser'}</span>
                </button>
                <button
                  onClick={() => handleSendStrictChannel('sms')}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Send size={15} />
                  <span>{customRecipient.phone ? 'Send via SMS' : 'Open SMS Chooser'}</span>
                </button>
              </div>

              {!customRecipient.phone && (
                <p className="text-[11px] text-center text-amber-300/80">
                  Notice: No contact found in database. Clicking will open your app with the message pre-filled so you can select the recipient manually.
                </p>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;