# Testing Guide

## Overview
This guide covers testing your HR Management System to ensure all components work correctly together.

## Testing Environment Setup

### Prerequisites
- Backend server running on `http://localhost:5000`
- Oracle database accessible and populated
- Frontend development server on `http://localhost:5173` (optional for API testing)

### Start Testing Environment
```bash
# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend (optional)
cd frontend
npm run dev
```

## API Testing

### 1. Health Check Test
**Purpose**: Verify server is running and database is connected

```bash
curl http://localhost:5000/health
```

**Expected Response**:
```json
{
  "status": "OK",
  "message": "HR API Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Employee API Tests

#### Get All Employees
```bash
curl -X GET "http://localhost:5000/api/employees"
```

#### Get Employee with Pagination
```bash
curl -X GET "http://localhost:5000/api/employees?page=1&limit=5"
```

#### Get Specific Employee
```bash
curl -X GET "http://localhost:5000/api/employees/100"
```

#### Create New Employee
```bash
curl -X POST "http://localhost:5000/api/employees" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@company.com",
    "phone_number": "555-0123",
    "hire_date": "2024-01-15",
    "job_id": "IT_PROG",
    "salary": 65000,
    "manager_id": 103,
    "department_id": 60
  }'
```

#### Update Employee
```bash
curl -X PUT "http://localhost:5000/api/employees/100" \
  -H "Content-Type: application/json" \
  -d '{
    "salary": 70000,
    "department_id": 50
  }'
```

#### Delete Employee
```bash
curl -X DELETE "http://localhost:5000/api/employees/999"
```

#### Get Employee Statistics
```bash
curl -X GET "http://localhost:5000/api/employees/statistics"
```

### 3. Department API Tests

#### Get All Departments
```bash
curl -X GET "http://localhost:5000/api/departments"
```

#### Get Specific Department
```bash
curl -X GET "http://localhost:5000/api/departments/10"
```

#### Create New Department
```bash
curl -X POST "http://localhost:5000/api/departments" \
  -H "Content-Type: application/json" \
  -d '{
    "department_name": "Innovation Lab",
    "manager_id": 100,
    "location_id": 1700
  }'
```

#### Update Department
```bash
curl -X PUT "http://localhost:5000/api/departments/10" \
  -H "Content-Type: application/json" \
  -d '{
    "department_name": "Updated Department Name",
    "manager_id": 101
  }'
```

#### Get Department Statistics
```bash
curl -X GET "http://localhost:5000/api/departments/statistics"
```

### 4. Job API Tests

#### Get All Jobs
```bash
curl -X GET "http://localhost:5000/api/jobs"
```

#### Get Specific Job
```bash
curl -X GET "http://localhost:5000/api/jobs/IT_PROG"
```

#### Create New Job
```bash
curl -X POST "http://localhost:5000/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "DATA_SCI",
    "job_title": "Data Scientist",
    "min_salary": 70000,
    "max_salary": 120000
  }'
```

#### Update Job
```bash
curl -X PUT "http://localhost:5000/api/jobs/IT_PROG" \
  -H "Content-Type: application/json" \
  -d '{
    "min_salary": 55000,
    "max_salary": 90000
  }'
```

#### Get Job Statistics
```bash
curl -X GET "http://localhost:5000/api/jobs/statistics"
```

## Error Testing

### 1. Validation Error Tests

#### Invalid Employee Data
```bash
curl -X POST "http://localhost:5000/api/employees" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "",
    "email": "invalid-email",
    "salary": -1000
  }'
```

**Expected Response**: 400 Bad Request with validation errors

#### Invalid Department Data
```bash
curl -X POST "http://localhost:5000/api/departments" \
  -H "Content-Type: application/json" \
  -d '{
    "department_name": "",
    "manager_id": 99999
  }'
```

#### Invalid Job Data
```bash
curl -X POST "http://localhost:5000/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "",
    "min_salary": 100000,
    "max_salary": 50000
  }'
```

### 2. Not Found Error Tests

#### Non-existent Employee
```bash
curl -X GET "http://localhost:5000/api/employees/99999"
```

#### Non-existent Department
```bash
curl -X GET "http://localhost:5000/api/departments/99999"
```

#### Non-existent Job
```bash
curl -X GET "http://localhost:5000/api/jobs/NONEXISTENT"
```

## Database Integration Testing

### 1. Foreign Key Constraint Tests

#### Invalid Manager ID
```bash
curl -X POST "http://localhost:5000/api/employees" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Employee",
    "email": "test@company.com",
    "job_id": "IT_PROG",
    "manager_id": 99999,
    "department_id": 60
  }'
```

#### Invalid Department ID
```bash
curl -X POST "http://localhost:5000/api/employees" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Employee",
    "email": "test@company.com",
    "job_id": "IT_PROG",
    "department_id": 99999
  }'
```

### 2. Unique Constraint Tests

#### Duplicate Email
```bash
# First, create an employee
curl -X POST "http://localhost:5000/api/employees" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Unique",
    "last_name": "Test",
    "email": "unique.test@company.com",
    "job_id": "IT_PROG",
    "department_id": 60
  }'

# Then try to create another with same email
curl -X POST "http://localhost:5000/api/employees" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Another",
    "last_name": "Test",
    "email": "unique.test@company.com",
    "job_id": "IT_PROG",
    "department_id": 60
  }'
```

## Performance Testing

### 1. Pagination Testing

#### Large Dataset Request
```bash
curl -X GET "http://localhost:5000/api/employees?limit=1000"
```

#### Multiple Page Requests
```bash
for i in {1..5}; do
  echo "Page $i:"
  curl -X GET "http://localhost:5000/api/employees?page=$i&limit=10"
  echo ""
done
```

### 2. Concurrent Request Testing

#### Multiple Simultaneous Requests
```bash
# Run multiple requests in background
for i in {1..10}; do
  curl -X GET "http://localhost:5000/api/employees" &
done
wait
```

## Frontend Integration Testing

### 1. CORS Testing
Open browser developer tools and navigate to `http://localhost:5173`

Check that API calls from frontend don't produce CORS errors.

### 2. API Service Testing

#### Test Frontend API Calls
```javascript
// Open browser console at http://localhost:5173
// Test API service calls

// Get employees
fetch('http://localhost:5000/api/employees')
  .then(response => response.json())
  .then(data => console.log('Employees:', data))
  .catch(error => console.error('Error:', error));

// Get departments
fetch('http://localhost:5000/api/departments')
  .then(response => response.json())
  .then(data => console.log('Departments:', data))
  .catch(error => console.error('Error:', error));
```

## Automated Testing Scripts

### 1. Basic API Test Script

Create `test-api.js`:
```javascript
const baseUrl = 'http://localhost:5000/api';

async function testAPI() {
  const tests = [
    { name: 'Health Check', url: 'http://localhost:5000/health' },
    { name: 'Get Employees', url: `${baseUrl}/employees` },
    { name: 'Get Departments', url: `${baseUrl}/departments` },
    { name: 'Get Jobs', url: `${baseUrl}/jobs` },
    { name: 'Employee Statistics', url: `${baseUrl}/employees/statistics` },
    { name: 'Department Statistics', url: `${baseUrl}/departments/statistics` },
    { name: 'Job Statistics', url: `${baseUrl}/jobs/statistics` }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await fetch(test.url);
      const status = response.ok ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${test.name} (${response.status})`);
    } catch (error) {
      console.log(`❌ FAIL - ${test.name} (${error.message})`);
    }
  }
}

testAPI();
```

Run with:
```bash
node test-api.js
```

### 2. PowerShell Test Script

Create `test-api.ps1`:
```powershell
$baseUrl = "http://localhost:5000/api"

