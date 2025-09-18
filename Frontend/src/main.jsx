import React from 'react'
import ReactDOM from 'react-dom/client'
// --- 1. Import the main App component ---
import App from './App.jsx' 
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* --- 2. Render the App component --- */}
    <App /> 
  </React.StrictMode>,
)
