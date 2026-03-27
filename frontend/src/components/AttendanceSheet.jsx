import React, { useState } from 'react';
import StudentCard from './StudentCard';

const AttendanceSheet = () => {
  // Mock data - eventually this comes from your MongoDB via useEffect
  const [students, setStudents] = useState([
    { id: 1, name: "Sajid Khan", roll: "BCA-001" },
    { id: 2, name: "Anjali Rao", roll: "BCA-002" },
    { id: 3, name: "Mohammed Ali", roll: "BCA-003" },
  ]);

  const [attendanceData, setAttendanceData] = useState({});

  const handleStatusChange = (id, status) => {
    setAttendanceData(prev => ({ ...prev, [id]: status }));
  };

  const submitAttendance = () => {
    console.log("Sending to Backend:", attendanceData);
    alert("Attendance Saved for Success Degree College!");
    // Here you would use axios.post('/api/attendance', attendanceData)
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Daily Attendance</h1>
            <p className="text-slate-500">Success Degree College • {new Date().toLocaleDateString()}</p>
          </div>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
            BCA - III Sem
          </span>
        </header>

        <div className="bg-white rounded-2xl shadow-sm p-2">
          {students.map(student => (
            <StudentCard 
              key={student.id} 
              student={student} 
              onStatusChange={handleStatusChange} 
            />
          ))}
        </div>

        <button 
          onClick={submitAttendance}
          className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl"
        >
          Save Attendance Report
        </button>
      </div>
    </div>
  );
};

export default AttendanceSheet;