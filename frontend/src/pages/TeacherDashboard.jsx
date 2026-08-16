import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  Users, 
  BookOpen, 
  Calendar, 
  Save, 
  LogOut, 
  Search, 
  Sparkles, 
  GraduationCap, 
  RotateCcw, 
  Check, 
  Layers, 
  SlidersHorizontal,
  ChevronRight,
  UserCheck,
  AlertCircle,
  Download,
  Palmtree,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Holiday master list (Format: MM-DD or YYYY-MM-DD)
const FIXED_HOLIDAYS = {
  '01-01': 'New Year\'s Day',
  '01-14': 'Makara Sankranti',
  '01-26': 'Republic Day',
  '05-01': 'May Day / Labour Day',
  '08-15': 'Independence Day',
  '08-26': 'Milad un-Nabi',
  '10-02': 'Gandhi Jayanti',
  '11-01': 'Kannada Rajyotsava',
  '12-25': 'Christmas'
};

const TeacherDashboard = () => {
  const { axios, setToken, setUser } = useAppContext();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isSavedForDate, setIsSavedForDate] = useState(false);
  const [isDateLoading, setIsDateLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const storedUserRaw = localStorage.getItem("user");
  const storedUser = storedUserRaw && storedUserRaw !== "undefined" ? JSON.parse(storedUserRaw) : null;
  const teacherId = storedUser?._id || storedUser?.id;

  // 1. Holiday Calculator
  const holidayInfo = useMemo(() => {
    if (!attendanceDate) return null;
    const [year, month, day] = attendanceDate.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    
    // Check Sunday
    if (dateObj.getDay() === 0) {
      return { isHoliday: true, reason: 'Sunday (Weekly Institutional Off)' };
    }

    // Check fixed holidays
    const mmdd = `${month}-${day}`;
    if (FIXED_HOLIDAYS[mmdd]) {
      return { isHoliday: true, reason: FIXED_HOLIDAYS[mmdd] };
    }

    return { isHoliday: false, reason: null };
  }, [attendanceDate]);

  // 2. Fetch Assignments
  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (!teacherId) return;
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/teacher/${teacherId}`);
        const list = Array.isArray(data) ? data : [];
        setAssignments(list);

        if (list.length > 0) {
          setSelectedCourse(list[0].courseName || 'B.Sc');
          setSelectedSemester(list[0].semester || 'I Semester');
          setSelectedAssignmentId(list[0]._id);
        }
      } catch {
        toast.error("Failed to load allocated classrooms");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherClasses();
  }, [axios, teacherId]);

  const availableCourses = useMemo(() => {
    return Array.from(new Set(assignments.map(a => a.courseName).filter(Boolean)));
  }, [assignments]);

  const availableSemesters = useMemo(() => {
    return Array.from(
      new Set(
        assignments
          .filter(a => !selectedCourse || a.courseName === selectedCourse)
          .map(a => a.semester)
          .filter(Boolean)
      )
    );
  }, [assignments, selectedCourse]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchCourse = selectedCourse ? a.courseName === selectedCourse : true;
      const matchSemester = selectedSemester ? a.semester === selectedSemester : true;
      return matchCourse && matchSemester;
    });
  }, [assignments, selectedCourse, selectedSemester]);

  const activeAssignment = useMemo(() => {
    if (selectedAssignmentId) {
      const match = assignments.find(a => a._id === selectedAssignmentId);
      if (match) return match;
    }
    return filteredAssignments[0] || null;
  }, [assignments, selectedAssignmentId, filteredAssignments]);

  useEffect(() => {
    if (filteredAssignments.length > 0 && !filteredAssignments.some(a => a._id === selectedAssignmentId)) {
      setSelectedAssignmentId(filteredAssignments[0]._id);
    }
  }, [filteredAssignments, selectedAssignmentId]);

  // 3. Fetch attendance state for active date
  const syncDateAttendance = useCallback(async () => {
    if (!activeAssignment?._id || !attendanceDate) return;

    try {
      setIsDateLoading(true);
      const { data } = await axios.get('/api/attendance/by-date', {
        params: {
          assignmentId: activeAssignment._id,
          date: attendanceDate
        }
      });

      const initialMap = {};

      if (data?.exists && Array.isArray(data.records) && data.records.length > 0) {
        data.records.forEach(r => {
          const studentId = typeof r.student === 'object' ? r.student._id : r.student;
          initialMap[studentId] = r.status;
        });
        setIsSavedForDate(true);
      } else {
        // Initial state: Unselected (null) so buttons are NOT highlighted by default
        activeAssignment.students?.forEach(st => {
          initialMap[st._id] = null;
        });
        setIsSavedForDate(false);
      }

      setAttendanceRecords(initialMap);
    } catch {
      const fallbackMap = {};
      activeAssignment.students?.forEach(st => {
        fallbackMap[st._id] = null;
      });
      setAttendanceRecords(fallbackMap);
      setIsSavedForDate(false);
    } finally {
      setIsDateLoading(false);
    }
  }, [axios, activeAssignment, attendanceDate]);

  useEffect(() => {
    syncDateAttendance();
  }, [syncDateAttendance]);

  // Real-time calculations
  const { stats, uncompletedCount, isAllMarked } = useMemo(() => {
    const total = activeAssignment?.students?.length || 0;
    if (!total) return { stats: { present: 0, absent: 0, late: 0, rate: 0 }, uncompletedCount: 0, isAllMarked: false };
    
    let present = 0, absent = 0, late = 0, markedCount = 0;
    
    (activeAssignment.students || []).forEach(st => {
      const status = attendanceRecords[st._id];
      if (status === 'Present') { present++; markedCount++; }
      else if (status === 'Absent') { absent++; markedCount++; }
      else if (status === 'Late') { late++; markedCount++; }
    });

    const rate = markedCount > 0 ? Math.round(((present + late * 0.5) / markedCount) * 100) : 0;
    const uncompletedCount = total - markedCount;
    const isAllMarked = total > 0 && uncompletedCount === 0;

    return { stats: { present, absent, late, rate }, uncompletedCount, isAllMarked };
  }, [attendanceRecords, activeAssignment]);

  const filteredStudents = useMemo(() => {
    if (!activeAssignment?.students) return [];
    return activeAssignment.students.filter(st => {
      const name = (st.fullName || st.name || '').toLowerCase();
      const reg = (st.registerNo || st.rollNumber || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || reg.includes(searchQuery.toLowerCase());
      
      const currentStatus = attendanceRecords[st._id];
      const matchesStatus = 
        statusFilter === 'ALL' 
          ? true 
          : statusFilter === 'Unmarked' 
            ? !currentStatus 
            : currentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activeAssignment, searchQuery, statusFilter, attendanceRecords]);

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: newStatus
    }));
  };

  const handleBatchMark = (status) => {
    if (!activeAssignment?.students || holidayInfo?.isHoliday) return;
    const updated = {};
    activeAssignment.students.forEach(st => {
      updated[st._id] = status;
    });
    setAttendanceRecords(updated);
    toast.success(`Marked all as ${status}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    if (setUser) setUser(null);
    delete axios.defaults.headers.common["Authorization"];
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleSubmitAttendance = async () => {
    if (!activeAssignment) return;
    if (holidayInfo?.isHoliday) {
      return toast.error("Attendance submission disabled on institutional holidays.");
    }
    if (!isAllMarked) {
      return toast.error(`Please mark attendance for all students (${uncompletedCount} remaining)`);
    }
    
    setSaving(true);
    const payload = {
      teacherId,
      assignmentId: activeAssignment._id,
      courseName: activeAssignment.courseName,
      semester: activeAssignment.semester,
      subject: activeAssignment.subject,
      date: attendanceDate,
      records: Object.keys(attendanceRecords).map(stId => ({
        student: stId,
        status: attendanceRecords[stId]
      }))
    };

    try {
      await axios.post('/api/attendance/submit', payload);
      setIsSavedForDate(true);
      toast.success(`Attendance submitted for ${attendanceDate}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  // 4. Monthly Attendance PDF Report Generator
const downloadMonthlyReportPDF = async () => {
  if (!activeAssignment) return;
  setGeneratingReport(true);
  try {
    const [year, month] = attendanceDate.split('-');
    const { data } = await axios.get('/api/attendance/monthly-report', {
      params: {
        assignmentId: activeAssignment._id,
        month,
        year
      }
    });

    const logs = data.logs || [];
    if (logs.length === 0) {
      toast.error(`No attendance logs recorded for ${month}/${year}`);
      return;
    }

    // Aggregate attendance totals per student
    const studentMap = {};
    activeAssignment.students?.forEach(st => {
      studentMap[st._id] = {
        name: st.fullName || st.name,
        regNo: st.registerNo || 'N/A',
        present: 0,
        absent: 0,
        late: 0,
        totalSessions: logs.length
      };
    });

    logs.forEach(log => {
      log.records?.forEach(rec => {
        const stId = typeof rec.student === 'object' ? rec.student?._id : rec.student;
        if (studentMap[stId]) {
          if (rec.status === 'Present') studentMap[stId].present++;
          else if (rec.status === 'Absent') studentMap[stId].absent++;
          else if (rec.status === 'Late') studentMap[stId].late++;
        }
      });
    });

    // Initialize jsPDF
    const doc = new jsPDF('p', 'mm', 'a4');
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long' });

    // Header Details
    doc.setFontSize(18);
    doc.setTextColor(20, 24, 33);
    doc.text("Success Degree College", 14, 18);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 90, 110);
    doc.text(`Monthly Attendance Report — ${monthName} ${year}`, 14, 25);
    doc.text(`Course: ${activeAssignment.courseName} | Semester: ${activeAssignment.semester} | Subject: ${activeAssignment.subject}`, 14, 31);
    doc.text(`Faculty: ${storedUser?.name || 'Faculty Member'}`, 14, 37);

    // Table Data Structure
    const tableHeaders = [["#", "Register No", "Student Name", "Present", "Absent", "Late", "Attendance %"]];
    const tableRows = Object.values(studentMap).map((st, idx) => {
      const percentage = Math.round(((st.present + st.late * 0.5) / (st.totalSessions || 1)) * 100);
      return [
        idx + 1,
        st.regNo,
        st.name,
        st.present,
        st.absent,
        st.late,
        `${percentage}%`
      ];
    });

    // Call autoTable as a standalone function passing 'doc'
    autoTable(doc, {
      startY: 42,
      head: tableHeaders,
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`Attendance_${activeAssignment.subject}_${monthName}_${year}.pdf`);
    toast.success("Monthly PDF Report downloaded!");
  } catch (err) {
    console.error("PDF generation error:", err);
    toast.error("Failed to generate report: " + (err.message || "Unknown error"));
  } finally {
    setGeneratingReport(false);
  }
};

  // 5. Monthly CSV / Excel Export
  const downloadMonthlyReportCSV = async () => {
    if (!activeAssignment) return;
    try {
      const [year, month] = attendanceDate.split('-');
      const { data } = await axios.get('/api/attendance/monthly-report', {
        params: { assignmentId: activeAssignment._id, month, year }
      });

      const logs = data.logs || [];
      if (logs.length === 0) {
        toast.error(`No attendance logs recorded for ${month}/${year}`);
        return;
      }

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Register No,Student Name,Course,Semester,Present Days,Absent Days,Late Days,Total Sessions,Attendance Rate\n";

      activeAssignment.students?.forEach(st => {
        let present = 0, absent = 0, late = 0;
        logs.forEach(log => {
          const rec = log.records?.find(r => (typeof r.student === 'object' ? r.student?._id : r.student) === st._id);
          if (rec?.status === 'Present') present++;
          else if (rec?.status === 'Absent') absent++;
          else if (rec?.status === 'Late') late++;
        });

        const rate = `${Math.round(((present + late * 0.5) / (logs.length || 1)) * 100)}%`;
        csvContent += `"${st.registerNo || ''}","${st.fullName || st.name}","${activeAssignment.courseName}","${activeAssignment.semester}",${present},${absent},${late},${logs.length},"${rate}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Attendance_${activeAssignment.subject}_${month}_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Monthly CSV Export downloaded!");
    } catch {
      toast.error("Failed to export CSV report");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080e] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Synchronizing faculty registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 p-4 md:p-8 flex justify-center selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="w-full max-w-7xl space-y-6">

        {/* Navigation Header */}
        <header className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-5 md:p-6 rounded-[2rem] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white border border-white/20">
              <GraduationCap size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Faculty Attendance Console</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                  <Sparkles size={11} /> Live Terminal
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
                <span>Instructor: <strong className="text-slate-200">{storedUser?.name || 'Faculty Member'}</strong></span>
                {storedUser?.employeeId && (
                  <span className="font-mono text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    {storedUser.employeeId}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            {/* Date Picker */}
            <div className="flex items-center gap-2.5 bg-slate-950/80 border border-white/10 px-4 py-2 rounded-2xl text-xs md:text-sm shadow-inner hover:border-white/20 transition-colors">
              <Calendar size={15} className="text-indigo-400" />
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs md:text-sm"
              />
            </div>

            {/* Monthly Report Trigger Buttons */}
            <button
              onClick={downloadMonthlyReportPDF}
              disabled={generatingReport || !activeAssignment}
              title="Download Monthly Attendance PDF Report"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-2xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText size={14} /> PDF Report
            </button>

            <button
              onClick={downloadMonthlyReportCSV}
              disabled={!activeAssignment}
              title="Download Monthly CSV Export"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet size={14} /> Excel / CSV
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 rounded-2xl text-xs font-bold transition-all cursor-pointer hover:shadow-lg hover:shadow-rose-500/10"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </header>

        {/* Holiday Notification Banner */}
        {holidayInfo?.isHoliday && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-300 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Palmtree size={20} className="text-amber-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Institutional Holiday Notice ({attendanceDate})</h4>
                <p className="text-xs text-amber-400/90">{holidayInfo.reason} — Classroom roll-call submission is closed for this day.</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-3 py-1 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-200 hidden sm:inline-block">
              Holiday Mode Active
            </span>
          </div>
        )}

        {/* Course & Semester Filter Canvas */}
        <section className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-indigo-400" /> Academic Stream & Term Filter
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Select degree stream and term to inspect dedicated subject allocations.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 w-fit">
              <UserCheck size={13} /> {assignments.length} Allocated Batches
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Course Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GraduationCap size={14} className="text-indigo-400" /> Degree Program
              </label>
              <div className="flex flex-wrap gap-2">
                {availableCourses.length === 0 ? (
                  <span className="text-xs text-slate-500">No courses allocated</span>
                ) : (
                  availableCourses.map(course => {
                    const isSelected = selectedCourse === course;
                    return (
                      <button
                        key={course}
                        type="button"
                        onClick={() => setSelectedCourse(course)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500/60 shadow-lg shadow-indigo-500/20 ring-1 ring-white/20'
                            : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white hover:border-white/15'
                        }`}
                      >
                        {course}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Semester Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-400" /> Academic Term
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSemesters.length === 0 ? (
                  <span className="text-xs text-slate-500">No terms available</span>
                ) : (
                  availableSemesters.map(sem => {
                    const isSelected = selectedSemester === sem;
                    return (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => setSelectedSemester(sem)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500/60 shadow-lg shadow-indigo-500/20 ring-1 ring-white/20'
                            : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white hover:border-white/15'
                        }`}
                      >
                        {sem}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Subject Cards */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Allocated Subjects ({filteredAssignments.length})
              </label>
              {activeAssignment && (
                <span className="text-xs text-indigo-400 font-medium hidden sm:inline">
                  Viewing roster for: <strong>{activeAssignment.subject}</strong>
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssignments.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-500 text-xs border border-dashed border-white/10 rounded-2xl bg-slate-950/30">
                  No registered subjects under {selectedCourse} ({selectedSemester}).
                </div>
              ) : (
                filteredAssignments.map(a => {
                  const isSelected = activeAssignment?._id === a._id;
                  return (
                    <div
                      key={a._id}
                      onClick={() => setSelectedAssignmentId(a._id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                          : 'bg-slate-950/60 border-white/5 hover:border-white/15 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-indigo-400 text-xs font-semibold mb-2">
                        <span className="flex items-center gap-1.5">
                          <BookOpen size={14} /> {a.courseName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                          {a.semester}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-white text-base group-hover:text-indigo-200 transition-colors leading-snug">
                        {a.subject}
                      </h3>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Users size={14} className="text-indigo-400" /> {a.students?.length || 0} Students
                        </span>
                        {isSelected ? (
                          <span className="text-indigo-400 font-bold text-[11px] flex items-center gap-1">
                            <Check size={13} /> Active Batch
                          </span>
                        ) : (
                          <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </section>

        {/* Main Roll Call Station */}
        {activeAssignment ? (
          <section className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-2xl">
            
            {/* Header with Stats Counter & Status */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                    {activeAssignment.courseName} • {activeAssignment.semester}
                  </span>
                  {holidayInfo?.isHoliday ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                      <Palmtree size={12} /> Holiday: {holidayInfo.reason}
                    </span>
                  ) : isSavedForDate ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                      <Check size={12} /> Saved for {attendanceDate}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                      <RotateCcw size={12} /> {uncompletedCount === 0 ? 'Ready to Submit' : `${uncompletedCount} Unmarked`}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">{activeAssignment.subject}</h2>
              </div>

              {/* Stat Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-500/80 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Present
                  </span>
                  <span className="text-lg font-extrabold text-white mt-0.5">{stats.present}</span>
                </div>

                <div className="px-4 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider text-rose-500/80 flex items-center gap-1">
                    <XCircle size={12} /> Absent
                  </span>
                  <span className="text-lg font-extrabold text-white mt-0.5">{stats.absent}</span>
                </div>

                <div className="px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider text-amber-500/80 flex items-center gap-1">
                    <Clock3 size={12} /> Late
                  </span>
                  <span className="text-lg font-extrabold text-white mt-0.5">{stats.late}</span>
                </div>

                <div className="px-4 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                    <Sparkles size={12} /> Rate
                  </span>
                  <span className="text-lg font-extrabold text-white mt-0.5">{stats.rate}%</span>
                </div>
              </div>
            </div>

            {/* Filter & Batch Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search student or register number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-2xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-white/10 text-xs">
                  {['ALL', 'Present', 'Absent', 'Late', 'Unmarked'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                        statusFilter === st 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={holidayInfo?.isHoliday}
                    onClick={() => handleBatchMark('Present')}
                    className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-40"
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    disabled={holidayInfo?.isHoliday}
                    onClick={() => handleBatchMark('Absent')}
                    className="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-40"
                  >
                    All Absent
                  </button>
                </div>
              </div>

            </div>

            {/* Student Roll Call Matrix Table */}
            {isDateLoading ? (
              <div className="p-16 text-center text-slate-400 text-sm flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Synchronizing attendance for {attendanceDate}...
              </div>
            ) : (
              <div className="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-slate-950/60">
                {filteredStudents.length === 0 ? (
                  <div className="p-16 text-center text-slate-500 text-sm">
                    No student records match the active search or status filter.
                  </div>
                ) : (
                  filteredStudents.map(student => {
                    const currentStatus = attendanceRecords[student._id]; // null initially on new dates

                    return (
                      <div 
                        key={student._id} 
                        className="p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Student ID Info */}
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 flex items-center justify-center font-bold text-indigo-400 shadow-sm text-sm">
                            {(student.fullName || student.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-white text-sm sm:text-base leading-snug">
                                {student.fullName || student.name}
                              </h4>
                              {!currentStatus && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                                  Pending
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-xs text-slate-400">
                              {student.registerNo || student.rollNumber || 'No Register ID'}
                            </p>
                          </div>
                        </div>

                        {/* Tri-State Interactive Button Pills */}
                        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 gap-1 w-full sm:w-auto justify-center">
                          <button
                            type="button"
                            disabled={holidayInfo?.isHoliday}
                            onClick={() => handleStatusChange(student._id, 'Present')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              currentStatus === 'Present'
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <CheckCircle2 size={13} /> Present
                          </button>
                          
                          <button
                            type="button"
                            disabled={holidayInfo?.isHoliday}
                            onClick={() => handleStatusChange(student._id, 'Absent')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              currentStatus === 'Absent'
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <XCircle size={13} /> Absent
                          </button>

                          <button
                            type="button"
                            disabled={holidayInfo?.isHoliday}
                            onClick={() => handleStatusChange(student._id, 'Late')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              currentStatus === 'Late'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Clock3 size={13} /> Late
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Bottom Bar: Action Trigger & Validation Alert */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {holidayInfo?.isHoliday ? (
                  <span className="text-amber-400 flex items-center gap-1.5 font-medium">
                    <Palmtree size={14} /> Submissions closed for {holidayInfo.reason}
                  </span>
                ) : !isAllMarked ? (
                  <span className="text-amber-400 flex items-center gap-1.5 font-medium">
                    <AlertCircle size={14} /> {uncompletedCount} student{uncompletedCount > 1 ? 's' : ''} still unmarked
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={14} /> All students marked and ready for submission
                  </span>
                )}
              </div>
              
              <button
                type="button"
                disabled={saving || isDateLoading || !isAllMarked || holidayInfo?.isHoliday}
                onClick={handleSubmitAttendance}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none cursor-pointer text-sm"
              >
                <Save size={17} />
                {saving 
                  ? "Saving to Database..." 
                  : holidayInfo?.isHoliday
                    ? "Holiday — Submissions Closed"
                    : !isAllMarked 
                      ? "Complete Roll Call to Submit" 
                      : isSavedForDate 
                        ? "Update Attendance" 
                        : "Submit Attendance"}
              </button>
            </div>

          </section>
        ) : (
          <div className="bg-slate-900/40 p-16 rounded-[2rem] border border-white/10 text-center space-y-3">
            <BookOpen size={36} className="mx-auto text-slate-600" />
            <h3 className="text-lg font-semibold text-white">No Classes Assigned</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              You do not have any courses or batches assigned yet. Contact the college administrator to allocate your subjects.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default TeacherDashboard;