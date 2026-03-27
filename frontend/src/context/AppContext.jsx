import { useContext, useState, createContext } from "react";
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

// Ensure your .env has VITE_BASE_URL (e.g., http://localhost:5000)
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const AppContext = createContext()

export const AppProvider = ({ children }) => {

    const navigate = useNavigate()

    // --- Existing State ---
    const [token, setToken] = useState(null)
    const [input, setInput] = useState("")
    const [students, setStudents] = useState([]);
    
    

    const value = {
        axios, token, setToken, navigate, input, setInput, students, setStudents
    }

    return (
        <AppContext.Provider value={value}>
            { children }
        </AppContext.Provider>
    )
}

export const useAppContext = () => {
    return useContext(AppContext)
}