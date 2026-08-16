import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { 
  UserCheck, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  Search, 
  CheckSquare, 
  Square, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Users,
  Sparkles,
  ArrowRight,
  Filter,
  Check
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

const AssignStudents = () => {
  const { axios } = useAppContext();
  
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [courseName, setCourseName] = useState('B.Sc');
  const [semester, setSemester] = useState('1st Semester');
  const [subject, setSubject] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiMessage, setUiMessage] = useState({ type: '', text: '' });

  // 1. Fetch Teachers and Students Concurrently
  useEffect(() => {
    const fetchRequiredData = async () => {
      try {
        setLoading(true);
        const [teachersRes, studentsRes] = await Promise.all([
          axios.get('/api/teacher'),
          axios.get('/api/students/all')
        ]);

        setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data.teachers || []);
        setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data.students || []);
      } catch (err) {
        setUiMessage({ 
          type: 'error', 
          text: `Core Fetch Failure: ${err.response?.data?.message || 'Unable to load instructor/student records.'}` 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequiredData();
  }, [axios]);

  // 2. Dynamic Filtering based on selected course, semester, and search
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const studentCourse = (st.course || st.courseName || '').trim();
      const studentSemester = (st.semester || st.currentSemester || '').trim();

      const matchesCourse = courseName ? studentCourse.toLowerCase() === courseName.toLowerCase() : true;
      const matchesSemester = semester ? studentSemester.toLowerCase() === semester.toLowerCase() : true;

      const name = (st.fullName || st.name || '').toLowerCase();
      const regNo = (st.registerNo || st.rollNumber || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || regNo.includes(searchQuery.toLowerCase());

      return matchesCourse && matchesSemester && matchesSearch;
    });
  }, [students, courseName, semester, searchQuery]);

  const teacherDetails = useMemo(() => {
    return teachers.find(t => t._id === selectedTeacher);
  }, [teachers, selectedTeacher]);

  const handleStudentCheckbox = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map(s => s._id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedStudents.includes(id));

    if (allSelected) {
      setSelectedStudents(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedStudents, ...filteredIds]));
      setSelectedStudents(merged);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTeacher) {
      setUiMessage({ type: 'error', text: 'Please select a faculty instructor.' });
      return;
    }

    if (selectedStudents.length === 0) {
      setUiMessage({ type: 'error', text: 'Please select at least one student before creating the allocation link.' });
      return;
    }

    const payload = { 
      teacherId: selectedTeacher, 
      courseName,
      semester,
      subject: subject.trim(), 
      studentIds: selectedStudents 
    };
    
    try {
      setIsSubmitting(true);
      setUiMessage({ type: 'loading', text: 'Registering classroom allocation matrix...' });
      
      const response = await axios.post('/api/teacher/assign', payload);
      
      if (response.status === 200 || response.status === 201 || response.data?.success) {
        setUiMessage({ type: 'success', text: `Allocated ${selectedStudents.length} students to ${teacherDetails?.name || 'Faculty'} successfully!` });
        setSelectedStudents([]);
        setSubject('');
      }
    } catch (err) {
      setUiMessage({ 
        type: 'error', 
        text: `Assignment Error: ${err.response?.data?.message || err.message}` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Synchronizing Matrix Profiles...</p>
        </div>
      </div>
    );
  }

  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s._id));

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-7xl space-y-6">
        
        {/* Top Floating Glass Header */}
        <header className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="space-y-1 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={13} /> Class Allocation Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Classroom & Student Allocation
            </h1>
            <p className="text-slate-400 text-sm">
              Link faculty members with courses, semesters, and active student rosters for streamlined attendance.
            </p>
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="flex items-center gap-3 bg-slate-950/80 border border-white/10 px-5 py-3.5 rounded-2xl shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Total Selected</p>
                <p className="text-xl font-extrabold text-white leading-tight">{selectedStudents.length} <span className="text-xs font-normal text-slate-400">Students</span></p>
              </div>
            </div>
          </div>
        </header>

        {/* Alert Feedback Banner */}
        {uiMessage.text && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border transition-all ${
            uiMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
            uiMessage.type === 'loading' ? 'bg-teal-500/10 text-teal-300 border-teal-500/20' : 
            'bg-rose-500/10 text-rose-300 border-rose-500/20'
          }`}>
            {uiMessage.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
            {uiMessage.type === 'error' && <AlertCircle size={18} className="text-rose-400 shrink-0" />}
            {uiMessage.type === 'loading' && <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0" />}
            <span>{uiMessage.text}</span>
          </div>
        )}

        {/* Two-Column Working Canvas */}
        <form onSubmit={handleAssignSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Academic Configuration Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Filter size={16} className="text-teal-400" /> Allocation Configuration
              </h2>

              {/* Faculty Instructor */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-teal-400" /> Faculty Teacher
                </label>
                <select 
                  value={selectedTeacher} 
                  onChange={e => setSelectedTeacher(e.target.value)} 
                  required
                  className="w-full px-4 py-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer transition-all text-sm"
                >
                  <option value="" className="bg-slate-900">-- Choose Faculty Instructor --</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id} className="bg-slate-900 text-white">
                      {t.name} {t.employeeId ? `(${t.employeeId})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Course Pill Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-teal-400" /> Degree / Stream
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COURSES.map(c => {
                    const isSelected = courseName === c;
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setCourseName(c)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-md shadow-teal-500/10'
                            : 'bg-slate-950/50 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span>{c}</span>
                        {isSelected && <Check size={14} className="text-teal-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Semester Pill Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers size={14} className="text-teal-400" /> Academic Semester
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SEMESTERS.map(s => {
                    const isSelected = semester === s;
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSemester(s)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all border text-center cursor-pointer ${
                          isSelected
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-md shadow-teal-500/10'
                            : 'bg-slate-950/50 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject Title */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-teal-400" /> Subject / Paper Title
                </label>
                <input 
                  type="text" 
                  placeholder="e.g., Database Management Systems" 
                  value={subject}
                  onChange={e => setSubject(e.target.value)} 
                  required
                  className="w-full px-4 py-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all text-sm"
                />
              </div>

            </div>

            {/* Live Summary Preview Box */}
            <div className="bg-gradient-to-br from-teal-950/40 to-slate-900/60 border border-teal-500/20 rounded-3xl p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <Sparkles size={14} /> Allocation Summary
              </p>
              <div className="space-y-1.5 text-xs text-slate-300">
                <p className="flex justify-between">
                  <span className="text-slate-500">Instructor:</span> 
                  <span className="font-semibold text-white">{teacherDetails?.name || 'Not Selected'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Batch:</span> 
                  <span className="font-semibold text-white">{courseName} - {semester}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Subject:</span> 
                  <span className="font-semibold text-teal-300">{subject || 'Untitled Paper'}</span>
                </p>
                <p className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-slate-400">Total Enrolled:</span> 
                  <span className="font-bold text-teal-400">{selectedStudents.length} Students</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Student Roster Table */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl flex flex-col h-full">
              
              {/* Header with Search & Quick Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Enrolled Students Matrix
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing {filteredStudents.length} students matching <span className="text-teal-400 font-semibold">{courseName}</span> ({semester})
                  </p>
                </div>

                {filteredStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:text-white transition-colors cursor-pointer px-3.5 py-2 rounded-xl bg-teal-500/15 border border-teal-500/30 hover:bg-teal-500/25 shrink-0"
                  >
                    {allFilteredSelected ? (
                      <>
                        <Square size={14} /> Deselect All ({filteredStudents.length})
                      </>
                    ) : (
                      <>
                        <CheckSquare size={14} /> Select All ({filteredStudents.length})
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Live Search Input */}
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by student name or register number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:border-teal-500 focus:outline-none transition-all"
                />
              </div>

              {/* Student Scrollable List */}
              <div className="flex-1 min-h-[350px] max-h-[480px] overflow-y-auto bg-slate-950/60 border border-white/10 rounded-2xl p-3 space-y-1.5 divide-y divide-white/5">
                {filteredStudents.length === 0 ? (
                  <div className="py-20 text-center text-slate-500 space-y-2">
                    <Users size={32} className="mx-auto text-slate-600" />
                    <p className="text-sm font-medium">No students found for this course & semester.</p>
                    <p className="text-xs text-slate-600">Ensure students are registered under {courseName} ({semester}).</p>
                  </div>
                ) : (
                  filteredStudents.map(st => {
                    const isChecked = selectedStudents.includes(st._id);
                    return (
                      <label 
                        key={st._id} 
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-teal-500/15 border-teal-500/40 shadow-sm' 
                            : 'bg-slate-900/30 border-white/5 hover:border-white/15 hover:bg-slate-900/70'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleStudentCheckbox(st._id)}
                            className="accent-teal-500 h-4 w-4 rounded cursor-pointer"
                          />
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 flex items-center justify-center font-bold text-teal-400 text-xs">
                            {(st.fullName || st.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {st.fullName || st.name}
                            </p>
                            <p className="text-xs font-mono text-slate-400">
                              {st.registerNo || st.rollNumber || 'No Register ID'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 text-slate-400">
                            {st.course || courseName}
                          </span>
                          <span className="hidden sm:inline-block px-2 py-1 rounded-lg text-[11px] font-mono text-teal-400 bg-teal-500/10 border border-teal-500/20">
                            {st.semester || semester}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Action Submit Button */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting || selectedStudents.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-2xl font-bold tracking-wide shadow-xl shadow-teal-500/20 transition-all transform active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base"
                >
                  {isSubmitting ? (
                    "Deploying Allocation Matrix..."
                  ) : (
                    <>
                      <span>Finalize & Link Faculty Allocation</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AssignStudents;