$tests = @(
    @{Name="Health Check"; Url="http://localhost:5000/health"},
    @{Name="Get Employees"; Url="$baseUrl/employees"},
    @{Name="Get Departments"; Url="$baseUrl/departments"},
    @{Name="Get Jobs"; Url="$baseUrl/jobs"}
)

foreach ($test in $tests) {
    try {
        Write-Host "Testing: $($test.Name)" -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri $test.Url -Method Get
        Write-Host "✅ PASS - $($test.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ FAIL - $($test.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

Run with:
```powershell
powershell -File test-api.ps1
```

## Test Data Setup

### Sample Test Data
Use these SQL scripts to populate test data:

```sql
-- Insert test employee
INSERT INTO HR_EMPLOYEES (
    EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL, HIRE_DATE, 
    JOB_ID, SALARY, DEPARTMENT_ID
) VALUES (
    999, 'Test', 'Employee', 'test.employee@company.com', 
    SYSDATE, 'IT_PROG', 60000, 60
);

-- Insert test department
INSERT INTO HR_DEPARTMENTS (
    DEPARTMENT_ID, DEPARTMENT_NAME, LOCATION_ID
) VALUES (
    999, 'Test Department', 1700
);

-- Insert test job
INSERT INTO HR_JOBS (
    JOB_ID, JOB_TITLE, MIN_SALARY, MAX_SALARY
) VALUES (
    'TEST_JOB', 'Test Job Title', 40000, 80000
);
```

### Cleanup Test Data
```sql
-- Clean up test data
DELETE FROM HR_EMPLOYEES WHERE EMPLOYEE_ID = 999;
DELETE FROM HR_DEPARTMENTS WHERE DEPARTMENT_ID = 999;
DELETE FROM HR_JOBS WHERE JOB_ID = 'TEST_JOB';
COMMIT;
```

## Expected Results

### Successful API Responses

#### Employee List Response
```json
{
  "success": true,
  "data": [
    {
      "employee_id": 100,
      "first_name": "Steven",
      "last_name": "King",
      "email": "SKING",
      "phone_number": "515.123.4567",
      "hire_date": "2003-06-17T00:00:00.000Z",
      "job_id": "AD_PRES",
      "salary": 24000,
      "commission_pct": null,
      "manager_id": null,
      "department_id": 90
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 45,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

#### Statistics Response
```json
{
  "success": true,
  "data": {
    "totalEmployees": 107,
    "averageSalary": 6461.68,
    "departmentCounts": {
      "Administration": 1,
      "Marketing": 2,
      "IT": 5
    },
    "jobCounts": {
      "IT_PROG": 5,
      "AD_ASST": 1,
      "MK_MAN": 1
    }
  }
}
```

### Error Responses

#### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "first_name",
      "message": "First name is required"
    },
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

#### Not Found Error (404)
```json
{
  "success": false,
  "error": "Employee not found",
  "message": "No employee found with ID: 99999"
}
```

#### Database Error (500)
```json
{
  "success": false,
  "error": "Database error occurred",
  "message": "Please try again later"
}
```

## Troubleshooting Test Issues

### Common Issues

#### Connection Refused
- Ensure backend server is running on port 5000
- Check if another service is using the port
- Verify environment configuration

#### Database Errors
- Check Oracle database connection
- Verify table existence and permissions
- Ensure proper schema access

#### CORS Errors
- Verify FRONTEND_URL in backend .env
- Check that frontend is running on expected port
- Ensure CORS middleware is properly configured

#### Timeout Errors
- Check database performance
- Verify network connectivity
- Consider increasing timeout values

### Debug Mode Testing

#### Enable Debug Logging
```bash
# Set debug environment
DEBUG=* npm run dev
```

#### Check Server Logs
Monitor backend console for detailed error messages and query logs.

#### Database Query Logging
Enable query logging in the database configuration to see actual SQL being executed.

This comprehensive testing guide ensures your HR Management System is working correctly across all layers: API, database, and frontend integration.
