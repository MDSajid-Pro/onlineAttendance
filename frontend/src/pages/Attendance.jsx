import React, { useState, useEffect } from 'react';
import { Search, Loader2, Save, UserCheck, UserX, Download, CalendarOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Attendance = () => {
  const { axios, token } = useAppContext();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [course, setCourse] = useState('B.Sc');
  const [semester, setSemester] = useState('1st Semester');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayReason, setHolidayReason] = useState(""); // State for the holiday name

  // --- FETCH & MERGE DATA ---
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        const studentRes = await axios.get(`/api/students/filter`, {
          params: { course, semester },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const historyRes = await axios.get(`/api/attendance/history`, {
          params: { date: selectedDate, course, semester },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const history = historyRes.data || {};
        setIsHoliday(history.isHoliday || false);
        setHolidayReason(history.holidayReason || "");

        const existingRecords = history.records || [];
        const mergedData = studentRes.data.map(student => {
          const record = existingRecords.find(r => r.studentId === student._id);
          return {
            ...student,
            status: record ? record.status : null 
          };
        });

        setStudents(mergedData);
      } catch (error) {
        console.error("Error syncing data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [course, semester, selectedDate, axios, token]);


  const toggleStatus = (id, status) => {
    if(isHoliday) return;
    setStudents(prev => prev.map(s => s._id === id ? { ...s, status } : s));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const payload = {
      date: selectedDate,
      course,
      semester,
      isHoliday,
      holidayReason: isHoliday ? holidayReason : "", // Save the reason
      attendanceRecords: isHoliday ? [] : students.filter(s => s.status !== null)
    };

    try {
      await axios.post('/api/attendance/save', payload);
      alert(isHoliday ? "Holiday saved!" : "Attendance synced!");
    } catch (error) {
      alert("Failed to save.");
    }
  };

  const downloadMonthlyReport = async () => {
  try {
    const [year, month] = selectedDate.split('-');
    const res = await axios.get(`/api/attendance/report/monthly`, {
      params: { month, year, course, semester }
    });

    const studentsData = res.data;
    if (!studentsData || studentsData.length === 0) return alert("No data found.");

    // We assume your backend returns a 'holidays' object or array in the response
    // e.g., res.data.holidays = { "2024-03-15": "Holi", "2024-03-29": "Good Friday" }
    const monthlyHolidays = res.data.holidays || {}; 

    const daysInMonth = new Date(year, month, 0).getDate();
    const doc = new jsPDF('landscape'); 
    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(20, 33, 61);
    doc.text("SUCCESS DEGREE COLLEGE", 148, 15, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Monthly Attendance Report | ${course} | Sem: ${semester} | ${monthName} ${year}`, 148, 22, { align: "center" });
    doc.line(14, 26, 283, 26);

    // --- Table Data ---
    const tableHeaders = ["Roll", "Name", ...Array.from({length: daysInMonth}, (_, i) => (i + 1).toString()), "Total"];
    const tableRows = studentsData.map(s => {
      const row = [s.registerNo, s.fullName];
      for (let i = 1; i <= daysInMonth; i++) {
        const dateKey = `${year}-${month.padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        const dayOfWeek = new Date(year, month - 1, i).getDay();
        
        if (dayOfWeek === 0) {
          row.push('SUN');
        } else if (monthlyHolidays[dateKey]) {
          row.push('HOL'); // Marked as holiday in backend
        } else {
          const status = s.attendance[dateKey];
          row.push(status === 'present' ? 'P' : status === 'absent' ? 'A' : '-');
        }
      }
      row.push(s.totalPresent);
      return row;
    });

    autoTable(doc, {
      startY: 32,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 6.5, cellPadding: 0.5, halign: 'center' },
      headStyles: { fillColor: [20, 33, 61] },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const val = data.cell.text[0];
          if (val === 'SUN') data.cell.styles.fillColor = [255, 235, 235];
          if (val === 'HOL') data.cell.styles.fillColor = [235, 255, 235];
        }
      }
    });

    // --- DYNAMIC HOLIDAY REASONS DISPLAY ---
    let currentY = doc.lastAutoTable.finalY + 10;
    const holidayEntries = Object.entries(monthlyHolidays);

    if (holidayEntries.length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Holiday Details:", 14, currentY);
      currentY += 5;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      
      holidayEntries.forEach(([date, reason]) => {
        const formattedDate = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        doc.text(`• ${formattedDate}: ${reason}`, 14, currentY);
        currentY += 5;
      });
    }

    doc.save(`Attendance_${course}_${monthName}_${year}.pdf`);
  } catch (error) {
    console.error("PDF Error:", error);
  }
};

  const filteredStudents = students.filter(s => {
    const name = s.fullName || "";
    const roll = s.registerNo || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || roll.toString().includes(searchTerm);
  });

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Attendance Tracker
            </h1>
            <p className="text-slate-400 text-sm">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <button onClick={downloadMonthlyReport} className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-5 py-2.5 rounded-2xl transition-all font-semibold">
            <Download size={18} /> Export PDF Report
          </button>
        </div>

        {/* --- FILTERS & HOLIDAY TOGGLE --- */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-xl">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 ml-2">COURSE</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} className="bg-slate-900 border-none rounded-2xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>B.Sc</option><option>B.A</option><option>B.Com</option><option>BCA</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 ml-2">SEMESTER</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="bg-slate-900 border-none rounded-2xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>1st Semester</option><option>2nd Semester</option><option>3rd Semester</option>
              <option>4th Semester</option><option>5th Semester</option><option>6th Semester</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 ml-2">DATE</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-indigo-600 font-medium rounded-2xl px-4 py-2.5 outline-none" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 ml-2">DAY TYPE</label>
            <button 
              onClick={() => setIsHoliday(!isHoliday)}
              className={`flex items-center justify-center gap-2 h-11 rounded-2xl border transition-all ${isHoliday ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-slate-900 border-white/10 text-slate-400'}`}
            >
              <CalendarOff size={18} /> {isHoliday ? "Holiday" : "Working Day"}
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 ml-2">SEARCH</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-500" size={18} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-900 w-full pl-10 pr-4 py-2.5 rounded-2xl border-none outline-none" />
            </div>
          </div>
        </div>

        {/* --- HOLIDAY REASON INPUT (Only shows if isHoliday is true) --- */}
        {isHoliday && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-3xl flex flex-col md:flex-row items-center gap-4 animate-in fade-in zoom-in duration-300">
            <p className="text-amber-500 font-semibold whitespace-nowrap">Reason for Holiday:</p>
            <input 
              type="text" 
              placeholder="e.g. Sunday, Gandhi Jayanti, Summer Vacation..." 
              value={holidayReason}
              onChange={(e) => setHolidayReason(e.target.value)}
              className="w-full bg-slate-900 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none text-amber-500 placeholder:text-amber-500/30"
            />
          </div>
        )}

        {/* --- TABLE --- */}
        <div className="bg-white/5 rounded-4xl border border-white/10 overflow-hidden backdrop-blur-md">
          {isHoliday ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
              <div className="p-4 bg-amber-500/10 rounded-full text-amber-500">
                <CalendarOff size={48} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-500">{holidayReason || "General Holiday"}</h3>
                <p className="text-slate-400">Attendance records are disabled for this date.</p>
              </div>
            </div>
          ) : (
             loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-indigo-500" size={40} /><p className="text-slate-400 font-medium">Syncing...</p></div>
              ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-[0.2em]">
                          <th className="px-8 py-5">Roll No</th>
                          <th className="px-8 py-5">Student</th>
                          <th className="px-8 py-5 text-center">Mark Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredStudents.map((student) => (
                          <tr key={student._id} className="hover:bg-white/3 transition-colors">
                            <td className="px-8 py-5 font-mono text-indigo-400">{student.registerNo}</td>
                            <td className="px-8 py-5 font-semibold text-white">{student.fullName}</td>
                            <td className="px-8 py-5">
                              <div className="flex justify-center gap-4">
                                <button onClick={() => toggleStatus(student._id, 'present')} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${student.status === 'present' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'border-white/10 text-slate-400 hover:border-emerald-500'}`}><UserCheck size={18} /> <span className="text-sm font-bold">Present</span></button>
                                <button onClick={() => toggleStatus(student._id, 'absent')} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${student.status === 'absent' ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'border-white/10 text-slate-400 hover:border-rose-500'}`}><UserX size={18} /> <span className="text-sm font-bold">Absent</span></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              )
          )}

          {/* --- FOOTER --- */}
          <div className="p-8 bg-white/2 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              {!isHoliday ? (
                <>
                  <div className="flex gap-6 text-sm">
                    <span className="text-emerald-400 font-bold uppercase">Present: {students.filter(s => s.status === 'present').length}</span>
                    <span className="text-rose-400 font-bold uppercase">Absent: {students.filter(s => s.status === 'absent').length}</span>
                  </div>
                  <button onClick={handleSave} className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-4 rounded-2xl font-bold shadow-xl transition-all"><Save size={20} /> Sync Attendance</button>
                </>
              ) : (
                <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-2xl font-bold shadow-xl transition-all"><Save size={20} /> Save Holiday ({holidayReason || "General"})</button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;