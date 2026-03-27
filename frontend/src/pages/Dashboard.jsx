import React, { useState, useEffect } from "react";
import { Trash2, Edit3, Plus } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import AddStudentModal from "../components/AddStudentModal";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState(null); 

  // 1. Fetch Students from MongoDB
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/students/all");
      setStudents(response.data);
    } catch (err) {
      toast.error("Failed to load students");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // --- DELETE FUNCTION ---
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      await axios.delete(`/api/students/delete/${id}`);
      toast.success("Student removed");
      fetchStudents(); // Refresh the list
    } catch (err) {
      toast.error("Could not delete student");
    }
  };

  // --- EDIT TRIGGER ---
  const handleEditClick = (student) => {
    setEditingStudent(student); // Set the student data
    setIsModalOpen(true);       // Open the modal
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex">
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white">Student Directory</h2>
            <p className="text-slate-400 mt-1">Manage Success Degree College enrollees</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <Plus size={20} /> Add Student
          </button>
          
          {/* Use onRefresh prop to trigger fetchStudents after adding */}
          <AddStudentModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onRefresh={fetchStudents} 
          />
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard label="Total Students" value={students.length} color="from-blue-500 to-cyan-400" />
          <StatCard label="Avg. Attendance" value="91.6%" color="from-indigo-500 to-violet-500" />
          <StatCard label="Active Courses" value="4" color="from-emerald-500 to-teal-400" />
        </div>

        {/* CRUD Table Section */}
        <div className="bg-white/5 border border-white/10 rounded-4xl overflow-hidden backdrop-blur-md">
          {loading ? (
            <div className="p-20 text-center text-slate-500">Loading students...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-white/5 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-5 font-semibold">Student Name</th>
                  <th className="px-6 py-5 font-semibold">Register No</th>
                  <th className="px-6 py-5 font-semibold">Course / Sem</th>
                  <th className="px-6 py-5 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((s) => (
                  <tr key={s._id} className="group hover:bg-white/2 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-bold text-indigo-400 uppercase">
                          {s.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-white">{s.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-400 font-mono">{s.registerNo}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-indigo-300 text-sm">{s.course}</span>
                        <span className="text-slate-500 text-xs">{s.semester}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEditClick(s)} className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors cursor-pointer">
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="p-2 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
    <div
      className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}
    ></div>
    <p className="text-slate-400 text-sm font-medium">{label}</p>
    <p className="text-3xl font-bold text-white mt-2">{value}</p>
  </div>
);

export default Dashboard;
