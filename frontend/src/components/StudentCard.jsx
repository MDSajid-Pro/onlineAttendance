import React, { useState } from 'react';

const StudentCard = ({ student, onStatusChange }) => {
  const [status, setStatus] = useState('absent');

  const toggleStatus = () => {
    const newStatus = status === 'present' ? 'absent' : 'present';
    setStatus(newStatus);
    onStatusChange(student.id, newStatus);
  };

  return (
    <div className={`flex items-center justify-between p-4 mb-3 rounded-xl border-2 transition-all ${
      status === 'present' 
      ? 'border-emerald-100 bg-emerald-50' 
      : 'border-rose-100 bg-rose-50'
    }`}>
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
          {student.name.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">{student.name}</h3>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Roll: {student.roll}</p>
        </div>
      </div>

      <button
        onClick={toggleStatus}
        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
          status === 'present'
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
          : 'bg-rose-500 text-white shadow-lg shadow-rose-200'
        }`}
      >
        {status === 'present' ? 'Present' : 'Absent'}
      </button>
    </div>
  );
};

export default StudentCard;