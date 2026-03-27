// src/components/AddStudentModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AddStudentModal = ({ isOpen, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({ 
    fullName: '', 
    registerNo: '', 
    semester: '1st Semester', 
    course: 'B.Sc' 
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // POST to your backend (Axios uses the baseURL from your context)
      await axios.post('/api/students/add', formData);
      
      toast.success("Student added successfully!");
      onRefresh(); // Call this function to reload the student list in the background
      onClose();   // Close modal
      setFormData({ fullName: '', registerNo: '', semester: '1st Semester', course: 'B.Sc' });
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error(error.response?.data?.message || "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-[#1e293b] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">New Enrollment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">Full Name</label>
            <input required type="text" placeholder="Arjun Sharma"
              className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          {/* Register Number */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">Register No</label>
            <input required type="text" placeholder="REG123456"
              className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setFormData({...formData, registerNo: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Semester */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">Semester</label>
              <select className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}>
                <option className="bg-[#1e293b]">--Select Sem--</option>
                <option value="1st Semester" className="bg-[#1e293b]">1st Sem</option>
                <option value="2nd Semester" className="bg-[#1e293b]">2nd Sem</option>
                <option value="3rd Semester" className="bg-[#1e293b]">3rd Sem</option>
                <option value="4th Semester" className="bg-[#1e293b]">4th Sem</option>
                <option value="5th Semester" className="bg-[#1e293b]">5th Sem</option>
                <option value="6th Semester" className="bg-[#1e293b]">6th Sem</option>
              </select>
            </div>

            {/* Course */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">Course</label>
              <select className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}>
                <option className="bg-[#1e293b]">--Select Course--</option>
                <option value="B.Sc" className="bg-[#1e293b]">B.Sc</option>
                <option value="B.A" className="bg-[#1e293b]">B.A</option>
                <option value="BCA" className="bg-[#1e293b]">BCA</option>
                <option value="B.Com" className="bg-[#1e293b]">B.Com</option>
              </select>
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
            {loading ? "Adding Student..." : "Confirm Enrollment"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddStudentModal;