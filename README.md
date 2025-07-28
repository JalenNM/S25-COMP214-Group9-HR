# HR Management System - COMP214 Group 9

A full-stack Human Resources Management System built with React (frontend) and Node.js/Express (backend), connected to an Oracle database.

## Project Structure

```
s25-comp214-group9-hr/
├── README.md                    # Main project documentation
├── .gitignore                   # Root gitignore
├── docs/                        # Project documentation
│   ├── api-documentation.md     # API endpoints documentation
│   ├── database-schema.md       # Database schema and relationships
│   └── setup-guide.md          # Complete setup instructions
├── database/                    # Database scripts and schemas
│   ├── schema.sql              # Database table creation scripts
│   ├── sample-data.sql         # Sample HR data for testing
│   └── procedures.sql          # Stored procedures and functions
├── backend/                     # Node.js/Express API Server
│   ├── package.json            # Backend dependencies
│   ├── server.js               # Main server entry point
│   ├── .env.example            # Environment variables template
│   ├── .env                    # Environment variables (not in git)
│   ├── .gitignore              # Backend specific gitignore
│   ├── README.md               # Backend documentation
│   ├── db/                     # Database connection and utilities
│   │   └── connection.js       # Oracle database connection pool
│   └── routes/                 # API route handlers
│       ├── employees.js        # Employee CRUD operations
│       ├── departments.js      # Department management
│       └── jobs.js             # Job position management
└── frontend/                   # React/Vite Application
    ├── package.json            # Frontend dependencies
    ├── vite.config.js          # Vite configuration
    ├── index.html              # HTML entry point
    ├── .gitignore              # Frontend specific gitignore
    ├── README.md               # Frontend documentation
    ├── public/                 # Static assets
    │   └── vite.svg            # Vite logo
    └── src/                    # React source code
        ├── main.jsx            # React entry point
        ├── App.jsx             # Main App component
        ├── App.css             # App styles
        ├── index.css           # Global styles
        ├── components/         # Reusable React components
        ├── pages/              # Page components (routes)
        ├── services/           # API service functions
        └── assets/             # Images, icons, etc.
```

## Features

### Backend API
- **Employee Management**: Complete CRUD operations with validation
- **Department Management**: Department and location handling
- **Job Management**: Job positions with salary ranges
- **Analytics Endpoints**: Statistics and reporting
- **Oracle Integration**: Professional database connection pooling
- **Data Validation**: Schema-compliant field validation
- **Error Handling**: Comprehensive Oracle error handling

### Frontend (React)
- **Modern UI**: Built with React 18 and Vite
- **Responsive Design**: Mobile-friendly interface
- **Component Architecture**: Modular and reusable components
- **API Integration**: Seamless backend communication
- **Form Validation**: Client-side and server-side validation

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Oracle Database
- **ORM**: oracledb (Official Oracle driver)
- **Security**: Helmet, CORS
- **Environment**: dotenv

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS3 (ready for CSS frameworks)
- **HTTP Client**: Fetch API (ready for Axios)
- **Routing**: React Router (to be added)

## 📋 Prerequisites

1. **Oracle Database**: Access to Oracle database (local or cloud)
2. **Oracle Client Libraries**: Oracle Instant Client installed
3. **Node.js**: Version 16 or higher
4. **Git**: For version control

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd s25-comp214-group9-hr
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Oracle database credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Database Setup
```bash
# Run the SQL scripts in database/ folder in your Oracle database
sqlplus username/password@database < database/schema.sql
sqlplus username/password@database < database/sample-data.sql
```

## Documentation

- **[API Documentation](docs/api-documentation.md)**: Complete API reference
- **[Database Schema](docs/database-schema.md)**: Database structure and relationships
- **[Setup Guide](docs/setup-guide.md)**: Detailed installation instructions
- **[Backend README](backend/README.md)**: Backend specific documentation
- **[Frontend README](frontend/README.md)**: Frontend specific documentation

## API Endpoints

### Core Endpoints
- **Employees**: `/api/employees` - CRUD operations
- **Departments**: `/api/departments` - Department management
- **Jobs**: `/api/jobs` - Job position management

### Analytics Endpoints
- **Employee Stats**: `/api/employees/stats` - Employee analytics
- **Department Stats**: `/api/departments/stats` - Department analytics
- **Job Stats**: `/api/jobs/stats` - Job market analytics

## Academic Information

- **Course**: COMP214 - Advanced Database Concepts
- **Section**: SEC401
- **Group**: Group 9
- **Institution**: Centennial College
- **Semester**: Summer 2025

## Team Members

- [Add team member names here]

## License

This project is for academic purposes as part of COMP214 coursework at Centennial College.

---

**Note**: This project demonstrates advanced database concepts including Oracle integration, connection pooling, complex queries, and professional API development practices.
