import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Palmtree,
  CalendarOff,
  X,
  Info,
  Download,
  Unlock,
  Lock
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Formats 'YYYY-MM-DD' into readable 'DD/MM/YYYY' for mobile and desktop displays
const formatDisplayDate = (inputDate) => {
  if (!inputDate) return '';
  const str = String(inputDate).split('T')[0];
  const parts = str.split('-');
  if (parts.length !== 3) return str;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const toStandardDateString = (inputDate) => {
  if (!inputDate) return new Date().toISOString().split('T')[0];
  if (typeof inputDate === 'string' && inputDate.includes('-')) {
    const parts = inputDate.split('-');
    if (parts[0].length === 4) return parts.slice(0, 3).join('-').split('T')[0];
  }
  const d = new Date(inputDate);
  if (isNaN(d.getTime())) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parseDateParts = (dateInput) => {
  const stdDate = toStandardDateString(dateInput);
  const [yearStr, monthStr, dayStr] = stdDate.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const dateObj = new Date(year, month - 1, day);

  return {
    year,
    month: String(month).padStart(2, '0'),
    day: String(day).padStart(2, '0'),
    standardDate: stdDate,
    dateObj
  };
};

const TeacherDashboard = () => {
  const { axios, setToken, setUser } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Dynamic Backend Holidays State
  const [academicHolidays, setAcademicHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);

  // Special Class Override State for Holidays
  const [specialClassUnlocked, setSpecialClassUnlocked] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);

  // Custom Floating Toast Notification State
  const [customToast, setCustomToast] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showCustomToast = useCallback((type, title, message) => {
    setCustomToast({
      visible: true,
      type,
      title,
      message
    });

    const timer = setTimeout(() => {
      setCustomToast(prev => ({ ...prev, visible: false }));
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const storedUserRaw = localStorage.getItem("user");
  const storedUser = storedUserRaw && storedUserRaw !== "undefined" ? JSON.parse(storedUserRaw) : null;
  const teacherId = storedUser?._id || storedUser?.id;

  // 1. Fetch Dynamic Holidays from Database
  const fetchHolidays = useCallback(async () => {
    try {
      setHolidaysLoading(true);
      const res = await axios.get('/api/holidays');
      setAcademicHolidays(res.data?.data || []);
    } catch {
      showCustomToast('error', 'Calendar Sync Warning', 'Unable to sync institutional holiday calendar.');
    } finally {
      setHolidaysLoading(false);
    }
  }, [axios, showCustomToast]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // 2. Detect Teacher Login Action
  useEffect(() => {
    const isJustLoggedIn = 
      location.state?.justLoggedIn || 
      sessionStorage.getItem("faculty_just_logged_in") === "true";

    if (isJustLoggedIn) {
      sessionStorage.removeItem("faculty_just_logged_in");

      showCustomToast(
        'success',
        'Session Authenticated',
        `Welcome to Attendance Terminal, ${storedUser?.name || 'Faculty Member'}!`
      );
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state, storedUser, showCustomToast]);

  // Helper: Determine if a specific standard date string falls within a holiday interval
  const getHolidayForDate = useCallback((targetDateStr) => {
    if (!targetDateStr) return null;
    const { dateObj } = parseDateParts(targetDateStr);
    if (isNaN(dateObj.getTime())) return null;

    // Check Sunday first
    if (dateObj.getDay() === 0) {
      return { isHoliday: true, reason: 'Sunday (Weekly Institutional Off)', type: 'Weekly Off' };
    }

    // Compare against backend records (inclusive date range check)
    const match = academicHolidays.find((h) => {
      const start = toStandardDateString(h.startDate);
      const end = toStandardDateString(h.endDate);
      return targetDateStr >= start && targetDateStr <= end;
    });

    if (match) {
      return {
        isHoliday: true,
        reason: match.title,
        type: match.type || 'Institutional',
        description: match.description
      };
    }

    return { isHoliday: false, reason: null };
  }, [academicHolidays]);

  // 3. Active Date Holiday Calculator (Derived dynamically)
  const holidayInfo = useMemo(() => {
    return getHolidayForDate(toStandardDateString(attendanceDate));
  }, [attendanceDate, getHolidayForDate]);

  // Reset override whenever the selected date changes
  useEffect(() => {
    setSpecialClassUnlocked(false);
  }, [attendanceDate]);

  // 4. Fetch Teacher Assigned Classes
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
        showCustomToast('error', 'Sync Failure', 'Unable to retrieve faculty class matrix.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherClasses();
  }, [axios, teacherId, showCustomToast]);

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

  // 5. Fetch attendance state for active date
  const syncDateAttendance = useCallback(async () => {
    if (!activeAssignment?._id || !attendanceDate) return;

    if (holidayInfo?.isHoliday && !specialClassUnlocked && !isSavedForDate) return;

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
        if (holidayInfo?.isHoliday) {
          setSpecialClassUnlocked(true);
        }
      } else {
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
  }, [axios, activeAssignment, attendanceDate, holidayInfo, specialClassUnlocked, isSavedForDate]);

  useEffect(() => {
    syncDateAttendance();
  }, [syncDateAttendance]);

  // Real-time calculations
  const { stats, uncompletedCount, isAllMarked } = useMemo(() => {
    const total = activeAssignment?.students?.length || 0;
    const isHolidayLocked = holidayInfo?.isHoliday && !specialClassUnlocked;

    if (!total || isHolidayLocked) {
      return { stats: { present: 0, absent: 0, late: 0, rate: 0 }, uncompletedCount: 0, isAllMarked: false };
    }
    
    let present = 0, absent = 0, late = 0, markedCount = 0;
    
    (activeAssignment.students || []).forEach(st => {
      const status = attendanceRecords[st._id];
      if (status === 'Present') { present++; markedCount++; }
      else if (status === 'Absent') { absent++; markedCount++; }
      else if (status === 'Late') { late++; markedCount++; }
    });

    const rate = markedCount > 0 ? Math.round(((present + late * 0.5) / markedCount) * 100) : 0;
    const uncompleted = total - markedCount;
    const allMarked = total > 0 && uncompleted === 0;

    return { stats: { present, absent, late, rate }, uncompletedCount: uncompleted, isAllMarked: allMarked };
  }, [attendanceRecords, activeAssignment, holidayInfo, specialClassUnlocked]);

  const filteredStudents = useMemo(() => {
    const isHolidayLocked = holidayInfo?.isHoliday && !specialClassUnlocked;
    if (!activeAssignment?.students || isHolidayLocked) return [];

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
  }, [activeAssignment, searchQuery, statusFilter, attendanceRecords, holidayInfo, specialClassUnlocked]);

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: newStatus
    }));
  };

  const handleBatchMark = (status) => {
    if (!activeAssignment?.students) return;
    const updated = {};
    activeAssignment.students.forEach(st => {
      updated[st._id] = status;
    });
    setAttendanceRecords(updated);
    showCustomToast('info', 'Batch Updated', `Marked all students as ${status}.`);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    if (setUser) setUser(null);
    delete axios.defaults.headers.common["Authorization"];
    navigate("/", {
      state: {
        loggedOut: true,
        logoutMessage: "You have been securely logged out of the portal."
      }
    });
  };

  // Submit Attendance Handler
  const handleSubmitAttendance = async () => {
    if (!activeAssignment) return;
    
    if (holidayInfo?.isHoliday && !specialClassUnlocked) {
      showCustomToast('warning', 'Holiday Active', 'Please unlock Special Class Session before submitting.');
      return;
    }

    if (!isAllMarked) {
      showCustomToast('error', 'Incomplete Roll Call', `Please assign status for ${uncompletedCount} remaining student(s).`);
      return;
    }
    
    setSaving(true);
    const payload = {
      teacherId,
      assignmentId: activeAssignment._id,
      courseName: activeAssignment.courseName,
      semester: activeAssignment.semester,
      subject: activeAssignment.subject,
      date: attendanceDate,
      isSpecialClass: Boolean(holidayInfo?.isHoliday && specialClassUnlocked),
      records: Object.keys(attendanceRecords).map(stId => ({
        student: stId,
        status: attendanceRecords[stId]
      }))
    };

    try {
      await axios.post('/api/attendance/submit', payload);
      setIsSavedForDate(true);
      showCustomToast(
        'success', 
        'Attendance Recorded', 
        holidayInfo?.isHoliday 
          ? `Special class attendance logged for ${formatDisplayDate(attendanceDate)}!` 
          : `Classroom log saved for ${formatDisplayDate(attendanceDate)}.`
      );
    } catch (err) {
      showCustomToast('error', 'Save Failure', err.response?.data?.message || 'Could not persist attendance to database.');
    } finally {
      setSaving(false);
    }
  };

  // Monthly Attendance PDF Generator using Backend Holiday Database
  const downloadDetailedMonthlyReportPDF = async () => {
    if (!activeAssignment) return;
    setGeneratingReport(true);

    try {
      const { year, month } = parseDateParts(attendanceDate);
      const monthNumber = parseInt(month, 10);
      const totalDaysInMonth = new Date(year, monthNumber, 0).getDate();
      const monthName = new Date(year, monthNumber - 1).toLocaleString('default', { month: 'long' });

      const { data } = await axios.get('/api/attendance/monthly-report', {
        params: {
          assignmentId: activeAssignment._id,
          month,
          year
        }
      });

      const logs = Array.isArray(data.logs) ? data.logs : [];
      if (logs.length === 0) {
        showCustomToast('info', 'No Data Available', `No attendance logs recorded for ${monthName} ${year}.`);
        return;
      }

      const logsByDay = {};
      logs.forEach(log => {
        if (log.date) {
          const dayNum = parseInt(log.date.split('-')[2], 10);
          logsByDay[dayNum] = log;
        }
      });

      // Compute Holidays & Sundays in this month dynamically from academicHolidays state
      let sundaysCount = 0;
      let holidaysCount = 0;
      const holidaysInThisMonth = [];

      for (let d = 1; d <= totalDaysInMonth; d++) {
        const dStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
        const dayCheck = getHolidayForDate(dStr);

        if (new Date(year, monthNumber - 1, d).getDay() === 0) {
          sundaysCount++;
        } else if (dayCheck?.isHoliday) {
          holidaysCount++;
          holidaysInThisMonth.push(`${String(d).padStart(2, '0')} ${monthName.slice(0, 3)}: ${dayCheck.reason}`);
        }
      }

      const totalNonWorkingDays = sundaysCount + holidaysCount;

      const studentMatrix = {};
      activeAssignment.students?.forEach(st => {
        studentMatrix[st._id] = {
          name: st.fullName || st.name || 'Unnamed Student',
          regNo: st.registerNo || st.rollNumber || 'N/A',
          dayStatus: {},
          present: 0,
          absent: 0,
          late: 0,
          totalSessions: logs.length
        };
      });

      logs.forEach(log => {
        const dayNum = parseInt(log.date.split('-')[2], 10);
        log.records?.forEach(rec => {
          const stId = typeof rec.student === 'object' ? rec.student?._id : rec.student;
          if (studentMatrix[stId]) {
            if (rec.status === 'Present') {
              studentMatrix[stId].dayStatus[dayNum] = 'P';
              studentMatrix[stId].present++;
            } else if (rec.status === 'Absent') {
              studentMatrix[stId].dayStatus[dayNum] = 'A';
              studentMatrix[stId].absent++;
            } else if (rec.status === 'Late') {
              studentMatrix[stId].dayStatus[dayNum] = 'L';
              studentMatrix[stId].late++;
            }
          }
        });
      });

      const studentList = Object.values(studentMatrix);
      const totalStudents = studentList.length;
      let aggregatePercentageSum = 0;
      let shortageCount = 0;

      studentList.forEach(st => {
        const pct = Math.round(((st.present + st.late * 0.5) / (logs.length || 1)) * 100);
        aggregatePercentageSum += pct;
        if (pct < 75) shortageCount++;
      });

      const classAverage = totalStudents > 0 ? Math.round(aggregatePercentageSum / totalStudents) : 0;

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Top Primary Navy Header
      doc.setFillColor(30, 27, 75);
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("SUCCESS DEGREE COLLEGE", 14, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(199, 210, 254);
      doc.text("Affiliated to Bidar University, Bidar | Official Academic Roll-Call Register", 14, 17);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(244, 244, 245);
      doc.text(`STATEMENT OF ATTENDANCE — ${monthName.toUpperCase()} ${year}`, 14, 23);

      // Metadata Info Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 30, pageWidth - 28, 14, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.text("DEGREE & TERM:", 17, 34.5);
      doc.text("SUBJECT PAPER:", 85, 34.5);
      doc.text("FACULTY INSTRUCTOR:", 155, 34.5);
      doc.text("CALENDAR SUMMARY:", 225, 34.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`${activeAssignment.courseName} — ${activeAssignment.semester}`, 17, 40);
      doc.text(`${activeAssignment.subject}`, 85, 40);
      doc.text(`${storedUser?.name || 'Faculty Member'} ${storedUser?.employeeId ? `(${storedUser.employeeId})` : ''}`, 155, 40);
      doc.text(`Classes Taken: ${logs.length} | Total Days: ${totalDaysInMonth}`, 225, 40);

      // Badges
      const badgeY = 46.5;
      const boxHeight = 6.5;
      const totalWidth = pageWidth - 28;
      const gap = 3;
      const cardW = (totalWidth - (gap * 4)) / 5;

      // 1. Sessions Held
      doc.setFillColor(238, 242, 255);
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(14, badgeY, cardW, boxHeight, 1.2, 1.2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(67, 56, 202);
      doc.text(`Sessions Held: ${logs.length} Days`, 14 + (cardW / 2), badgeY + 4.3, { align: 'center' });

      // 2. Sundays
      const x2 = 14 + cardW + gap;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(x2, badgeY, cardW, boxHeight, 1.2, 1.2, 'FD');
      doc.setTextColor(71, 85, 105);
      doc.text(`Sundays (Off): ${sundaysCount} Days`, x2 + (cardW / 2), badgeY + 4.3, { align: 'center' });

      // 3. Total Non-Working Days & Gazetted Holidays
      const x3 = x2 + cardW + gap;
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(251, 191, 36);
      doc.roundedRect(x3, badgeY, cardW, boxHeight, 1.2, 1.2, 'FD');
      doc.setTextColor(180, 83, 9);
      doc.text(`Total Holidays: ${totalNonWorkingDays} (${holidaysCount} Listed)`, x3 + (cardW / 2), badgeY + 4.3, { align: 'center' });

      // 4. Batch Average
      const x4 = x3 + cardW + gap;
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(x4, badgeY, cardW, boxHeight, 1.2, 1.2, 'FD');
      doc.setTextColor(5, 150, 105);
      doc.text(`Batch Average: ${classAverage}%`, x4 + (cardW / 2), badgeY + 4.3, { align: 'center' });

      // 5. Shortage Defaulters
      const x5 = x4 + cardW + gap;
      doc.setFillColor(255, 241, 242);
      doc.setDrawColor(254, 205, 211);
      doc.roundedRect(x5, badgeY, cardW, boxHeight, 1.2, 1.2, 'FD');
      doc.setTextColor(225, 29, 72);
      doc.text(`Shortage (<75%): ${shortageCount} Students`, x5 + (cardW / 2), badgeY + 4.3, { align: 'center' });

      // Legend Line
      const legendY = 57.5;
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text("Legend:", 14, legendY);

      doc.setFillColor(16, 185, 129);
      doc.rect(26, legendY - 2.5, 3.2, 3, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.text("P: Present", 31, legendY);

      doc.setFillColor(244, 63, 94);
      doc.rect(48, legendY - 2.5, 3.2, 3, 'F');
      doc.text("A: Absent", 53, legendY);

      doc.setFillColor(245, 158, 11);
      doc.rect(70, legendY - 2.5, 3.2, 3, 'F');
      doc.text("L: Late (0.5)", 75, legendY);

      doc.setFillColor(226, 232, 240);
      doc.rect(94, legendY - 2.5, 3.2, 3, 'F');
      doc.text("Sun: Weekly Off", 99, legendY);

      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(217, 119, 6);
      doc.rect(124, legendY - 2.5, 3.2, 3, 'FD');
      const holidaySummary = holidaysInThisMonth.length > 0
        ? `H: Holiday (${holidaysInThisMonth[0]}${holidaysInThisMonth.length > 1 ? ` +${holidaysInThisMonth.length - 1} more` : ''})`
        : "H: Institutional Holiday";
      doc.text(holidaySummary, 129, legendY);

      const dayHeaders = [];
      for (let d = 1; d <= totalDaysInMonth; d++) {
        dayHeaders.push(String(d));
      }

      const tableHead = [
        [
          { content: "#", rowSpan: 1 },
          { content: "Reg No", rowSpan: 1 },
          { content: "Student Name", rowSpan: 1 },
          ...dayHeaders.map(d => ({ content: d, styles: { halign: 'center' } })),
          { content: "P", styles: { halign: 'center', fillColor: [16, 185, 129] } },
          { content: "A", styles: { halign: 'center', fillColor: [244, 63, 94] } },
          { content: "L", styles: { halign: 'center', fillColor: [245, 158, 11] } },
          { content: "%", styles: { halign: 'center', fillColor: [79, 70, 229] } }
        ]
      ];

      const tableBody = studentList.map((st, idx) => {
        const percentage = Math.round(((st.present + st.late * 0.5) / (logs.length || 1)) * 100);
        
        const dayCells = [];
        for (let d = 1; d <= totalDaysInMonth; d++) {
          const dStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
          const dayHoliday = getHolidayForDate(dStr);
          const dObj = new Date(year, monthNumber - 1, d);
          
          let cellValue = st.dayStatus[d];
          if (!cellValue) {
            if (dObj.getDay() === 0) {
              cellValue = 'Sun';
            } else if (dayHoliday?.isHoliday) {
              cellValue = 'H';
            } else if (logsByDay[d]) {
              cellValue = '-';
            } else {
              cellValue = '';
            }
          }
          dayCells.push(cellValue);
        }

        return [
          idx + 1,
          st.regNo,
          st.name,
          ...dayCells,
          st.present,
          st.absent,
          st.late,
          `${percentage}%`
        ];
      });

      autoTable(doc, {
        startY: 61,
        head: tableHead,
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [67, 56, 202],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 6.5,
          cellPadding: 1.2
        },
        styles: {
          fontSize: 6.5,
          cellPadding: 0.9,
          valign: 'middle',
          textColor: [30, 41, 59]
        },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: 20, fontStyle: 'bold' },
          2: { cellWidth: 38 },
          [totalDaysInMonth + 3]: { cellWidth: 7, halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105] },
          [totalDaysInMonth + 4]: { cellWidth: 7, halign: 'center', fontStyle: 'bold', textColor: [225, 29, 72] },
          [totalDaysInMonth + 5]: { cellWidth: 7, halign: 'center', fontStyle: 'bold', textColor: [217, 119, 6] },
          [totalDaysInMonth + 6]: { cellWidth: 11, halign: 'center', fontStyle: 'bold' }
        },
        didParseCell: function (data) {
          if (data.section === 'body') {
            const rawVal = data.cell.raw;
            if (rawVal === 'A') {
              data.cell.styles.textColor = [225, 29, 72];
              data.cell.styles.fillColor = [255, 241, 242];
              data.cell.styles.fontStyle = 'bold';
            } else if (rawVal === 'P') {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fillColor = [236, 253, 245];
              data.cell.styles.fontStyle = 'bold';
            } else if (rawVal === 'L') {
              data.cell.styles.textColor = [217, 119, 6];
              data.cell.styles.fillColor = [254, 243, 199];
              data.cell.styles.fontStyle = 'bold';
            } else if (rawVal === 'Sun') {
              data.cell.styles.textColor = [148, 163, 184];
              data.cell.styles.fillColor = [241, 245, 249];
            } else if (rawVal === 'H') {
              data.cell.styles.textColor = [180, 83, 9];
              data.cell.styles.fillColor = [254, 243, 199];
              data.cell.styles.fontStyle = 'bold';
            }

            if (data.column.index === totalDaysInMonth + 6) {
              const pctNum = parseInt(rawVal, 10);
              if (!isNaN(pctNum) && pctNum < 75) {
                data.cell.styles.textColor = [225, 29, 72];
                data.cell.styles.fillColor = [254, 226, 226];
                data.cell.styles.fontStyle = 'bold';
              } else {
                data.cell.styles.textColor = [5, 150, 105];
                data.cell.styles.fillColor = [236, 253, 245];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        },
        margin: { left: 14, right: 14, bottom: 28 }
      });

      // Signature Blocks
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        if (i === totalPages) {
          const signY = pageHeight - 16;
          doc.setDrawColor(148, 163, 184);
          doc.setLineWidth(0.4);

          // 1. Faculty
          doc.line(18, signY, 78, signY);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text("Signature of Faculty In-Charge", 18, signY + 4);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`Prof. ${storedUser?.name || 'Faculty Member'}`, 18, signY + 7.5);

          // 2. HOD
          const midX = (pageWidth / 2) - 30;
          doc.line(midX, signY, midX + 60, signY);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text("Verified by Head of Department", midX, signY + 4);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text("Department Seal & Sign", midX, signY + 7.5);

          // 3. Principal
          const rightX = pageWidth - 78;
          doc.line(rightX, signY, rightX + 60, signY);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text("Principal / Head of Institution", rightX, signY + 4);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text("Success Degree College", rightX, signY + 7.5);
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 26, pageHeight - 5);
      }

      const safeSubject = activeAssignment.subject.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Attendance_Register_${safeSubject}_${monthName}_${year}.pdf`);
      showCustomToast('success', 'Detailed Register Exported', `Downloaded complete roll register for ${monthName} ${year}.`);
    } catch (err) {
      console.error("Detailed PDF Generation Error:", err);
      showCustomToast('error', 'Export Failed', err.message || 'Unable to build detailed attendance register.');
    } finally {
      setGeneratingReport(false);
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

  const isHolidayLocked = holidayInfo?.isHoliday && !specialClassUnlocked;

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 p-4 md:p-8 flex justify-center selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Floating Custom Toast */}
      {customToast.visible && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full animate-fadeIn transition-all">
          <div className={`p-4 rounded-2xl backdrop-blur-2xl border shadow-2xl flex items-start gap-3.5 ${
            customToast.type === 'success' 
              ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10' 
              : customToast.type === 'warning'
                ? 'bg-slate-900/95 border-amber-500/40 text-amber-300 shadow-amber-500/10'
                : customToast.type === 'info'
                  ? 'bg-slate-900/95 border-indigo-500/40 text-indigo-300 shadow-indigo-500/10'
                  : 'bg-slate-900/95 border-rose-500/40 text-rose-300 shadow-rose-500/10'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              customToast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : customToast.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : customToast.type === 'info' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {customToast.type === 'success' && <CheckCircle2 size={19} />}
              {customToast.type === 'warning' && <AlertCircle size={19} />}
              {customToast.type === 'info' && <Info size={19} />}
              {customToast.type === 'error' && <XCircle size={19} />}
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

      <div className="w-full max-w-7xl space-y-6">

        {/* Navigation Header */}
        <header className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-5 md:p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-13 h-13 rounded-2xl bg-linear-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white border border-white/20">
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
            {/* Mobile-Friendly Formatted Date Picker with native calendar overlay */}
            <div className="relative flex items-center gap-2.5 bg-slate-950/80 border border-white/10 px-4 py-2 rounded-2xl text-xs md:text-sm shadow-inner hover:border-white/20 transition-colors">
              <Calendar size={15} className="text-indigo-400 shrink-0" />
              <span className="text-white font-medium tracking-wide">
                {formatDisplayDate(attendanceDate)}
              </span>
              <input
                type="date"
                value={toStandardDateString(attendanceDate)}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            {/* Holiday Schedule Modal Trigger */}
            <button
              onClick={() => setIsHolidayModalOpen(true)}
              title="View Academic Holiday Calendar"
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <Palmtree size={14} />
              <span>Holidays ({academicHolidays.length})</span>
            </button>

            {/* Detailed Monthly Report PDF Export */}
            <button
              onClick={downloadDetailedMonthlyReportPDF}
              disabled={generatingReport || !activeAssignment}
              title="Download Detailed Attendance Register (PDF)"
              className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              <span>{generatingReport ? "Generating..." : "Register PDF"}</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 rounded-2xl text-xs font-bold transition-all cursor-pointer hover:shadow-lg hover:shadow-rose-500/10"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </header>

        {/* Holiday Notification Banner with Extra Class Unlock Toggle */}
        {holidayInfo?.isHoliday && (
          <div className="bg-linear-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-amber-300 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-md">
                <Palmtree size={24} className="text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-base text-white">Institutional Holiday Notice</h4>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    {formatDisplayDate(attendanceDate)}
                  </span>
                </div>
                <p className="text-xs text-amber-300/90 mt-0.5">
                  {holidayInfo.reason} &bull; Conducting an extra/compensatory lecture today? Unlock the roll-call session below.
                </p>
              </div>
            </div>

            {/* Special Class Session Toggle Button */}
            <button
              onClick={() => {
                const nextState = !specialClassUnlocked;
                setSpecialClassUnlocked(nextState);
                if (nextState) {
                  showCustomToast('info', 'Special Session Active', 'Compensatory class roll-call unlocked for marking.');
                }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                specialClassUnlocked
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40'
              }`}
            >
              {specialClassUnlocked ? <Lock size={14} /> : <Unlock size={14} />}
              <span>{specialClassUnlocked ? "Special Class Unlocked (Lock)" : "Take Class Today (Unlock)"}</span>
            </button>
          </div>
        )}

        {/* Course & Semester Filter Canvas */}
        <section className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden">
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
                            ? 'bg-linear-to-r from-indigo-600 to-violet-600 text-white border-indigo-500/60 shadow-lg shadow-indigo-500/20 ring-1 ring-white/20'
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
                            ? 'bg-linear-to-r from-indigo-600 to-violet-600 text-white border-indigo-500/60 shadow-lg shadow-indigo-500/20 ring-1 ring-white/20'
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

        {/* Main Attendance Station */}
        {activeAssignment ? (
          <section className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            
            {/* Header with Stats Counter & Status */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                    {activeAssignment.courseName} • {activeAssignment.semester}
                  </span>
                  {holidayInfo?.isHoliday ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                      <Palmtree size={12} /> {specialClassUnlocked ? `Special Session (${holidayInfo.reason})` : `Holiday: ${holidayInfo.reason}`}
                    </span>
                  ) : isSavedForDate ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                      <Check size={12} /> Saved for {formatDisplayDate(attendanceDate)}
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
              {!isHolidayLocked && (
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
              )}
            </div>

            {/* Condition A: Holiday Locked */}
            {isHolidayLocked ? (
              <div className="py-14 px-6 rounded-3xl bg-linear-to-b from-amber-500/10 via-slate-950/40 to-slate-950/80 border border-amber-500/20 text-center flex flex-col items-center justify-center space-y-4 shadow-inner">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
                  <Palmtree size={32} />
                </div>
                
                <div className="space-y-1.5 max-w-lg">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold">
                    <CalendarOff size={13} /> Institutional Holiday Active
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    {holidayInfo.reason}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Classroom roll-call operations are paused for holidays. If you are conducting a special, practical, or revision class today, click below to unlock the attendance register.
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => {
                      setSpecialClassUnlocked(true);
                      showCustomToast('info', 'Session Unlocked', 'Compensatory class attendance enabled.');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Unlock size={15} />
                    <span>Conduct Special Class Session</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Condition B: Active Working Day or Unlocked Special Session */
              <>
                {/* Search & Batch Action Bar */}
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
                        onClick={() => handleBatchMark('Present')}
                        className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        All Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchMark('Absent')}
                        className="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        All Absent
                      </button>
                    </div>
                  </div>
                </div>

                {/* Student Roll Call Table */}
                {isDateLoading ? (
                  <div className="p-16 text-center text-slate-400 text-sm flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Synchronizing attendance for {formatDisplayDate(attendanceDate)}...
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-slate-950/60">
                    {filteredStudents.length === 0 ? (
                      <div className="p-16 text-center text-slate-500 text-sm">
                        No student records match the active search or status filter.
                      </div>
                    ) : (
                      filteredStudents.map(student => {
                        const currentStatus = attendanceRecords[student._id];

                        return (
                          <div 
                            key={student._id} 
                            className="p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/2 transition-colors"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-800 to-slate-700 border border-white/10 flex items-center justify-center font-bold text-indigo-400 shadow-sm text-sm">
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

                            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 gap-1 w-full sm:w-auto justify-center">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student._id, 'Present')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  currentStatus === 'Present'
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <CheckCircle2 size={13} /> Present
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student._id, 'Absent')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  currentStatus === 'Absent'
                                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <XCircle size={13} /> Absent
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStatusChange(student._id, 'Late')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                    {!isAllMarked ? (
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
                    disabled={saving || isDateLoading || !isAllMarked}
                    onClick={handleSubmitAttendance}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none cursor-pointer text-sm"
                  >
                    <Save size={17} />
                    {saving 
                      ? "Saving to Database..." 
                      : !isAllMarked 
                        ? "Complete Roll Call to Submit" 
                        : isSavedForDate 
                          ? "Update Attendance" 
                          : "Submit Attendance"}
                  </button>
                </div>
              </>
            )}

          </section>
        ) : (
          <div className="bg-slate-900/40 p-16 rounded-3xl border border-white/10 text-center space-y-3">
            <BookOpen size={36} className="mx-auto text-slate-600" />
            <h3 className="text-lg font-semibold text-white">No Classes Assigned</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              You do not have any courses or batches assigned yet. Contact the college administrator to allocate your subjects.
            </p>
          </div>
        )}

        {/* MODAL: Dynamic Academic Holiday Calendar from Database */}
        {isHolidayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[85vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Palmtree size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Academic Holiday Schedule</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                        {academicHolidays.length} Records
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Institutional & Gazetted non-instructional days configured in system database.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Holiday Items Grid / List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {holidaysLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-mono">
                    Synchronizing holiday records...
                  </div>
                ) : academicHolidays.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No academic holidays currently scheduled in the portal.
                  </div>
                ) : (
                  academicHolidays.map((holiday) => {
                    const startStd = toStandardDateString(holiday.startDate);
                    const endStd = toStandardDateString(holiday.endDate);
                    const isSelectedDate = attendanceDate >= startStd && attendanceDate <= endStd;

                    const startFormatted = formatDisplayDate(startStd);
                    const endFormatted = formatDisplayDate(endStd);
                    const isSingleDay = startStd === endStd;

                    const { month, day } = parseDateParts(startStd);
                    const monthShort = new Date(2026, parseInt(month, 10) - 1, parseInt(day, 10)).toLocaleString('default', { month: 'short' });

                    return (
                      <div 
                        key={holiday._id || `${startStd}-${holiday.title}`}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                          isSelectedDate 
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 shadow-md shadow-amber-500/10' 
                            : 'bg-slate-950/60 border-white/5 text-slate-300 hover:bg-slate-950/80 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-10 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center font-bold">
                            <span className="text-[9px] uppercase tracking-wider text-amber-400 leading-none">{monthShort}</span>
                            <span className="text-sm text-white font-mono leading-tight">{day}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{holiday.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {startFormatted}{!isSingleDay && ` to ${endFormatted}`}
                            </span>
                            {holiday.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{holiday.description}</p>
                            )}
                          </div>
                        </div>

                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-medium whitespace-nowrap">
                          {holiday.type || 'Off'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>* Faculty may unlock sessions on holidays for compensatory classes.</span>
                <button
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TeacherDashboard;