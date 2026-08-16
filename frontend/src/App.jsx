import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home';
import Attendance from './pages/Attendance';
import Students from './pages/Students';
import AddEmployee from './components/admin/AddEmployee';
import AssignStudents from './components/admin/AssignStudents';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';

const App = () => {
  const { token } = useAppContext();
  const role = localStorage.getItem('role') || 'teacher';

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Unauthenticated Entrance */}
        <Route 
          path="/" 
          element={
            !token ? (
              <Home />
            ) : role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/teacher" replace />
            )
          } 
        />

        {/* Teacher Terminal Route */}
        <Route 
          path="/teacher" 
          element={token ? <TeacherDashboard /> : <Navigate to="/" replace />} 
        />

        {/* Admin Dashboard & Nested Routes */}
        <Route 
          path="/admin" 
          element={token && role === 'admin' ? <AdminLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="students" element={<Students />} />
          <Route path="add" element={<AddEmployee />} />
          <Route path="assign" element={<AssignStudents />} />
        </Route>

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;