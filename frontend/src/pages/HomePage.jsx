import ConnectionStatus from '../components/ConnectionStatus'

function HomePage() {
  return (
    <div className="container mt-4">
      <ConnectionStatus />
      
      <div className="row">
        <div className="col-12">
          <div className="jumbotron bg-light p-5 rounded-lg mb-4">
            <h1 className="display-4">Welcome to HR Management System</h1>
            <p className="lead">
              Manage your organization's human resources efficiently with our comprehensive HR management platform.
            </p>
            <hr className="my-4" />
            <p>
              Select a module from the navigation menu to get started with employee management, 
              job administration, or department organization.
            </p>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Employee Management</h5>
              <p className="card-text">
                Manage employee records, personal information, job assignments, and performance tracking.
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Job Management</h5>
              <p className="card-text">
                Create and manage job positions, salary ranges, and job requirements throughout your organization.
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Department Management</h5>
              <p className="card-text">
                Organize departments, assign managers, and track departmental information and locations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
