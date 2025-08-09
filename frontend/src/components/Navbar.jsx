import PropTypes from 'prop-types'

function Navbar({ activeMenu, setActiveMenu }) {
  const menuItems = [
    { id: 'employees', label: 'Employee Management', path: '/employees' },
    { id: 'jobs', label: 'Job Management', path: '/jobs' },
    { id: 'departments', label: 'Department Management', path: '/departments' }
  ]

  return (
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top">
      <div className="container-fluid">
        <a 
          className="navbar-brand" 
          href="#" 
          onClick={(e) => {
            e.preventDefault()
            setActiveMenu('home')
          }}
        >
          HR Management System
        </a>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {menuItems.map((item) => (
              <li key={item.id} className="nav-item">
                <a 
                  className={`nav-link ${activeMenu === item.id ? 'active' : ''}`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveMenu(item.id)
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}

Navbar.propTypes = {
  activeMenu: PropTypes.string.isRequired,
  setActiveMenu: PropTypes.func.isRequired
}

export default Navbar
