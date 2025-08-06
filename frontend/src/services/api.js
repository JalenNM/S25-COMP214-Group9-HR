// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      // Try to extract error message from response body
      let errorMessage = `HTTP error! status: ${response.status}`
      
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch (parseError) {
        // If we can't parse the response, use the default message
        console.warn('Could not parse error response:', parseError)
      }
      
      throw new Error(errorMessage)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}

// Employee API calls
export const employeeAPI = {
  // Get all employees
  getAll: () => apiCall('/employees'),
  
  // Get employee by ID
  getById: (id) => apiCall(`/employees/${id}`),
  
  // Search employees (if backend supports it)
  search: (query) => apiCall(`/employees/search?q=${encodeURIComponent(query)}`),
  
  // Create new employee
  create: (employeeData) => apiCall('/employees', {
    method: 'POST',
    body: JSON.stringify(employeeData),
  }),
  
  // Update employee
  update: (id, employeeData) => apiCall(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(employeeData),
  }),
  
  // Delete employee
  delete: (id) => apiCall(`/employees/${id}`, {
    method: 'DELETE',
  }),
  
  // Get employee statistics
  getStatistics: () => apiCall('/employees/statistics'),
  
  // Hire employee using stored procedure
  hire: (employeeData) => apiCall('/employees/hire', {
    method: 'POST',
    body: JSON.stringify(employeeData),
  }),
}

// Department API calls
export const departmentAPI = {
  // Get all departments
  getAll: () => apiCall('/departments'),
  
  // Get department by ID
  getById: (id) => apiCall(`/departments/${id}`),
  
  // Search departments
  search: (query) => apiCall(`/departments/search?q=${encodeURIComponent(query)}`),
  
  // Create new department
  create: (departmentData) => apiCall('/departments', {
    method: 'POST',
    body: JSON.stringify(departmentData),
  }),
  
  // Update department
  update: (id, departmentData) => apiCall(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(departmentData),
  }),
  
  // Delete department
  delete: (id) => apiCall(`/departments/${id}`, {
    method: 'DELETE',
  }),
  
  // Get department statistics
  getStatistics: () => apiCall('/departments/statistics'),
  
  // Get employees in department
  getEmployees: (id) => apiCall(`/departments/${id}/employees`),
}

// Job API calls
export const jobAPI = {
  // Get all jobs
  getAll: () => apiCall('/jobs'),
  
  // Get job by ID
  getById: (id) => apiCall(`/jobs/${id}`),
  
  // Get job description using stored function
  getDescription: (id) => apiCall(`/jobs/${id}/description`),
  
  // Update job info using stored procedure
  updateInfo: (id, jobData) => apiCall(`/jobs/${id}/update-info`, {
    method: 'PUT',
    body: JSON.stringify(jobData),
  }),
  
  // Create new job using stored procedure
  createNewJob: (jobData) => apiCall('/jobs/new-job', {
    method: 'POST',
    body: JSON.stringify(jobData),
  }),
  
  // Search jobs
  search: (query) => apiCall(`/jobs/search?q=${encodeURIComponent(query)}`),
  
  // Create new job
  create: (jobData) => apiCall('/jobs', {
    method: 'POST',
    body: JSON.stringify(jobData),
  }),
  
  // Update job
  update: (id, jobData) => apiCall(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(jobData),
  }),
  
  // Delete job
  delete: (id) => apiCall(`/jobs/${id}`, {
    method: 'DELETE',
  }),
  
  // Get job statistics
  getStatistics: () => apiCall('/jobs/statistics'),
  
  // Get employees with this job
  getEmployees: (id) => apiCall(`/jobs/${id}/employees`),
}

// Health check
export const healthAPI = {
  check: () => apiCall('/health', { 
    method: 'GET',
    // Override base URL for health check
  }).catch(() => 
    fetch('http://localhost:5000/health').then(res => res.json())
  ),
}

export default {
  employee: employeeAPI,
  department: departmentAPI,
  job: jobAPI,
  health: healthAPI,
}
