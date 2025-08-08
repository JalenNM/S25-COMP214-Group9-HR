import { useState, useEffect } from 'react'
import { employeeAPI, departmentAPI, jobAPI } from '../services/api'

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
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [listFilter, setListFilter] = useState('')
  
  // Inline editing state
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)
  const [updateSuccess, setUpdateSuccess] = useState(null)
  
  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteSuccess, setDeleteSuccess] = useState(null)
  
  // Form state for hiring
  const [departments, setDepartments] = useState([])
  const [jobs, setJobs] = useState([])
  const [managers, setManagers] = useState([])
  const [hireForm, setHireForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    jobId: '',
    salary: '',
    commissionPct: '',
    managerId: '',
    departmentId: ''
  })
  const [isHiring, setIsHiring] = useState(false)
  const [hireSuccess, setHireSuccess] = useState(false)
  const [hireError, setHireError] = useState(null)

  // Fetch employees when component mounts or when switching to list tab
  useEffect(() => {
    if (activeTab === 'list') {
      fetchEmployees()
    } else if (activeTab === 'hire' || activeTab === 'search') {
      fetchDropdownData()
    }
  }, [activeTab])

  const fetchDropdownData = async () => {
    try {
      const [deptResponse, jobResponse, empResponse] = await Promise.all([
        departmentAPI.getAll(),
        jobAPI.getAll(),
        employeeAPI.getAll()
      ])
      
      setDepartments(deptResponse.data || [])
      setJobs(jobResponse.data || [])
      // Filter employees to show only those who can be managers
      setManagers(empResponse.data || [])
    } catch (err) {
      console.error('Error fetching dropdown data:', err)
      setError('Failed to load form data: ' + err.message)
    }
  }

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

  const handleHireFormChange = (e) => {
    const { name, value } = e.target
    setHireForm(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear previous errors when user starts typing
    if (hireError) setHireError(null)
    if (hireSuccess) setHireSuccess(false)
  }

  const handleHireSubmit = async (e) => {
    e.preventDefault()
    setIsHiring(true)
    setHireError(null)
    setHireSuccess(false)

    try {
      // Validate required fields
      if (!hireForm.firstName || !hireForm.lastName || !hireForm.email || !hireForm.jobId) {
        throw new Error('Please fill in all required fields (First Name, Last Name, Email, Job)')
      }

      // Prepare data for API call
      const hireData = {
        firstName: hireForm.firstName.trim(),
        lastName: hireForm.lastName.trim(),
        email: hireForm.email.trim(),
        phoneNumber: hireForm.phoneNumber.trim() || null,
        jobId: hireForm.jobId, // Keep as string, don't parse as int
        salary: hireForm.salary ? parseFloat(hireForm.salary) : null,
        commissionPct: hireForm.commissionPct ? parseFloat(hireForm.commissionPct) : null,
        managerId: hireForm.managerId ? parseInt(hireForm.managerId) : null,
        departmentId: hireForm.departmentId ? parseInt(hireForm.departmentId) : null
      }

      await employeeAPI.hire(hireData)
      
      setHireSuccess(true)
      // Reset form
      setHireForm({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        jobId: '',
        salary: '',
        commissionPct: '',
        managerId: '',
        departmentId: ''
      })
      
      // Refresh employee list
      fetchEmployees()
      
    } catch (err) {
      // Handle specific trigger and procedure errors
      let errorMessage = err.message || 'Failed to hire employee'
      
      // Check if the error contains trigger-specific messages
      if (errorMessage.includes('Salary out of range') || errorMessage.includes('Should be between')) {
        setHireError(`❌ Salary Validation Trigger Activated: ${errorMessage}`)
      } else if (errorMessage.includes('Job ID') && errorMessage.includes('not found')) {
        setHireError(`❌ Job Validation Trigger Activated: ${errorMessage}`)
      } else if (errorMessage.includes('ORA-20100')) {
        setHireError('❌ Salary Validation Trigger Activated: Salary is outside the valid range for this job position')
      } else if (errorMessage.includes('ORA-20101')) {
        setHireError('❌ Job Validation Trigger Activated: Invalid job ID specified')
      } else {
        setHireError(errorMessage)
      }
      
      console.error('Error hiring employee:', err)
    } finally {
      setIsHiring(false)
    }
  }

  const cancelHire = () => {
    setHireForm({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      jobId: '',
      salary: '',
      commissionPct: '',
      managerId: '',
      departmentId: ''
    })
    setHireError(null)
    setHireSuccess(false)
  }

  // Inline editing functions
  const startEditing = (employee) => {
    // Clear any previous success/error messages when starting to edit a new employee
    setUpdateError(null)
    setUpdateSuccess(null)
    
    // Debug: Log the employee data to see what we're getting
    console.log('Starting to edit employee:', employee)
    console.log('Available dropdown data:')
    console.log('  Jobs:', jobs)
    console.log('  Departments:', departments) 
    console.log('  Managers:', managers)
    
    setEditingEmployee(employee.EMPLOYEE_ID)
    setEditForm({
      firstName: employee.FIRST_NAME || '',
      lastName: employee.LAST_NAME || '',
      email: employee.EMAIL || '',
      phoneNumber: employee.PHONE_NUMBER || '',
      jobId: employee.JOB_ID || '',
      salary: employee.SALARY || '',
      commissionPct: employee.COMMISSION_PCT || '',
      managerId: employee.MANAGER_ID || '',
      departmentId: employee.DEPARTMENT_ID || ''
    })
    
    // Debug: Log the form data that was set
    const formData = {
      firstName: employee.FIRST_NAME || '',
      lastName: employee.LAST_NAME || '',
      email: employee.EMAIL || '',
      phoneNumber: employee.PHONE_NUMBER || '',
      jobId: employee.JOB_ID || '',
      salary: employee.SALARY || '',
      commissionPct: employee.COMMISSION_PCT || '',
      managerId: employee.MANAGER_ID || '',
      departmentId: employee.DEPARTMENT_ID || ''
    }
    console.log('Form data set to:', formData)
  }

  const cancelEditing = () => {
    setEditingEmployee(null)
    setEditForm({})
    setUpdateError(null)
    setUpdateSuccess(null)
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const saveEmployee = async (employeeId) => {
    setIsUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(null)

    try {
      // Validate required fields
      if (!editForm.firstName || !editForm.lastName || !editForm.email || !editForm.jobId) {
        throw new Error('First Name, Last Name, Email, and Job Title are required')
      }

      // Prepare data for API call
      const updateData = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phoneNumber: editForm.phoneNumber.trim() || null,
        jobId: editForm.jobId && editForm.jobId !== '' ? editForm.jobId : null,
        salary: editForm.salary && editForm.salary !== '' ? parseFloat(editForm.salary) : null,
        commissionPct: editForm.commissionPct && editForm.commissionPct !== '' ? parseFloat(editForm.commissionPct) : null,
        managerId: editForm.managerId && editForm.managerId !== '' ? parseInt(editForm.managerId) : null,
        departmentId: editForm.departmentId && editForm.departmentId !== '' ? parseInt(editForm.departmentId) : null
      }

      await employeeAPI.update(employeeId, updateData)
      
      setUpdateSuccess(`Employee ${editForm.firstName} ${editForm.lastName} updated successfully`)
      // Don't reset editing state - keep the form in edit mode with current values
      // setEditingEmployee(null)
      // setEditForm({})
      
      // Refresh the search results and main employee list
      if (searchQuery) {
        handleSearch({ preventDefault: () => {} })
      }
      fetchEmployees()
      
    } catch (err) {
      // Handle specific trigger and procedure errors
      let errorMessage = err.message || 'Failed to update employee'
      
      // Check if the error contains trigger-specific messages
      if (errorMessage.includes('Salary out of range') || errorMessage.includes('Should be between')) {
        setUpdateError(`❌ Salary Validation Trigger Activated: ${errorMessage}`)
      } else if (errorMessage.includes('Job ID') && errorMessage.includes('not found')) {
        setUpdateError(`❌ Job Validation Trigger Activated: ${errorMessage}`)
      } else if (errorMessage.includes('ORA-20100')) {
        setUpdateError('❌ Salary Validation Trigger Activated: Salary is outside the valid range for this job position')
      } else if (errorMessage.includes('ORA-20101')) {
        setUpdateError('❌ Job Validation Trigger Activated: Invalid job ID specified')
      } else {
        setUpdateError(errorMessage)
      }
      
      console.error('Error updating employee:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  // Delete functions
  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee)
    setShowDeleteModal(true)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!employeeToDelete) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await employeeAPI.delete(employeeToDelete.EMPLOYEE_ID)
      
      setDeleteSuccess(`Employee ${employeeToDelete.FIRST_NAME} ${employeeToDelete.LAST_NAME} deleted successfully`)
      setShowDeleteModal(false)
      setEmployeeToDelete(null)
      
      // Refresh the search results and main employee list
      if (searchQuery) {
        handleSearch({ preventDefault: () => {} })
      }
      fetchEmployees()
      
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete employee')
      console.error('Error deleting employee:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setEmployeeToDelete(null)
    setDeleteError(null)
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
            onClick={() => activeTab === 'list' ? fetchEmployees() : fetchDropdownData()}
          >
            Retry
          </button>
        </div>
      )
    }

    switch (activeTab) {
      case 'list':
        // Filter employees based on the list filter
        const filteredEmployees = employees.filter(employee => 
          !listFilter || 
          employee.FIRST_NAME?.toLowerCase().includes(listFilter.toLowerCase()) ||
          employee.LAST_NAME?.toLowerCase().includes(listFilter.toLowerCase()) ||
          employee.EMAIL?.toLowerCase().includes(listFilter.toLowerCase()) ||
          employee.EMPLOYEE_ID?.toString().includes(listFilter) ||
          employee.JOB_TITLE?.toLowerCase().includes(listFilter.toLowerCase()) ||
          employee.DEPARTMENT_NAME?.toLowerCase().includes(listFilter.toLowerCase())
        )
        
        return (
          <div className="tab-content">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>All Employees ({employees.length} total{listFilter ? `, ${filteredEmployees.length} shown` : ''})</h4>
              <button className="btn btn-primary btn-sm" onClick={fetchEmployees}>
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>
            
            {/* Delete Success Message */}
            {deleteSuccess && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                <strong>Success!</strong> {deleteSuccess}
                <button type="button" className="btn-close" onClick={() => setDeleteSuccess(null)}></button>
              </div>
            )}
            
            {/* Quick Filter */}
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Quick filter by name, email, ID, job, or department..." 
                    value={listFilter}
                    onChange={(e) => setListFilter(e.target.value)}
                  />
                  {listFilter && (
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => setListFilter('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {employees.length === 0 ? (
              <div className="alert alert-info">
                No employees found in the database.
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="alert alert-warning">
                No employees match your filter criteria. <button className="btn btn-link p-0" onClick={() => setListFilter('')}>Clear filter</button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover table-sm">
                  <thead className="table-dark sticky-top">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Job Title</th>
                      <th>Department</th>
                      <th>Salary</th>
                      <th>Manager</th>
                      <th>Hire Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.EMPLOYEE_ID}>
                        <td><strong>{employee.EMPLOYEE_ID}</strong></td>
                        <td>{employee.FIRST_NAME} {employee.LAST_NAME}</td>
                        <td>{employee.EMAIL}</td>
                        <td>{employee.PHONE_NUMBER || 'N/A'}</td>
                        <td><span className="badge bg-secondary job-title-badge">{employee.JOB_TITLE}</span></td>
                        <td><span className="badge bg-info text-dark">{employee.DEPARTMENT_NAME || 'N/A'}</span></td>
                        <td className="text-success"><strong>${employee.SALARY ? employee.SALARY.toLocaleString() : 'N/A'}</strong></td>
                        <td>{employee.MANAGER_NAME || 'N/A'}</td>
                        <td>{employee.HIRE_DATE ? new Date(employee.HIRE_DATE).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Summary footer */}
                <div className="mt-3 p-3 border border-info rounded">
                  <div className="row text-center">
                    <div className="col-md-3">
                      <strong>Total Employees:</strong><br/>
                      <span className="fs-4 text-primary">{filteredEmployees.length}</span>
                    </div>
                    <div className="col-md-3">
                      <strong>Avg Salary:</strong><br/>
                      <span className="fs-4 text-success">
                        ${filteredEmployees.filter(e => e.SALARY).length > 0 
                          ? Math.round(filteredEmployees.filter(e => e.SALARY).reduce((sum, e) => sum + (e.SALARY || 0), 0) / filteredEmployees.filter(e => e.SALARY).length).toLocaleString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="col-md-3">
                      <strong>Total Payroll:</strong><br/>
                      <span className="fs-4 text-info">
                        ${filteredEmployees.reduce((sum, e) => sum + (e.SALARY || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="col-md-3">
                      <strong>Departments:</strong><br/>
                      <span className="fs-4 text-warning">
                        {new Set(filteredEmployees.map(e => e.DEPARTMENT_NAME).filter(d => d)).size}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      case 'hire':
        return (
          <div className="tab-content">
            <h4>Hire New Employee</h4>
            
            {/* Success Message */}
            {hireSuccess && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                <strong>Success!</strong> Employee has been hired successfully and added to the database.
                <button type="button" className="btn-close" onClick={() => setHireSuccess(false)}></button>
              </div>
            )}
            
            {/* Error Message */}
            {hireError && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Error!</strong> {hireError}
                <button type="button" className="btn-close" onClick={() => setHireError(null)}></button>
              </div>
            )}
            
            <form onSubmit={handleHireSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="firstName" className="form-label">
                    First Name <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="firstName" 
                    name="firstName"
                    value={hireForm.firstName}
                    onChange={handleHireFormChange}
                    placeholder="Enter first name"
                    maxLength="20"
                    required 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="lastName" className="form-label">
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="lastName" 
                    name="lastName"
                    value={hireForm.lastName}
                    onChange={handleHireFormChange}
                    placeholder="Enter last name"
                    maxLength="25"
                    required 
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="email" className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="email" 
                    name="email"
                    value={hireForm.email}
                    onChange={handleHireFormChange}
                    placeholder="Enter email address"
                    maxLength="25"
                    required 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    id="phoneNumber" 
                    name="phoneNumber"
                    value={hireForm.phoneNumber}
                    onChange={handleHireFormChange}
                    placeholder="Enter phone number"
                    maxLength="20"
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="jobId" className="form-label">
                    Job Title <span className="text-danger">*</span>
                  </label>
                  <select 
                    className="form-select" 
                    id="jobId" 
                    name="jobId"
                    value={hireForm.jobId}
                    onChange={handleHireFormChange}
                    required
                  >
                    <option value="">Select a job title...</option>
                    {jobs.map((job) => (
                      <option key={job.JOB_ID} value={job.JOB_ID}>
                        {job.JOB_TITLE} (ID: {job.JOB_ID})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="departmentId" className="form-label">Department</label>
                  <select 
                    className="form-select" 
                    id="departmentId" 
                    name="departmentId"
                    value={hireForm.departmentId}
                    onChange={handleHireFormChange}
                  >
                    <option value="">Select a department...</option>
                    {departments.map((dept) => (
                      <option key={dept.DEPARTMENT_ID} value={dept.DEPARTMENT_ID}>
                        {dept.DEPARTMENT_NAME} (ID: {dept.DEPARTMENT_ID})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="managerId" className="form-label">Manager</label>
                  <select 
                    className="form-select" 
                    id="managerId" 
                    name="managerId"
                    value={hireForm.managerId}
                    onChange={handleHireFormChange}
                  >
                    <option value="">Select a manager...</option>
                    {managers.map((manager) => (
                      <option key={manager.EMPLOYEE_ID} value={manager.EMPLOYEE_ID}>
                        {manager.FIRST_NAME} {manager.LAST_NAME} (ID: {manager.EMPLOYEE_ID})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="salary" className="form-label">Salary</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="salary" 
                    name="salary"
                    value={hireForm.salary}
                    onChange={handleHireFormChange}
                    placeholder="Enter salary amount"
                    min="0"
                    max="999999.99"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="commissionPct" className="form-label">Commission (%)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="commissionPct" 
                    name="commissionPct"
                    value={hireForm.commissionPct}
                    onChange={handleHireFormChange}
                    placeholder="Enter commission percentage"
                    min="0"
                    max="0.99"
                    step="0.01"
                  />
                  <div className="form-text">Enter as decimal (e.g., 0.15 for 15%)</div>
                </div>
              </div>
              
              <div className="row mt-4">
                <div className="col-12">
                  <button 
                    type="submit" 
                    className="btn btn-dark me-3"
                    disabled={isHiring}
                    style={{ border: '2px solid black' }}
                  >
                    {isHiring ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Hiring...
                      </>
                    ) : (
                      'Hire Employee'
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-primary"
                    onClick={cancelHire}
                    disabled={isHiring}
                    style={{ border: '2px solid blue' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
            
            {/* Instructions */}
            <div className="alert alert-info mt-4">
              <strong>Instructions:</strong>
              <ul className="mb-0 mt-2">
                <li>Fields marked with <span className="text-danger">*</span> are required</li>
                <li>Email must be unique in the system</li>
                <li>Select appropriate Job Title, Department, and Manager from dropdown lists</li>
                <li><strong>Salary Validation:</strong> The system will automatically validate that the salary is within the valid range for the selected job position</li>
                <li>Salary and Commission are optional fields</li>
                <li>Click "Hire Employee" to add the employee to the database using the stored procedure</li>
                <li><strong>Database Triggers:</strong> Salary validation triggers are active and will prevent invalid salary ranges</li>
              </ul>
            </div>
            
            {/* Recently Hired Employees Section */}
            {hireSuccess && employees.length > 0 && (
              <div className="mt-5">
                <h5>Recently Added Employees</h5>
                <div className="table-responsive">
                  <table className="table table-striped table-sm">
                    <thead className="table-dark">
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Job Title</th>
                        <th>Department</th>
                        <th>Hire Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.slice(-5).reverse().map((employee) => (
                        <tr key={employee.EMPLOYEE_ID}>
                          <td>{employee.EMPLOYEE_ID}</td>
                          <td>{employee.FIRST_NAME} {employee.LAST_NAME}</td>
                          <td>{employee.EMAIL}</td>
                          <td>{employee.JOB_TITLE}</td>
                          <td>{employee.DEPARTMENT_NAME || 'N/A'}</td>
                          <td>{employee.HIRE_DATE ? new Date(employee.HIRE_DATE).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      case 'search':
        return (
          <div className="tab-content">
            <h4>Search & Edit Employees</h4>
            
            {/* Success/Error Messages for Updates */}
            {updateSuccess && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                <strong>Success!</strong> {updateSuccess}
                <button type="button" className="btn-close" onClick={() => setUpdateSuccess(null)}></button>
              </div>
            )}
            
            {updateError && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Error!</strong> {updateError}
                <button type="button" className="btn-close" onClick={() => setUpdateError(null)}></button>
              </div>
            )}
            
            {/* Delete Success Message */}
            {deleteSuccess && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                <strong>Success!</strong> {deleteSuccess}
                <button type="button" className="btn-close" onClick={() => setDeleteSuccess(null)}></button>
              </div>
            )}
            
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
            <div className="alert alert-info mb-3">
              <strong>Search & Edit Instructions:</strong>
              <ul className="mb-0 mt-2">
                <li>Search by first name, last name, or full name</li>
                <li>Search by email address or employee ID</li>
                <li>Search by job title or department name</li>
                <li>Click "Edit" to modify employee information inline</li>
                <li>Click "Save" to confirm changes or "Cancel" to discard</li>
                <li><strong>Salary Validation:</strong> Database triggers will validate salary ranges when updating</li>
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
                          <th>First Name</th>
                          <th>Last Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Job Title</th>
                          <th>Department</th>
                          <th>Salary</th>
                          <th>Manager</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((employee) => {
                          const isEditing = editingEmployee === employee.EMPLOYEE_ID
                          
                          return (
                            <tr key={employee.EMPLOYEE_ID} className={isEditing ? 'table-warning' : ''}>
                              <td><strong>{employee.EMPLOYEE_ID}</strong></td>
                              
                              {/* First Name */}
                              <td>
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    name="firstName"
                                    value={editForm.firstName}
                                    onChange={handleEditFormChange}
                                    maxLength="20"
                                    required
                                  />
                                ) : (
                                  <span dangerouslySetInnerHTML={{
                                    __html: highlightSearchTerm(employee.FIRST_NAME, searchQuery)
                                  }} />
                                )}
                              </td>
                              
                              {/* Last Name */}
                              <td>
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    name="lastName"
                                    value={editForm.lastName}
                                    onChange={handleEditFormChange}
                                    maxLength="25"
                                    required
                                  />
                                ) : (
                                  <span dangerouslySetInnerHTML={{
                                    __html: highlightSearchTerm(employee.LAST_NAME, searchQuery)
                                  }} />
                                )}
                              </td>
                              
                              {/* Email */}
                              <td>
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    name="email"
                                    value={editForm.email}
                                    onChange={handleEditFormChange}
                                    maxLength="25"
                                    required
                                  />
                                ) : (
                                  <span dangerouslySetInnerHTML={{
                                    __html: highlightSearchTerm(employee.EMAIL, searchQuery)
                                  }} />
                                )}
                              </td>
                              
                              {/* Phone */}
                              <td>
                                {isEditing ? (
                                  <input 
                                    type="tel" 
                                    className="form-control form-control-sm" 
                                    name="phoneNumber"
                                    value={editForm.phoneNumber}
                                    onChange={handleEditFormChange}
                                    maxLength="20"
                                    placeholder="Phone number"
                                  />
                                ) : (
                                  employee.PHONE_NUMBER || 'N/A'
                                )}
                              </td>
                              
                              {/* Job Title */}
                              <td>
                                {isEditing ? (
                                  <select 
                                    className="form-select form-select-sm" 
                                    name="jobId"
                                    value={editForm.jobId || ''}
                                    onChange={handleEditFormChange}
                                    required
                                  >
                                    <option value="">Select job...</option>
                                    {jobs.map((job) => (
                                      <option key={job.JOB_ID} value={job.JOB_ID}>
                                        {job.JOB_TITLE}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span 
                                    className="job-title-badge badge bg-secondary"
                                    dangerouslySetInnerHTML={{
                                      __html: highlightSearchTerm(employee.JOB_TITLE, searchQuery)
                                    }} 
                                  />
                                )}
                              </td>
                              
                              {/* Department */}
                              <td>
                                {isEditing ? (
                                  <select 
                                    className="form-select form-select-sm" 
                                    name="departmentId"
                                    value={editForm.departmentId || ''}
                                    onChange={handleEditFormChange}
                                  >
                                    <option value="">Select dept...</option>
                                    {departments.map((dept) => (
                                      <option key={dept.DEPARTMENT_ID} value={dept.DEPARTMENT_ID}>
                                        {dept.DEPARTMENT_NAME}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span dangerouslySetInnerHTML={{
                                    __html: highlightSearchTerm(employee.DEPARTMENT_NAME || 'N/A', searchQuery)
                                  }} />
                                )}
                              </td>
                              
                              {/* Salary */}
                              <td>
                                {isEditing ? (
                                  <input 
                                    type="number" 
                                    className="form-control form-control-sm" 
                                    name="salary"
                                    value={editForm.salary}
                                    onChange={handleEditFormChange}
                                    min="0"
                                    max="999999.99"
                                    step="0.01"
                                    placeholder="Salary"
                                  />
                                ) : (
                                  <span className="text-success">
                                    ${employee.SALARY ? employee.SALARY.toLocaleString() : 'N/A'}
                                  </span>
                                )}
                              </td>
                              
                              {/* Manager */}
                              <td>
                                {isEditing ? (
                                  <select 
                                    className="form-select form-select-sm" 
                                    name="managerId"
                                    value={editForm.managerId || ''}
                                    onChange={handleEditFormChange}
                                  >
                                    <option value="">Select manager...</option>
                                    {managers.filter(m => m.EMPLOYEE_ID !== employee.EMPLOYEE_ID).map((manager) => (
                                      <option key={manager.EMPLOYEE_ID} value={manager.EMPLOYEE_ID}>
                                        {manager.FIRST_NAME} {manager.LAST_NAME}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  employee.MANAGER_NAME || 'N/A'
                                )}
                              </td>
                              
                              {/* Actions */}
                              <td>
                                {isEditing ? (
                                  <div className="btn-group" role="group">
                                    <button 
                                      className="btn btn-success btn-sm"
                                      onClick={() => saveEmployee(employee.EMPLOYEE_ID)}
                                      disabled={isUpdating}
                                    >
                                      {isUpdating ? (
                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                      ) : (
                                        <i className="bi bi-check-lg"></i>
                                      )} Save
                                    </button>
                                    <button 
                                      className="btn btn-secondary btn-sm"
                                      onClick={cancelEditing}
                                      disabled={isUpdating}
                                    >
                                      <i className="bi bi-x-lg"></i> Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="btn-group" role="group">
                                    <button 
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => startEditing(employee)}
                                      disabled={editingEmployee !== null}
                                      title="Edit Employee"
                                    >
                                      <i className="bi bi-pencil me-1"></i>Edit
                                    </button>
                                    <button 
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleDeleteClick(employee)}
                                      disabled={editingEmployee !== null}
                                      title="Delete Employee"
                                    >
                                      <i className="bi bi-trash me-1"></i>Delete
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    
                    {/* Edit Instructions */}
                    {editingEmployee && (
                      <div className="alert alert-info mt-3">
                        <strong>Editing Mode:</strong> You are currently editing employee ID {editingEmployee}. 
                        Fill in the required fields and click "Save" to update. The form will remain in edit mode after saving.
                        Click "Cancel" to exit editing mode and discard any unsaved changes.
                      </div>
                    )}
                  </div>
                )}
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
            className={`nav-link ${activeTab === 'hire' ? 'active' : ''}`}
            onClick={() => setActiveTab('hire')}
          >
            Hire Employee
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
      </ul>

      {renderTabContent()}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={cancelDelete}
                  disabled={isDeleting}
                ></button>
              </div>
              <div className="modal-body">
                {deleteError && (
                  <div className="alert alert-danger mb-3">
                    <strong>Error!</strong> {deleteError}
                  </div>
                )}
                <p>Are you sure you want to delete this employee?</p>
                {employeeToDelete && (
                  <div className="card">
                    <div className="card-body">
                      <h6 className="card-title">
                        <strong>{employeeToDelete.FIRST_NAME} {employeeToDelete.LAST_NAME}</strong>
                      </h6>
                      <p className="card-text mb-1">
                        <strong>ID:</strong> {employeeToDelete.EMPLOYEE_ID}
                      </p>
                      <p className="card-text mb-1">
                        <strong>Email:</strong> {employeeToDelete.EMAIL}
                      </p>
                      <p className="card-text mb-1">
                        <strong>Job:</strong> {employeeToDelete.JOB_TITLE || 'N/A'}
                      </p>
                      <p className="card-text mb-0">
                        <strong>Department:</strong> {employeeToDelete.DEPARTMENT_NAME || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
                <div className="alert alert-warning mt-3 mb-0">
                  <strong>Warning:</strong> This action cannot be undone. The employee will be permanently removed from the database.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={cancelDelete}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash"></i> Delete Employee
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeePage
