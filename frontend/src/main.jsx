import { BrowserRouter } from "react-router-dom";
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppProvider> 
        <App />
      </AppProvider>
  </BrowserRouter>,
)
