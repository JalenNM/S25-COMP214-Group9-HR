import { useState, useEffect } from 'react'
import { employeeAPI } from '../services/api'

// Helper function to highlight search terms
const highlightSearchTerm = (text, searchTerm) => {
  if (!text || !searchTerm) return text
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-warning">$1</mark>')
}

function EmployeePage() {
  const [activeTab, setActiveTab] = useState('list')
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Fetch employees when component mounts or when switching to list tab
  useEffect(() => {
    if (activeTab === 'list') {
      fetchEmployees()
    } else if (activeTab === 'stats') {
      fetchStatistics()
    }
  }, [activeTab])

  const fetchEmployees = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await employeeAPI.getAll()
      setEmployees(response.data || [])
    } catch (err) {
      setError('Failed to fetch employees: ' + err.message)
      console.error('Error fetching employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await employeeAPI.getStatistics()
      setStatistics(response.data || {})
    } catch (err) {
      setError('Failed to fetch statistics: ' + err.message)
      console.error('Error fetching statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setError(null)
    
    try {
      // First try backend search endpoint (if available)
      try {
        const response = await employeeAPI.search(searchQuery)
        setSearchResults(response.data || [])
      } catch (backendError) {
        // Fallback to client-side search if backend search not available
        console.log('Backend search not available, using client-side search')
        
        // Make sure we have employee data loaded
        if (employees.length === 0) {
          await fetchEmployees()
        }
        
        // Filter employees based on search query
        const filteredEmployees = employees.filter(employee => 
          employee.FIRST_NAME?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.LAST_NAME?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.EMAIL?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.EMPLOYEE_ID?.toString().includes(searchQuery) ||
          employee.JOB_TITLE?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.DEPARTMENT_NAME?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        setSearchResults(filteredEmployees)
      }
    } catch (err) {
      setError('Search failed: ' + err.message)
      console.error('Error searching employees:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
          <button 
            className="btn btn-outline-danger btn-sm ms-2" 
            onClick={() => activeTab === 'list' ? fetchEmployees() : fetchStatistics()}
          >
            Retry
          </button>
        </div>
      )
    }

    switch (activeTab) {
      case 'list':
        return (
          <div className="tab-content">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Employee List ({employees.length} employees)</h4>
              <button className="btn btn-primary btn-sm" onClick={fetchEmployees}>
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>
            
            {employees.length === 0 ? (
              <div className="alert alert-info">
                No employees found in the database.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Job Title</th>
                      <th>Department</th>
                      <th>Salary</th>
                      <th>Manager</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.EMPLOYEE_ID}>
                        <td>{employee.EMPLOYEE_ID}</td>
                        <td>{employee.FIRST_NAME} {employee.LAST_NAME}</td>
                        <td>{employee.EMAIL}</td>
                        <td>{employee.PHONE_NUMBER || 'N/A'}</td>
                        <td>{employee.JOB_TITLE}</td>
                        <td>{employee.DEPARTMENT_NAME || 'N/A'}</td>
                        <td>${employee.SALARY ? employee.SALARY.toLocaleString() : 'N/A'}</td>
                        <td>{employee.MANAGER_NAME || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      case 'add':
        return (
          <div className="tab-content">
            <h4>Add New Employee</h4>
            <form>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="firstName" className="form-label">First Name</label>
                  <input type="text" className="form-control" id="firstName" placeholder="Enter first name" />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="lastName" className="form-label">Last Name</label>
                  <input type="text" className="form-control" id="lastName" placeholder="Enter last name" />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input type="email" className="form-control" id="email" placeholder="Enter email" />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="phone" className="form-label">Phone Number</label>
                  <input type="tel" className="form-control" id="phone" placeholder="Enter phone number" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Add Employee</button>
            </form>
          </div>
        )
      case 'search':
        return (
          <div className="tab-content">
            <h4>Search Employees</h4>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by name, email, employee ID, job title, or department..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  className="btn btn-primary" 
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
                {searchQuery && (
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={clearSearch}
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            {/* Search Instructions */}
            <div className="alert alert-light mb-3">
              <strong>Search Tips:</strong>
              <ul className="mb-0 mt-2">
                <li>Search by first name, last name, or full name</li>
                <li>Search by email address</li>
                <li>Search by employee ID (exact match)</li>
                <li>Search by job title or department name</li>
                <li>Search is case-insensitive</li>
              </ul>
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div>
                <h5>
                  Search Results for "{searchQuery}" 
                  <span className="badge bg-primary ms-2">
                    {searchResults.length} found
                  </span>
                </h5>
                
                {searchResults.length === 0 ? (
                  <div className="alert alert-warning">
                    <strong>No results found.</strong> Try adjusting your search terms or check spelling.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Job Title</th>
                          <th>Department</th>
                          <th>Salary</th>
                          <th>Manager</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((employee) => (
                          <tr key={employee.EMPLOYEE_ID}>
                            <td>{employee.EMPLOYEE_ID}</td>
                            <td>
                              <span dangerouslySetInnerHTML={{
                                __html: highlightSearchTerm(`${employee.FIRST_NAME} ${employee.LAST_NAME}`, searchQuery)
                              }} />
                            </td>
                            <td>
                              <span dangerouslySetInnerHTML={{
                                __html: highlightSearchTerm(employee.EMAIL, searchQuery)
                              }} />
                            </td>
                            <td>{employee.PHONE_NUMBER || 'N/A'}</td>
                            <td>
                              <span dangerouslySetInnerHTML={{
                                __html: highlightSearchTerm(employee.JOB_TITLE, searchQuery)
                              }} />
                            </td>
                            <td>
                              <span dangerouslySetInnerHTML={{
                                __html: highlightSearchTerm(employee.DEPARTMENT_NAME || 'N/A', searchQuery)
                              }} />
                            </td>
                            <td>${employee.SALARY ? employee.SALARY.toLocaleString() : 'N/A'}</td>
                            <td>{employee.MANAGER_NAME || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      case 'stats':
        return (
          <div className="tab-content">
            <h4>Employee Statistics</h4>
            {statistics ? (
              <div className="row">
                <div className="col-md-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title">Total Employees</h5>
                      <h2 className="text-primary">{statistics.TOTAL_EMPLOYEES || 0}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title">Average Salary</h5>
                      <h2 className="text-success">${statistics.AVG_SALARY ? Math.round(statistics.AVG_SALARY).toLocaleString() : 'N/A'}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title">Departments</h5>
                      <h2 className="text-info">{statistics.TOTAL_DEPARTMENTS || 0}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title">Job Titles</h5>
                      <h2 className="text-warning">{statistics.TOTAL_JOBS || 0}</h2>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                Click refresh to load statistics.
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mt-4">
      <h2>Employee Management</h2>
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Employee List
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Employee
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Search Employees
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        </li>
      </ul>

      {renderTabContent()}
    </div>
  )
}

export default EmployeePage
