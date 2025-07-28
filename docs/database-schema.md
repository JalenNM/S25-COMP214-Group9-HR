# Database Schema Documentation

## Oracle HR Schema Tables

### HR_EMPLOYEES
Primary table for employee information.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| EMPLOYEE_ID | NUMBER(6,0) | No | Primary key, unique employee identifier |
| FIRST_NAME | VARCHAR2(20 BYTE) | Yes | Employee's first name |
| LAST_NAME | VARCHAR2(25 BYTE) | No | Employee's last name |
| EMAIL | VARCHAR2(25 BYTE) | No | Employee's email address (unique) |
| PHONE_NUMBER | VARCHAR2(20 BYTE) | Yes | Employee's phone number |
| HIRE_DATE | DATE | No | Date when employee was hired |
| JOB_ID | VARCHAR2(10 BYTE) | No | Foreign key to HR_JOBS |
| SALARY | NUMBER(8,2) | Yes | Employee's salary |
| COMMISSION_PCT | NUMBER(2,2) | Yes | Commission percentage (0.00-0.99) |
| MANAGER_ID | NUMBER(6,0) | Yes | Foreign key to HR_EMPLOYEES (self-reference) |
| DEPARTMENT_ID | NUMBER(4,0) | Yes | Foreign key to HR_DEPARTMENTS |

### HR_DEPARTMENTS
Department information and organization.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| DEPARTMENT_ID | NUMBER(4,0) | No | Primary key, unique department identifier |
| DEPARTMENT_NAME | VARCHAR2(30 BYTE) | No | Department name |
| MANAGER_ID | NUMBER(6,0) | Yes | Foreign key to HR_EMPLOYEES |
| LOCATION_ID | NUMBER(4,0) | Yes | Foreign key to HR_LOCATIONS |

### HR_JOBS
Job positions and salary ranges.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| JOB_ID | VARCHAR2(10 BYTE) | No | Primary key, unique job identifier |
| JOB_TITLE | VARCHAR2(35 BYTE) | No | Job title/position name |
| MIN_SALARY | NUMBER(6,0) | Yes | Minimum salary for this position |
| MAX_SALARY | NUMBER(6,0) | Yes | Maximum salary for this position |

### HR_LOCATIONS
Office locations and addresses.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| LOCATION_ID | NUMBER(4,0) | No | Primary key, unique location identifier |
| STREET_ADDRESS | VARCHAR2(40 BYTE) | Yes | Street address |
| POSTAL_CODE | VARCHAR2(12 BYTE) | Yes | Postal/ZIP code |
| CITY | VARCHAR2(30 BYTE) | No | City name |
| STATE_PROVINCE | VARCHAR2(25 BYTE) | Yes | State or province |
| COUNTRY_ID | CHAR(2 BYTE) | Yes | Foreign key to HR_COUNTRIES |

### HR_COUNTRIES
Country information.

| Column | Type | Null | Description |
|--------|------|------|-------------|
| COUNTRY_ID | CHAR(2 BYTE) | No | Primary key, ISO country code |
| COUNTRY_NAME | VARCHAR2(40 BYTE) | Yes | Country name |
| REGION_ID | NUMBER | Yes | Region identifier |

## Relationships

### Primary Relationships
- **HR_EMPLOYEES.JOB_ID** → HR_JOBS.JOB_ID
- **HR_EMPLOYEES.MANAGER_ID** → HR_EMPLOYEES.EMPLOYEE_ID (self-reference)
- **HR_EMPLOYEES.DEPARTMENT_ID** → HR_DEPARTMENTS.DEPARTMENT_ID
- **HR_DEPARTMENTS.MANAGER_ID** → HR_EMPLOYEES.EMPLOYEE_ID
- **HR_DEPARTMENTS.LOCATION_ID** → HR_LOCATIONS.LOCATION_ID
- **HR_LOCATIONS.COUNTRY_ID** → HR_COUNTRIES.COUNTRY_ID

## Required Sequences

```sql
-- Employee ID sequence
CREATE SEQUENCE HR_EMPLOYEES_SEQ
START WITH 1000
INCREMENT BY 1
NOCACHE;

-- Department ID sequence  
CREATE SEQUENCE HR_DEPARTMENTS_SEQ
START WITH 100
INCREMENT BY 10
NOCACHE;
```

## Indexes

### Recommended Indexes for Performance
```sql
-- Employee indexes
CREATE INDEX IDX_EMP_EMAIL ON HR_EMPLOYEES(EMAIL);
CREATE INDEX IDX_EMP_DEPT ON HR_EMPLOYEES(DEPARTMENT_ID);
CREATE INDEX IDX_EMP_JOB ON HR_EMPLOYEES(JOB_ID);
CREATE INDEX IDX_EMP_MANAGER ON HR_EMPLOYEES(MANAGER_ID);

-- Department indexes
CREATE INDEX IDX_DEPT_MANAGER ON HR_DEPARTMENTS(MANAGER_ID);
CREATE INDEX IDX_DEPT_LOCATION ON HR_DEPARTMENTS(LOCATION_ID);

-- Location indexes
CREATE INDEX IDX_LOC_COUNTRY ON HR_LOCATIONS(COUNTRY_ID);
```

## Business Rules

### Employee Rules
1. Employee email must be unique
2. Hire date cannot be in the future
3. Salary must be within job's min/max range (if specified)
4. Commission percentage must be between 0.00 and 0.99
5. Manager must be a valid employee
6. Employee cannot be their own manager

### Department Rules
1. Department name must be unique
2. Department manager must be a valid employee
3. Cannot delete department with active employees

### Job Rules
1. Job ID must be unique
2. Min salary cannot be greater than max salary
3. Cannot delete job with active employees

## Sample Queries

### Complex Queries Used in API

```sql
-- Employee with department and job information
SELECT 
  e.EMPLOYEE_ID,
  e.FIRST_NAME,
  e.LAST_NAME,
  e.EMAIL,
  e.SALARY,
  j.JOB_TITLE,
  d.DEPARTMENT_NAME,
  m.FIRST_NAME || ' ' || m.LAST_NAME as MANAGER_NAME
FROM HR_EMPLOYEES e
LEFT JOIN HR_JOBS j ON e.JOB_ID = j.JOB_ID
LEFT JOIN HR_DEPARTMENTS d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
LEFT JOIN HR_EMPLOYEES m ON e.MANAGER_ID = m.EMPLOYEE_ID;

-- Department statistics
SELECT 
  d.DEPARTMENT_NAME,
  COUNT(e.EMPLOYEE_ID) as EMPLOYEE_COUNT,
  AVG(e.SALARY) as AVERAGE_SALARY,
  SUM(e.SALARY) as TOTAL_SALARY_COST
FROM HR_DEPARTMENTS d
LEFT JOIN HR_EMPLOYEES e ON d.DEPARTMENT_ID = e.DEPARTMENT_ID
GROUP BY d.DEPARTMENT_ID, d.DEPARTMENT_NAME;
```
