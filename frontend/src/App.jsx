import React from 'react'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import { Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import { useAppContext } from './context/AppContext'
import { Toaster } from "react-hot-toast"
import Attendance from './pages/Attendance'
import Students from './pages/Students'

const App = () => {

  const { token } = useAppContext();

  return (
    <>
      <Toaster/>
      <Routes>
        
        <Route path="/" element={token ? <AdminLayout/> : <Home /> }>
          <Route index element={<Dashboard />} />
          <Route path='/attendance' element={<Attendance />} />
          <Route path='/students' element={<Students/> } />
        </Route>
      </Routes>
      </>
  )
}

export default App