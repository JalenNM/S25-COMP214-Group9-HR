# Complete Setup Guide

## Prerequisites Installation

### 1. Oracle Database Setup
You need access to an Oracle database. Options include:

#### Option A: Oracle Database XE (Free)
1. Download Oracle Database XE from Oracle website
2. Install following the installation wizard
3. Default connection: `localhost:1521/XE`

#### Option B: Oracle Cloud (Free Tier)
1. Sign up for Oracle Cloud account
2. Create an Autonomous Database instance
3. Download wallet and note connection string

#### Option C: Existing Oracle Server
Use your institution's Oracle database server.

### 2. Oracle Client Libraries
Required for Node.js to connect to Oracle.

#### Windows:
1. Download Oracle Instant Client from Oracle website
2. Extract to `C:\oracle\instantclient_21_9`
3. Add to system PATH environment variable

#### macOS:
```bash
# Using Homebrew
brew install instantclient-basic
```

#### Linux:
```bash
# Ubuntu/Debian
sudo apt-get install oracle-instantclient-basic
```

### 3. Node.js Installation
1. Download Node.js 16+ from [nodejs.org](https://nodejs.org)
2. Install following the installer
3. Verify installation:
```bash
node --version
npm --version
```

## Project Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd s25-comp214-group9-hr
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env file with your database credentials
# Use your preferred text editor
notepad .env  # Windows
nano .env     # Linux/macOS
```

#### Configure .env File
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Oracle Database Configuration
DB_USER=your_oracle_username
DB_PASSWORD=your_oracle_password
DB_CONNECT_STRING=localhost:1521/XE

# For Oracle Cloud:
# DB_CONNECT_STRING=your_cloud_connection_string

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Security
JWT_SECRET=your_jwt_secret_key_here
```

#### Test Backend Connection
```bash
npm run dev
```

You should see:
```
HR API Server running on port 5000
Health check: http://localhost:5000/health
Database initialized successfully
```

### 3. Database Schema Setup

#### Create Database Tables
Run these SQL scripts in your Oracle database:

```sql
-- Connect to your Oracle database
sqlplus username/password@connection_string

-- Or using SQL Developer, SQL*Plus, or any Oracle client
```

#### Run Schema Creation
```sql
-- Create sequences
CREATE SEQUENCE HR_EMPLOYEES_SEQ
START WITH 1000
INCREMENT BY 1
NOCACHE;

CREATE SEQUENCE HR_DEPARTMENTS_SEQ
START WITH 100
INCREMENT BY 10
NOCACHE;

-- Tables should already exist if using Oracle HR schema
-- If not, create them based on the schema documentation
```

### 4. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Start Development Server
```bash
npm run dev
```

You should see:
```
Local:   http://localhost:5173/
Network: use --host to expose
```

## Verification Steps

### 1. Backend Health Check
Visit: `http://localhost:5000/health`

Expected response:
```json
{
  "status": "OK",
  "message": "HR API Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Test API Endpoints
```bash
# Get all employees
curl http://localhost:5000/api/employees

# Get all departments
curl http://localhost:5000/api/departments

# Get all jobs
curl http://localhost:5000/api/jobs
```

### 3. Frontend Access
Visit: `http://localhost:5173/`

You should see the React application running.

## Development Workflow

### Starting Development
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Making Changes
1. **Backend changes**: Server auto-restarts with nodemon
2. **Frontend changes**: Hot reload with Vite HMR
3. **Database changes**: Update schema files in `database/` folder

## Troubleshooting

### Oracle Connection Issues

#### Error: "ORA-12541: TNS:no listener"
- Check if Oracle database is running
- Verify connection string in .env file
- Ensure Oracle listener is started

#### Error: "DPI-1047: Cannot locate a 64-bit Oracle Client library"
- Install Oracle Instant Client
- Add to system PATH
- Restart terminal/IDE

#### Error: "ORA-00942: table or view does not exist"
- Verify you're connected to the correct schema
- Check if HR tables exist in your database
- Ensure proper permissions

### Node.js Issues

#### Error: "Cannot find module 'oracledb'"
```bash
cd backend
npm install oracledb
```

#### Error: "Port 5000 already in use"
- Change PORT in backend/.env file
- Update VITE_API_URL in frontend/.env accordingly

### Frontend Issues

#### Error: "CORS error"
- Ensure backend is running on correct port
- Check FRONTEND_URL in backend/.env
- Verify API URLs in frontend code

#### Error: "Network error"
- Check if backend server is running
- Verify API endpoint URLs
- Check browser developer tools for details

## Production Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in .env
2. Use PM2 or similar process manager:
```bash
npm install -g pm2
pm2 start server.js --name hr-api
```

### Frontend Deployment
```bash
npm run build
# Deploy dist/ folder to web server
```

### Database Considerations
- Use connection pooling (already configured)
- Implement proper backup strategy
- Monitor performance and optimize queries
- Set up proper security and user permissions

## Security Checklist

### Backend Security
- [ ] Environment variables properly configured
- [ ] Database credentials secured
- [ ] CORS properly configured
- [ ] Input validation implemented
- [ ] Error messages don't expose sensitive data

### Database Security
- [ ] Separate database user for application
- [ ] Minimum required permissions granted
- [ ] Regular password rotation
- [ ] Connection encryption enabled
- [ ] Audit logging enabled

## Performance Optimization

### Database Performance
- Implement recommended indexes (see database-schema.md)
- Monitor slow queries
- Use connection pooling (already implemented)
- Consider query optimization

### API Performance
- Implement pagination (already done)
- Add caching for frequently accessed data
- Monitor API response times
- Consider rate limiting for production

## Monitoring and Logging

### Backend Monitoring
- Check server logs regularly
- Monitor database connection pool
- Track API response times
- Set up error alerting

### Database Monitoring
- Monitor connection counts
- Check for long-running queries
- Review database performance metrics
- Monitor storage usage

## Support and Documentation

- **Backend API**: See `backend/README.md`
- **Frontend**: See `frontend/README.md`
- **Database Schema**: See `docs/database-schema.md`
- **API Reference**: See `docs/api-documentation.md`

For additional help, refer to:
- [Oracle Database Documentation](https://docs.oracle.com/database/)
- [Node.js oracledb Documentation](https://oracle.github.io/node-oracledb/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
