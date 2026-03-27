import React, { useState, useEffect } from 'react';
import { Search, Loader2, Save, UserCheck, UserX } from 'lucide-react';
import { useAppContext } from '../context/AppContext'; 

const Attendance = () => {
  const { axios, token } = useAppContext();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- FETCH & MERGE DATA ---
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        // 1. Fetch the Master Student List for this Course/Sem
        const studentRes = await axios.get(`/api/students/filter`, {
          params: { course, semester },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        // 2. Check if attendance already exists for this specific Date/Course/Sem
        const historyRes = await axios.get(`/api/attendance/history`, {
          params: { date: selectedDate, course, semester },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const existingRecords = historyRes.data?.records || [];

        // 3. Merge: If student exists in 'history', use that status. Otherwise, null.
        const mergedData = studentRes.data.map(student => {
          const record = existingRecords.find(r => r.studentId === student._id);
          return {
            ...student,
            status: record ? record.status : null 
          };
        });

        setStudents(mergedData);
      } catch (error) {
        console.error("Error syncing attendance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [course, semester, selectedDate, axios, token]);

  // --- HANDLERS ---
  const toggleStatus = (id, status) => {
    // We use _id because that is what MongoDB provides
    setStudents(prev => prev.map(s => s._id === id ? { ...s, status } : s));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    
    // Filter out students who haven't been marked yet
    const markedRecords = students.filter(s => s.status !== null);
    
    if (markedRecords.length === 0) {
      alert("Please mark at least one student before saving.");
      return;
    }

    try {
      const payload = {
        date: selectedDate,
        course,
        semester,
        attendanceRecords: markedRecords
      };

      await axios.post('/api/attendance/save', payload);
      alert("Attendance synced successfully!");
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save attendance.");
    }
  };

  const filteredStudents = students.filter(s => {
    const name = s.fullName || "";
    const roll = s.registerNo || "";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      roll.toString().includes(searchTerm)
    );
  });

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Attendance Tracker
          </h1>
          <p className="text-slate-400 text-sm">Managing records for {course} - {semester}</p>
        </div>

        {/* --- FILTERS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-xl">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 ml-2">COURSE</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} className="bg-slate-900 border-none rounded-2xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
              <option>B.Sc</option><option>B.A</option><option>BCA</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 ml-2">SEMESTER</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="bg-slate-900 border-none rounded-2xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
              <option>1st Semester</option><option>2nd Semester</option>
              <option>3rd Semester</option><option>4th Semester</option>
              <option>5th Semester</option><option>6th Semester</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 ml-2">DATE</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-indigo-600 font-medium rounded-2xl px-4 py-2.5 outline-none hover:bg-indigo-500 cursor-pointer" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 ml-2">SEARCH</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-500" size={18} />
              <input type="text" placeholder="Name or Roll..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-900 w-full pl-10 pr-4 py-2.5 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white/5 rounded-4xl border border-white/10 overflow-hidden backdrop-blur-md shadow-2xl">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-indigo-500" size={40} />
              <p className="text-slate-400 font-medium">Syncing records...</p>
            </div>
          ) : (
            <>
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
                      <tr key={student._id} className="hover:bg-white/3 transition-colors group">
                        <td className="px-8 py-5 font-mono text-indigo-400">{student.registerNo}</td>
                        <td className="px-8 py-5">
                          <div className="font-semibold text-white">{student.fullName}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center gap-4">
                            <button 
                              onClick={() => toggleStatus(student._id, 'present')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer ${student.status === 'present' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'border-white/10 text-slate-400 hover:border-emerald-500/50'}`}
                            >
                              <UserCheck size={18} /> <span className="text-sm font-bold">Present</span>
                            </button>
                            <button 
                              onClick={() => toggleStatus(student._id, 'absent')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer ${student.status === 'absent' ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'border-white/10 text-slate-400 hover:border-rose-500/50'}`}
                            >
                              <UserX size={18} /> <span className="text-sm font-bold">Absent</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* --- FOOTER ACTIONS --- */}
              <div className="p-8 bg-white/2 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-6 text-sm">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider">Present: {students.filter(s => s.status === 'present').length}</span>
                  <span className="text-rose-400 font-bold uppercase tracking-wider">Absent: {students.filter(s => s.status === 'absent').length}</span>
                </div>
                <button onClick={handleSave} className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 cursor-pointer">
                  <Save size={20} /> Sync Attendance
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;