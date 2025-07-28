import { useState, useEffect } from 'react'
import { departmentAPI } from '../services/api'

// Helper function to highlight search terms
const highlightSearchTerm = (text, searchTerm) => {
  if (!text || !searchTerm) return text
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-warning">$1</mark>')
}

function DepartmentPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Fetch departments when component mounts or when switching to list tab
  useEffect(() => {
    if (activeTab === 'list') {
      fetchDepartments()
    } else if (activeTab === 'stats') {
      fetchStatistics()
    }
  }, [activeTab])

  const fetchDepartments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await departmentAPI.getAll()
      setDepartments(response.data || [])
    } catch (err) {
      setError('Failed to fetch departments: ' + err.message)
      console.error('Error fetching departments:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await departmentAPI.getStatistics()
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
      // Try backend search first, fallback to client-side search
      try {
        const response = await departmentAPI.search(searchQuery)
        setSearchResults(response.data || [])
      } catch (backendError) {
        console.log('Backend search not available, using client-side search')
        
        if (departments.length === 0) {
          await fetchDepartments()
        }
        
        const filteredDepartments = departments.filter(dept => 
          dept.DEPARTMENT_NAME?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dept.MANAGER_NAME?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dept.LOCATION?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dept.DEPARTMENT_ID?.toString().includes(searchQuery)
        )
        setSearchResults(filteredDepartments)
      }
    } catch (err) {
      setError('Search failed: ' + err.message)
      console.error('Error searching departments:', err)
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
            onClick={() => activeTab === 'list' ? fetchDepartments() : fetchStatistics()}
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
              <h4>Department List ({departments.length} departments)</h4>
              <button className="btn btn-primary btn-sm" onClick={fetchDepartments}>
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>
            
            {departments.length === 0 ? (
              <div className="alert alert-info">
                No departments found in the database.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Department Name</th>
                      <th>Manager</th>
                      <th>Location</th>
                      <th>Employees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((department) => (
                      <tr key={department.DEPARTMENT_ID}>
                        <td>{department.DEPARTMENT_ID}</td>
                        <td>{department.DEPARTMENT_NAME}</td>
                        <td>{department.MANAGER_NAME || 'No Manager'}</td>
                        <td>{department.LOCATION || 'N/A'}</td>
                        <td>
                          <span className="badge bg-primary">
                            {department.EMPLOYEE_COUNT || 0}
                          </span>
                        </td>
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
            <h4>Create New Department</h4>
            <form>
              <div className="mb-3">
                <label htmlFor="deptName" className="form-label">Department Name</label>
                <input type="text" className="form-control" id="deptName" placeholder="Enter department name" />
              </div>
              <div className="mb-3">
                <label htmlFor="managerId" className="form-label">Manager ID</label>
                <input type="number" className="form-control" id="managerId" placeholder="Enter manager employee ID" />
              </div>
              <div className="mb-3">
                <label htmlFor="locationId" className="form-label">Location ID</label>
                <input type="number" className="form-control" id="locationId" placeholder="Enter location ID" />
              </div>
              <button type="submit" className="btn btn-primary">Create Department</button>
            </form>
          </div>
        )
      case 'search':
        return (
          <div className="tab-content">
            <h4>Search Departments</h4>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by department name, manager, location, or department ID..." 
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
                    <strong>No results found.</strong> Try adjusting your search terms.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>ID</th>
                          <th>Department Name</th>
                          <th>Manager</th>
                          <th>Location</th>
                          <th>Employees</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((department) => (
                          <tr key={department.DEPARTMENT_ID}>
                            <td>{department.DEPARTMENT_ID}</td>
                            <td>
                              <span dangerouslySetInnerHTML={{
                                __html: highlightSearchTerm(department.DEPARTMENT_NAME, searchQuery)
                              }} />
                            </td>
                            <td>
                              <span dangerouslySetInnerHTML={{
                                __html: highlightSearchTerm(department.MANAGER_NAME || 'No Manager', searchQuery)
                              }} />
                            </td>
                            <td>
                              <span dangerouslySetInnerHTML={{
                                __html: highlightSearchTerm(department.LOCATION || 'N/A', searchQuery)
                              }} />
                            </td>
                            <td>
                              <span className="badge bg-primary">
                                {department.EMPLOYEE_COUNT || 0}
                              </span>
                            </td>
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
            <h4>Department Statistics</h4>
            {statistics ? (
              <div className="row">
                <div className="col-md-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title">Total Departments</h5>
                      <h2 className="text-primary">{statistics.TOTAL_DEPARTMENTS || 0}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title">Total Employees</h5>
                      <h2 className="text-success">{statistics.TOTAL_EMPLOYEES || 0}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title">Avg Dept Size</h5>
                      <h2 className="text-info">{statistics.AVG_DEPT_SIZE ? Math.round(statistics.AVG_DEPT_SIZE) : 0}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title">Locations</h5>
                      <h2 className="text-warning">{statistics.TOTAL_LOCATIONS || 0}</h2>
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
      case 'hierarchy':
        return (
          <div className="tab-content">
            <h4>Department Hierarchy</h4>
            <p>View the organizational structure and reporting relationships.</p>
            <div className="alert alert-secondary">
              <strong>Coming Soon:</strong> Visual department hierarchy and organizational chart.
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mt-4">
      <h2>Department Management</h2>
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Department List
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Department
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Search Departments
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
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'hierarchy' ? 'active' : ''}`}
            onClick={() => setActiveTab('hierarchy')}
          >
            Hierarchy
          </button>
        </li>
      </ul>

      {renderTabContent()}
    </div>
  )
}

export default DepartmentPage
