import { useState, useEffect } from 'react'
import { jobAPI } from '../services/api'

function JobPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statistics, setStatistics] = useState(null)

  // Fetch jobs when component mounts or when switching to list tab
  useEffect(() => {
    if (activeTab === 'list') {
      fetchJobs()
    } else if (activeTab === 'stats') {
      fetchStatistics()
    }
  }, [activeTab])

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await jobAPI.getAll()
      setJobs(response.data || [])
    } catch (err) {
      setError('Failed to fetch jobs: ' + err.message)
      console.error('Error fetching jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await jobAPI.getStatistics()
      setStatistics(response.data || {})
    } catch (err) {
      setError('Failed to fetch statistics: ' + err.message)
      console.error('Error fetching statistics:', err)
    } finally {
      setLoading(false)
    }
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
            onClick={() => activeTab === 'list' ? fetchJobs() : fetchStatistics()}
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
              <h4>Job Positions ({jobs.length} jobs)</h4>
              <button className="btn btn-primary btn-sm" onClick={fetchJobs}>
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>
            
            {jobs.length === 0 ? (
              <div className="alert alert-info">
                No job positions found in the database.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Job ID</th>
                      <th>Job Title</th>
                      <th>Min Salary</th>
                      <th>Max Salary</th>
                      <th>Employees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.JOB_ID}>
                        <td>{job.JOB_ID}</td>
                        <td>{job.JOB_TITLE}</td>
                        <td>${job.MIN_SALARY ? job.MIN_SALARY.toLocaleString() : 'N/A'}</td>
                        <td>${job.MAX_SALARY ? job.MAX_SALARY.toLocaleString() : 'N/A'}</td>
                        <td>
                          <span className="badge bg-primary">
                            {job.EMPLOYEE_COUNT || 0}
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
            <h4>Create New Job Position</h4>
            <form>
              <div className="mb-3">
                <label htmlFor="jobId" className="form-label">Job ID</label>
                <input type="text" className="form-control" id="jobId" placeholder="Enter job ID" />
              </div>
              <div className="mb-3">
                <label htmlFor="jobTitle" className="form-label">Job Title</label>
                <input type="text" className="form-control" id="jobTitle" placeholder="Enter job title" />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="minSalary" className="form-label">Minimum Salary</label>
                  <input type="number" className="form-control" id="minSalary" placeholder="Enter minimum salary" />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="maxSalary" className="form-label">Maximum Salary</label>
                  <input type="number" className="form-control" id="maxSalary" placeholder="Enter maximum salary" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Create Job</button>
            </form>
          </div>
        )
      case 'stats':
        return (
          <div className="tab-content">
            <h4>Job Statistics</h4>
            {statistics ? (
              <div className="row">
                <div className="col-md-4">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title">Total Jobs</h5>
                      <h2 className="text-primary">{statistics.TOTAL_JOBS || 0}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title">Avg Salary Range</h5>
                      <h2 className="text-success">${statistics.AVG_SALARY_RANGE ? Math.round(statistics.AVG_SALARY_RANGE).toLocaleString() : 'N/A'}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title">Total Employees</h5>
                      <h2 className="text-warning">{statistics.TOTAL_EMPLOYEES || 0}</h2>
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
      <h2>Job Management</h2>
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Job List
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Job
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

export default JobPage
