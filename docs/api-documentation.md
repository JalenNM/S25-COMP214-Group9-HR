# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently no authentication required (development setup).

## Response Format

### Success Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Employees API

### GET /api/employees
Get all employees with pagination.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "data": [
    {
      "EMPLOYEE_ID": 100,
      "FIRST_NAME": "John",
      "LAST_NAME": "Doe",
      "EMAIL": "john.doe@company.com",
      "PHONE_NUMBER": "555-1234",
      "HIRE_DATE": "2023-01-15T00:00:00.000Z",
      "SALARY": 75000,
      "JOB_TITLE": "Software Developer",
      "DEPARTMENT_NAME": "IT",
      "MANAGER_NAME": "Jane Smith"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### GET /api/employees/:id
Get specific employee by ID.

**Response:**
```json
{
  "data": {
    "EMPLOYEE_ID": 100,
    "FIRST_NAME": "John",
    "LAST_NAME": "Doe",
    "EMAIL": "john.doe@company.com",
    "PHONE_NUMBER": "555-1234",
    "HIRE_DATE": "2023-01-15T00:00:00.000Z",
    "SALARY": 75000,
    "COMMISSION_PCT": 0.05,
    "JOB_TITLE": "Software Developer",
    "JOB_ID": "IT_PROG",
    "DEPARTMENT_NAME": "IT",
    "DEPARTMENT_ID": 60,
    "MANAGER_NAME": "Jane Smith",
    "MANAGER_ID": 101
  }
}
```

### POST /api/employees
Create a new employee.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phoneNumber": "555-1234",
  "hireDate": "2024-01-15",
  "jobId": "IT_PROG",
  "salary": 75000,
  "commissionPct": 0.05,
  "managerId": 101,
  "departmentId": 60
}
```

### PUT /api/employees/:id
Update an existing employee.

**Request Body:** Same as POST (all fields optional)

### DELETE /api/employees/:id
Delete an employee.

### GET /api/employees/search/:term
Search employees by name or email.

### GET /api/employees/stats
Get employee statistics and analytics.

**Response:**
```json
{
  "departmentStats": [
    {
      "DEPARTMENT_NAME": "IT",
      "EMPLOYEE_COUNT": 15,
      "AVERAGE_SALARY": 75000,
      "MIN_SALARY": 45000,
      "MAX_SALARY": 120000,
      "TOTAL_SALARY": 1125000
    }
  ],
  "jobStats": [
    {
      "JOB_TITLE": "Software Developer",
      "EMPLOYEE_COUNT": 10,
      "AVERAGE_SALARY": 80000,
      "MIN_SALARY": 60000,
      "MAX_SALARY": 100000
    }
  ],
  "overallStats": {
    "TOTAL_EMPLOYEES": 107,
    "OVERALL_AVERAGE_SALARY": 68500,
    "OVERALL_MIN_SALARY": 25000,
    "OVERALL_MAX_SALARY": 150000,
    "TOTAL_PAYROLL": 7329500,
    "TOP_LEVEL_MANAGERS": 5,
    "EMPLOYEES_WITH_COMMISSION": 12
  }
}
```

## Departments API

### GET /api/departments
Get all departments with employee count.

### GET /api/departments/:id
Get specific department by ID.

### GET /api/departments/:id/employees
Get all employees in a specific department.

### POST /api/departments
Create a new department.

**Request Body:**
```json
{
  "departmentName": "Research & Development",
  "managerId": 101,
  "locationId": 1700
}
```

### PUT /api/departments/:id
Update an existing department.

### DELETE /api/departments/:id
Delete a department (only if no employees assigned).

### GET /api/departments/stats
Get department statistics and analytics.

## Jobs API

### GET /api/jobs
Get all jobs with employee count.

### GET /api/jobs/:id
Get specific job by ID.

### GET /api/jobs/:id/employees
Get all employees with a specific job.

### POST /api/jobs
Create a new job.

**Request Body:**
```json
{
  "jobId": "DEV_SENIOR",
  "jobTitle": "Senior Developer",
  "minSalary": 80000,
  "maxSalary": 120000
}
```

### PUT /api/jobs/:id
Update an existing job.

### DELETE /api/jobs/:id
Delete a job (only if no employees assigned).

### GET /api/jobs/stats
Get job statistics and analytics.

**Response:**
```json
{
  "jobStats": [
    {
      "JOB_ID": "IT_PROG",
      "JOB_TITLE": "Programmer",
      "MIN_SALARY": 40000,
      "MAX_SALARY": 100000,
      "EMPLOYEE_COUNT": 15,
      "ACTUAL_AVERAGE_SALARY": 65000,
      "ACTUAL_MIN_SALARY": 45000,
      "ACTUAL_MAX_SALARY": 95000,
      "TOTAL_SALARY_COST": 975000,
      "SALARY_RANGE_UTILIZATION_PCT": 41.67
    }
  ],
  "summary": {
    "TOTAL_JOBS": 20,
    "ACTIVE_JOBS": 15,
    "VACANT_JOBS": 5,
    "AVERAGE_MIN_SALARY": 35000,
    "AVERAGE_MAX_SALARY": 85000,
    "LOWEST_MIN_SALARY": 15000,
    "HIGHEST_MAX_SALARY": 150000
  }
}
```

## Health Check

### GET /health
Check API server status.

**Response:**
```json
{
  "status": "OK",
  "message": "HR API Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad request / Validation error |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal server error |

## Validation Rules

### Employee Validation
- First name: Max 20 characters
- Last name: Required, max 25 characters
- Email: Required, max 25 characters, unique
- Phone: Max 20 characters
- Salary: 0 to 999,999.99
- Commission: 0.00 to 0.99
- Job ID: Must exist in HR_JOBS
- Manager ID: Must exist in HR_EMPLOYEES
- Department ID: Must exist in HR_DEPARTMENTS

### Department Validation
- Department name: Required, max 30 characters
- Manager ID: Must exist in HR_EMPLOYEES
- Location ID: Must exist in HR_LOCATIONS

### Job Validation
- Job ID: Required, max 10 characters, unique
- Job title: Required, max 35 characters
- Min/Max salary: 0 to 999,999
- Min salary ≤ Max salary
