import { useState } from 'react'
import './App.css'

// Import components
import Navbar from './components/Navbar'

// Import pages
import HomePage from './pages/HomePage'
import EmployeePage from './pages/EmployeePage'
import JobPage from './pages/JobPage'
import DepartmentPage from './pages/DepartmentPage'

function App() {
  const [activeMenu, setActiveMenu] = useState('home')

  const renderContent = () => {
    switch (activeMenu) {
      case 'employees':
        return <EmployeePage />
      case 'jobs':
        return <JobPage />
      case 'departments':
        return <DepartmentPage />
      case 'home':
      default:
        return <HomePage />
    }
  }

  return (
    <>
      <Navbar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      
      <main className="main-content">
        {renderContent()}
      </main>
    </>
  )
}

export default App
