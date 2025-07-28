# HR Management System - Backend API

A Node.js/Express backend API for the HR Management System, connecting to an Oracle database.

## Features

- **Employee Management**: CRUD operations for employees with search functionality
- **Department Management**: Manage departments and their employees
- **Job Management**: Handle job positions and associated employees
- **Oracle Database Integration**: Full connection pooling and error handling
- **RESTful API**: Well-structured endpoints following REST conventions
- **Error Handling**: Comprehensive error handling and logging
- **Security**: CORS, Helmet, and environment variable protection

## Prerequisites

1. **Oracle Database**: Access to an Oracle database (local or cloud)
2. **Oracle Client Libraries**: Oracle Instant Client installed
3. **Node.js**: Version 16 or higher
4. **Database Schema**: HR schema with tables (EMPLOYEES, DEPARTMENTS, JOBS, etc.)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Oracle database credentials:
   ```
   DB_USER=your_oracle_username
   DB_PASSWORD=your_oracle_password
   DB_CONNECT_STRING=localhost:1521/XE
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```

3. **Oracle Client Setup** (if needed):
   - Download Oracle Instant Client from Oracle website
   - Extract to a directory (e.g., `C:/oracle/instantclient_21_9`)
   - Add to PATH or uncomment the `initOracleClient` line in `db/connection.js`

## Database Schema

The API expects the following Oracle HR schema tables:

```sql
-- Core tables
EMPLOYEES (EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL, PHONE_NUMBER, HIRE_DATE, JOB_ID, SALARY, COMMISSION_PCT, MANAGER_ID, DEPARTMENT_ID)
DEPARTMENTS (DEPARTMENT_ID, DEPARTMENT_NAME, MANAGER_ID, LOCATION_ID)
JOBS (JOB_ID, JOB_TITLE, MIN_SALARY, MAX_SALARY)
LOCATIONS (LOCATION_ID, STREET_ADDRESS, CITY, STATE_PROVINCE, POSTAL_CODE, COUNTRY_ID)
COUNTRIES (COUNTRY_ID, COUNTRY_NAME, REGION_ID)

-- Sequences
EMPLOYEES_SEQ
DEPARTMENTS_SEQ
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on port 5000 (or the port specified in your .env file).

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Employees
- `GET /api/employees` - Get all employees (with pagination)
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/search/:term` - Search employees

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `GET /api/departments/:id/employees` - Get employees in department
- `POST /api/departments` - Create new department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `GET /api/jobs/:id/employees` - Get employees with specific job
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

## API Response Format

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

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `DB_USER` | Oracle username | - |
| `DB_PASSWORD` | Oracle password | - |
| `DB_CONNECT_STRING` | Oracle connection string | localhost:1521/XE |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |

## Project Structure

```
backend/
├── db/
│   └── connection.js      # Oracle database connection
├── routes/
│   ├── employees.js       # Employee endpoints
│   ├── departments.js     # Department endpoints
│   └── jobs.js           # Job endpoints
├── server.js             # Main server file
├── package.json          # Dependencies
├── .env.example          # Environment template
└── README.md            # This file
```

## Testing

Test the API endpoints using:
- **Postman**: Import the collection from `/docs/postman`
- **curl**: Command line testing
- **Frontend**: React application integration

### Example curl commands:

```bash
# Health check
curl http://localhost:5000/health

# Get all employees
curl http://localhost:5000/api/employees

# Get specific employee
curl http://localhost:5000/api/employees/100

# Create new employee
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john.doe@company.com","jobId":"IT_PROG"}'
```

## Error Handling

The API includes comprehensive error handling:
- **Database connection errors**
- **Invalid request data**
- **Resource not found (404)**
- **Constraint violations**
- **Server errors (500)**

## Security Features

- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Environment variables**: Sensitive data protection
- **Input validation**: Parameter validation
- **Connection pooling**: Efficient database connections

## Logging

The server uses Morgan for HTTP request logging and console logging for errors and important events.

## Contributing

1. Follow the existing code structure
2. Add error handling for new endpoints
3. Update this README for new features
4. Test thoroughly before committing

## Academic Note

This project is part of COMP214 - Advanced Database Concepts course at Centennial College. It demonstrates:
- Oracle database integration
- RESTful API design
- Connection pooling
- Error handling
- Security best practices
