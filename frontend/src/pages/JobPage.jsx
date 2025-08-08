import { useState, useEffect } from 'react'
import { jobAPI } from '../services/api'

function JobPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // State for job description lookup
  const [jobIdInput, setJobIdInput] = useState('')
  const [jobDescription, setJobDescription] = useState(null)
  const [descriptionLoading, setDescriptionLoading] = useState(false)
  const [descriptionError, setDescriptionError] = useState(null)
  
  // State for editable grid
  const [editingJob, setEditingJob] = useState(null)
  const [editedValues, setEditedValues] = useState({})
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)
  const [updateSuccess, setUpdateSuccess] = useState(null)
  
  // State for new job form
  const [newJobForm, setNewJobForm] = useState({
    jobId: '',
    jobTitle: '',
    minSalary: '',
    maxSalary: ''
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [createSuccess, setCreateSuccess] = useState(null)
  
  // State for delete confirmation
  const [jobToDelete, setJobToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // Fetch jobs when component mounts or when switching to list tab
  useEffect(() => {
    if (activeTab === 'list' || activeTab === 'edit-grid') {
      fetchJobs()
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

  // Function to fetch job description by ID
  const fetchJobDescription = async () => {
    if (!jobIdInput.trim()) {
      setDescriptionError('Please enter a Job ID')
      return
    }

    setDescriptionLoading(true)
    setDescriptionError(null)
    setJobDescription(null)

    try {
      const response = await jobAPI.getDescription(jobIdInput.trim().toUpperCase())
      setJobDescription(response.data)
    } catch (err) {
      if (err.message.includes('404')) {
        setDescriptionError(`Job with ID "${jobIdInput.trim().toUpperCase()}" not found`)
      } else {
        setDescriptionError('Failed to fetch job description: ' + err.message)
      }
      console.error('Error fetching job description:', err)
    } finally {
      setDescriptionLoading(false)
    }
  }

  // Handle form submission for job description lookup
  const handleJobDescriptionSubmit = (e) => {
    e.preventDefault()
    fetchJobDescription()
  }

  // Functions for editable grid
  const startEditing = (job) => {
    setEditingJob(job.JOB_ID)
    setEditedValues({
      jobTitle: job.JOB_TITLE || '',
      minSalary: job.MIN_SALARY || '',
      maxSalary: job.MAX_SALARY || ''
    })
    setUpdateError(null)
    setUpdateSuccess(null)
  }

  const cancelEditing = () => {
    setEditingJob(null)
    setEditedValues({})
    setUpdateError(null)
    setUpdateSuccess(null)
  }

  const handleFieldChange = (field, value) => {
    setEditedValues(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveChanges = async (jobId) => {
    setUpdating(true)
    setUpdateError(null)

    try {
      await jobAPI.updateInfo(jobId, {
        jobTitle: editedValues.jobTitle,
        minSalary: editedValues.minSalary ? parseFloat(editedValues.minSalary) : null,
        maxSalary: editedValues.maxSalary ? parseFloat(editedValues.maxSalary) : null
      })

      // Update the jobs list with new values
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.JOB_ID === jobId 
            ? {
                ...job,
                JOB_TITLE: editedValues.jobTitle,
                MIN_SALARY: editedValues.minSalary ? parseFloat(editedValues.minSalary) : null,
                MAX_SALARY: editedValues.maxSalary ? parseFloat(editedValues.maxSalary) : null
              }
            : job
        )
      )

      setEditingJob(null)
      setEditedValues({})
      
      // Show success message briefly
      setUpdateSuccess('Job updated successfully!')
      setTimeout(() => setUpdateSuccess(null), 3000)

    } catch (err) {
      setUpdateError('Failed to update job: ' + err.message)
      console.error('Error updating job:', err)
    } finally {
      setUpdating(false)
    }
  }

  // Functions for new job form
  const handleNewJobChange = (field, value) => {
    setNewJobForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNewJobSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    setCreateSuccess(null)

    try {
      const response = await jobAPI.createNewJob({
        jobId: newJobForm.jobId.trim(),
        jobTitle: newJobForm.jobTitle.trim(),
        minSalary: newJobForm.minSalary ? parseFloat(newJobForm.minSalary) : null,
        maxSalary: newJobForm.maxSalary ? parseFloat(newJobForm.maxSalary) : null
      })

      // Show success message
      setCreateSuccess(response.message || 'A new job has been created')
      
      // Clear form
      setNewJobForm({
        jobId: '',
        jobTitle: '',
        minSalary: '',
        maxSalary: ''
      })

      // Refresh jobs list if on list or edit-grid tabs
      if (activeTab === 'list' || activeTab === 'edit-grid') {
        fetchJobs()
      }

      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setCreateSuccess(null), 5000)

    } catch (err) {
      setCreateError('Failed to create job: ' + err.message)
      console.error('Error creating job:', err)
    } finally {
      setCreating(false)
    }
  }

  // Functions for delete functionality
  const confirmDelete = (job) => {
    setJobToDelete(job)
    setDeleteError(null)
  }

  const cancelDelete = () => {
    setJobToDelete(null)
    setDeleteError(null)
  }

  const executeDelete = async () => {
    if (!jobToDelete) return

    setDeleting(true)
    setDeleteError(null)

    try {
      await jobAPI.delete(jobToDelete.JOB_ID)

      // Remove the job from the local state
      setJobs(prevJobs => prevJobs.filter(job => job.JOB_ID !== jobToDelete.JOB_ID))

      // Show success message
      setUpdateSuccess(`Job "${jobToDelete.JOB_ID}" has been deleted successfully`)
      setTimeout(() => setUpdateSuccess(null), 3000)

      // Close the confirmation dialog
      setJobToDelete(null)

    } catch (err) {
      setDeleteError('Failed to delete job: ' + err.message)
      console.error('Error deleting job:', err)
    } finally {
      setDeleting(false)
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
            onClick={() => fetchJobs()}
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
      case 'edit-grid':
        return (
          <div className="tab-content editable-grid">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Edit Jobs Grid ({jobs.length} jobs)</h4>
              <button className="btn btn-primary btn-sm" onClick={fetchJobs}>
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>

            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Instructions:</strong> Click the "Edit" button to modify job details. Job ID cannot be changed. 
              Click "Save" to commit changes to the database using the stored procedure.
            </div>

            {updateError && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {updateError}
              </div>
            )}

            {updateSuccess && (
              <div className="alert alert-success">
                <i className="bi bi-check-circle me-2"></i>
                {updateSuccess}
              </div>
            )}
            
            {jobs.length === 0 ? (
              <div className="alert alert-warning">
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.JOB_ID} className={editingJob === job.JOB_ID ? 'editing' : ''}>
                        <td>
                          <span className="badge bg-secondary">{job.JOB_ID}</span>
                          <small className="text-muted d-block">Not editable</small>
                        </td>
                        <td>
                          {editingJob === job.JOB_ID ? (
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={editedValues.jobTitle}
                              onChange={(e) => handleFieldChange('jobTitle', e.target.value)}
                              maxLength="35"
                              disabled={updating}
                            />
                          ) : (
                            job.JOB_TITLE
                          )}
                        </td>
                        <td>
                          {editingJob === job.JOB_ID ? (
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={editedValues.minSalary}
                              onChange={(e) => handleFieldChange('minSalary', e.target.value)}
                              min="0"
                              max="999999"
                              disabled={updating}
                            />
                          ) : (
                            job.MIN_SALARY ? `$${job.MIN_SALARY.toLocaleString()}` : 'N/A'
                          )}
                        </td>
                        <td>
                          {editingJob === job.JOB_ID ? (
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={editedValues.maxSalary}
                              onChange={(e) => handleFieldChange('maxSalary', e.target.value)}
                              min="0"
                              max="999999"
                              disabled={updating}
                            />
                          ) : (
                            job.MAX_SALARY ? `$${job.MAX_SALARY.toLocaleString()}` : 'N/A'
                          )}
                        </td>
                        <td>
                          {editingJob === job.JOB_ID ? (
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                className="btn btn-success"
                                onClick={() => saveChanges(job.JOB_ID)}
                                disabled={updating}
                              >
                                {updating ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-check2"></i> Save
                                  </>
                                )}
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={cancelEditing}
                                disabled={updating}
                              >
                                <i className="bi bi-x"></i> Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                className="btn btn-primary"
                                onClick={() => startEditing(job)}
                                disabled={editingJob !== null}
                              >
                                <i className="bi bi-pencil"></i> Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => confirmDelete(job)}
                                disabled={editingJob !== null}
                              >
                                <i className="bi bi-trash"></i> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {jobToDelete && (
              <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header bg-danger text-white">
                      <h5 className="modal-title">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Confirm Job Deletion
                      </h5>
                    </div>
                    <div className="modal-body">
                      {deleteError && (
                        <div className="alert alert-danger">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          {deleteError}
                        </div>
                      )}
                      
                      <p className="mb-3">
                        Are you sure you want to delete the following job? This action cannot be undone.
                      </p>
                      
                      <div className="card border-danger">
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-3"><strong>Job ID:</strong></div>
                            <div className="col-md-9">
                              <span className="badge bg-danger fs-6">{jobToDelete.JOB_ID}</span>
                            </div>
                          </div>
                          <hr />
                          <div className="row">
                            <div className="col-md-3"><strong>Job Title:</strong></div>
                            <div className="col-md-9">{jobToDelete.JOB_TITLE}</div>
                          </div>
                          <hr />
                          <div className="row">
                            <div className="col-md-3"><strong>Employees:</strong></div>
                            <div className="col-md-9">
                              <span className="badge bg-warning">
                                {jobToDelete.EMPLOYEE_COUNT || 0} employee(s)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {jobToDelete.EMPLOYEE_COUNT > 0 && (
                        <div className="alert alert-warning mt-3">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          <strong>Warning:</strong> This job has {jobToDelete.EMPLOYEE_COUNT} active employee(s). 
                          You cannot delete a job that has employees assigned to it.
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={cancelDelete}
                        disabled={deleting}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-danger" 
                        onClick={executeDelete}
                        disabled={deleting || jobToDelete.EMPLOYEE_COUNT > 0}
                      >
                        {deleting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-trash me-2"></i>
                            Delete Job
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="mt-3">
              <div className="card border-info">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="bi bi-lightbulb me-2"></i>
                    Grid Features:
                  </h6>
                  <ul className="mb-0 small">
                    <li><strong>Job ID:</strong> Cannot be modified (primary key)</li>
                    <li><strong>Job Title:</strong> Maximum 35 characters</li>
                    <li><strong>Salary Range:</strong> Values between 0 and 999,999</li>
                    <li><strong>Updates:</strong> Uses the <code>update_job_info</code> stored procedure</li>
                    <li><strong>Editing:</strong> Only one job can be edited at a time</li>
                    <li><strong>Delete:</strong> Jobs with active employees cannot be deleted</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )
      case 'add':
        return (
          <div className="tab-content">
            <h4>Create New Job Position</h4>
            <p className="text-muted">Use this form to create a new job position using the stored procedure.</p>
            
            {createError && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {createError}
              </div>
            )}

            {createSuccess && (
              <div className="alert alert-success">
                <i className="bi bi-check-circle me-2"></i>
                {createSuccess}
              </div>
            )}

            <form onSubmit={handleNewJobSubmit} className="job-creation-form">
              <div className="mb-3">
                <label htmlFor="newJobId" className="form-label">
                  Job ID <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="newJobId"
                  value={newJobForm.jobId}
                  onChange={(e) => handleNewJobChange('jobId', e.target.value)}
                  placeholder="Enter job ID (e.g., AS_MAN)" 
                  maxLength="10"
                  required
                  disabled={creating}
                />
                <div className="form-text">Maximum 10 characters, will be converted to uppercase</div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="newJobTitle" className="form-label">
                  Job Title <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="newJobTitle"
                  value={newJobForm.jobTitle}
                  onChange={(e) => handleNewJobChange('jobTitle', e.target.value)}
                  placeholder="Enter job title (e.g., ASSISTANT MANAGER)" 
                  maxLength="35"
                  required
                  disabled={creating}
                />
                <div className="form-text">Maximum 35 characters</div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="newMinSalary" className="form-label">Minimum Salary</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="newMinSalary"
                    value={newJobForm.minSalary}
                    onChange={(e) => handleNewJobChange('minSalary', e.target.value)}
                    placeholder="Enter minimum salary (e.g., 3500)" 
                    min="0"
                    max="999999"
                    disabled={creating}
                  />
                  <div className="form-text">Optional, between 0 and 999,999</div>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="newMaxSalary" className="form-label">Maximum Salary</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="newMaxSalary"
                    value={newJobForm.maxSalary}
                    onChange={(e) => handleNewJobChange('maxSalary', e.target.value)}
                    placeholder="Enter maximum salary (e.g., 5500)" 
                    min="0"
                    max="999999"
                    disabled={creating}
                  />
                  <div className="form-text">Optional, between 0 and 999,999</div>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary btn-lg"
                disabled={creating || !newJobForm.jobId.trim() || !newJobForm.jobTitle.trim()}
              >
                {creating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creating Job...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-circle me-2"></i>
                    CREATE JOB
                  </>
                )}
              </button>
            </form>

            {/* Example and help section */}
            <div className="mt-4">
              <div className="card border-info">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="bi bi-info-circle me-2"></i>
                    Example Values:
                  </h6>
                  <ul className="mb-3">
                    <li><strong>Job ID:</strong> AS_MAN</li>
                    <li><strong>Title:</strong> ASSISTANT MANAGER</li>
                    <li><strong>Minimum Salary:</strong> 3500</li>
                    <li><strong>Maximum Salary:</strong> 5500</li>
                  </ul>
                  <p className="mb-0 small">
                    <strong>Note:</strong> This form uses the <code>new_job</code> stored procedure 
                    which automatically commits the changes to the database.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      case 'identify':
        return (
          <div className="tab-content">
            <h4>Identify Job Description</h4>
            <p className="text-muted">Enter a Job ID to retrieve its description from the database.</p>
            
            <form onSubmit={handleJobDescriptionSubmit} className="mb-4">
              <div className="row align-items-end">
                <div className="col-md-8 mb-3">
                  <label htmlFor="jobIdInput" className="form-label">Job ID</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="jobIdInput"
                    value={jobIdInput}
                    onChange={(e) => setJobIdInput(e.target.value)}
                    placeholder="Enter Job ID (e.g., SA_REP)" 
                    disabled={descriptionLoading}
                  />
                  <div className="form-text">
                    Examples: SA_REP, AD_PRES, IT_PROG, HR_REP
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100"
                    disabled={descriptionLoading || !jobIdInput.trim()}
                  >
                    {descriptionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Looking up...
                      </>
                    ) : (
                      'Get Description'
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Display error if any */}
            {descriptionError && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {descriptionError}
              </div>
            )}

            {/* Display job description result */}
            {jobDescription && (
              <div className="card">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-check-circle me-2"></i>
                    Job Description Found
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3">
                      <strong>Job ID:</strong>
                    </div>
                    <div className="col-md-9">
                      <span className="badge bg-primary fs-6">{jobDescription.jobId}</span>
                    </div>
                  </div>
                  <hr />
                  <div className="row">
                    <div className="col-md-3">
                      <strong>Job Title:</strong>
                    </div>
                    <div className="col-md-9">
                      <span className="fs-5 text-success">{jobDescription.jobDescription}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Help section */}
            <div className="mt-4">
              <div className="card border-info">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="bi bi-info-circle me-2"></i>
                    How to use this feature:
                  </h6>
                  <ul className="mb-0">
                    <li>Enter a Job ID in the text box above</li>
                    <li>Click "Get Description" to retrieve the job title</li>
                    <li>The system uses the database function <code>get_job_description</code> to fetch the information</li>
                    <li>Job IDs are case-insensitive and will be converted to uppercase</li>
                  </ul>
                </div>
              </div>
            </div>
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
            className={`nav-link ${activeTab === 'edit-grid' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit-grid')}
          >
            Edit Jobs Grid
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'identify' ? 'active' : ''}`}
            onClick={() => setActiveTab('identify')}
          >
            Identify Job Description
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
      </ul>

      {renderTabContent()}
    </div>
  )
}

export default JobPage
