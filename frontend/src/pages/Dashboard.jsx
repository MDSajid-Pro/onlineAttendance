import React, { useState, useEffect } from "react";
import { Trash2, Edit3, Plus, Users, BarChart3, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import AddStudentModal from "../components/AddStudentModal";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 13;

  // --- ATTENDANCE LOGIC HELPER ---
  const calculateAttendance = (enrollmentDate) => {
    // This simulates a more realistic % based on how long they've been enrolled
    const seed = new Date(enrollmentDate).getTime() % 100;
    const base = 70; // Minimum 70%
    const variable = (seed % 30); // Random addition up to 30%
    return Math.min(100, base + variable).toFixed(1);
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/students/all");
      
      const dataWithAttendance = response.data.map(s => ({
        ...s,
        attendance: calculateAttendance(s.enrollmentDate || new Date())
      }));
      
      setStudents(dataWithAttendance);
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // --- PAGINATION LOGIC ---
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(students.length / studentsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`/api/students/delete/${id}`);
      toast.success("Student removed");
      fetchStudents();
    } catch (err) {
      toast.error("Could not delete");
    }
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col">
      <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Student Directory</h2>
            <p className="text-slate-400 mt-1 text-sm">Managing {students.length} enrollees</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} /> Add Student
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <StatCard label="Total Students" value={students.length} color="from-blue-500 to-cyan-400" icon={<Users size={20}/>} />
          <StatCard label="Avg. Attendance" value="88.4%" color="from-indigo-500 to-violet-500" icon={<BarChart3 size={20}/>} />
          <StatCard label="Active Courses" value="4" color="from-emerald-500 to-teal-400" icon={<BookOpen size={20}/>} />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center text-slate-500">Loading records...</div>
            ) : (
              <>
                <table className="w-full text-left min-w-175">
                  <thead className="bg-white/5 text-slate-400 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-8 py-5">Student Name</th>
                      <th className="px-8 py-5">Register No</th>
                      <th className="px-8 py-5">Course / Sem</th>
                      <th className="px-8 py-5">Attendance</th>
                      <th className="px-8 py-5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentStudents.map((s) => (
                      <tr key={s._id} className="group hover:bg-white/2 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-bold text-indigo-400">
                              {s.fullName.charAt(0)}
                            </div>
                            <span className="font-medium text-white">{s.fullName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-slate-400 font-mono text-sm">{s.registerNo}</td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-indigo-300 text-sm">{s.course}</span>
                            <span className="text-slate-500 text-xs">{s.semester}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className="flex-1 h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${s.attendance > 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                  style={{ width: `${s.attendance}%` }}
                                ></div>
                             </div>
                             <span className={`text-xs font-bold ${s.attendance > 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                               {s.attendance}%
                             </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleEditClick(s)} className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"><Edit3 size={18} /></button>
                            <button onClick={() => handleDelete(s._id)} className="p-2 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-colors"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* --- PAGINATION FOOTER --- */}
                <div className="p-6 bg-white/2 border-t border-white/5 flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Showing <span className="text-white font-medium">{indexOfFirstStudent + 1}</span> to <span className="text-white font-medium">{Math.min(indexOfLastStudent, students.length)}</span> of <span className="text-white font-medium">{students.length}</span> students
                  </p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center px-4 font-mono text-sm text-indigo-400">
                      Page {currentPage} of {totalPages}
                    </div>
                    <button 
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <AddStudentModal isOpen={isModalOpen} onClose={handleCloseModal} onRefresh={fetchStudents} initialData={editingStudent} />
    </div>
  );
};

const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-20 h-20 bg-linear-to-br ${color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}></div>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-white mt-2">{value}</p>
      </div>
      <div className="text-slate-500/50 p-2">{icon}</div>
    </div>
  </div>
);

export default Dashboard;