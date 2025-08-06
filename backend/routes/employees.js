const express = require('express');
const { executeQuery } = require('../db/connection');
const router = express.Router();

/**
 * GET /api/employees
 * Get all employees with optional pagination
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    
    // If pagination parameters are provided, use pagination
    if (page && limit) {
      const offset = (page - 1) * limit;
      
      const sql = `
        SELECT 
          e.EMPLOYEE_ID,
          e.FIRST_NAME,
          e.LAST_NAME,
          e.EMAIL,
          e.PHONE_NUMBER,
          e.HIRE_DATE,
          e.SALARY,
          j.JOB_TITLE,
          d.DEPARTMENT_NAME,
          m.FIRST_NAME || ' ' || m.LAST_NAME as MANAGER_NAME
        FROM HR_EMPLOYEES e
        LEFT JOIN HR_JOBS j ON e.JOB_ID = j.JOB_ID
        LEFT JOIN HR_DEPARTMENTS d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
        LEFT JOIN HR_EMPLOYEES m ON e.MANAGER_ID = m.EMPLOYEE_ID
        ORDER BY e.EMPLOYEE_ID
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;
      
      const countSql = 'SELECT COUNT(*) as TOTAL FROM HR_EMPLOYEES';
      
      const [employees, count] = await Promise.all([
        executeQuery(sql, { offset, limit }),
        executeQuery(countSql)
      ]);
      
      res.json({
        data: employees.rows,
        pagination: {
          page,
          limit,
          total: count.rows[0].TOTAL,
          totalPages: Math.ceil(count.rows[0].TOTAL / limit)
        }
      });
    } else {
      // Return all employees without pagination
      const sql = `
        SELECT 
          e.EMPLOYEE_ID,
          e.FIRST_NAME,
          e.LAST_NAME,
          e.EMAIL,
          e.PHONE_NUMBER,
          e.HIRE_DATE,
          e.SALARY,
          j.JOB_TITLE,
          d.DEPARTMENT_NAME,
          m.FIRST_NAME || ' ' || m.LAST_NAME as MANAGER_NAME
        FROM HR_EMPLOYEES e
        LEFT JOIN HR_JOBS j ON e.JOB_ID = j.JOB_ID
        LEFT JOIN HR_DEPARTMENTS d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
        LEFT JOIN HR_EMPLOYEES m ON e.MANAGER_ID = m.EMPLOYEE_ID
        ORDER BY e.EMPLOYEE_ID
      `;
      
      const employees = await executeQuery(sql);
      
      res.json({
        data: employees.rows,
        total: employees.rows.length
      });
    }
    
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

/**
 * GET /api/employees/stats
 * Get employee statistics and analytics
 */
router.get('/stats', async (req, res) => {
  try {
    // Department-wise employee statistics
    const deptStatsSql = `
      SELECT 
        d.DEPARTMENT_NAME,
        COUNT(e.EMPLOYEE_ID) as EMPLOYEE_COUNT,
        AVG(e.SALARY) as AVERAGE_SALARY,
        MIN(e.SALARY) as MIN_SALARY,
        MAX(e.SALARY) as MAX_SALARY,
        SUM(e.SALARY) as TOTAL_SALARY
      FROM HR_DEPARTMENTS d
      LEFT JOIN HR_EMPLOYEES e ON d.DEPARTMENT_ID = e.DEPARTMENT_ID
      GROUP BY d.DEPARTMENT_ID, d.DEPARTMENT_NAME
      ORDER BY EMPLOYEE_COUNT DESC
    `;
    
    // Job-wise employee statistics
    const jobStatsSql = `
      SELECT 
        j.JOB_TITLE,
        COUNT(e.EMPLOYEE_ID) as EMPLOYEE_COUNT,
        AVG(e.SALARY) as AVERAGE_SALARY,
        MIN(e.SALARY) as MIN_SALARY,
        MAX(e.SALARY) as MAX_SALARY
      FROM HR_JOBS j
      LEFT JOIN HR_EMPLOYEES e ON j.JOB_ID = e.JOB_ID
      GROUP BY j.JOB_ID, j.JOB_TITLE
      ORDER BY EMPLOYEE_COUNT DESC
    `;
    
    // Overall statistics
    const overallStatsSql = `
      SELECT 
        COUNT(*) as TOTAL_EMPLOYEES,
        AVG(SALARY) as OVERALL_AVERAGE_SALARY,
        MIN(SALARY) as OVERALL_MIN_SALARY,
        MAX(SALARY) as OVERALL_MAX_SALARY,
        SUM(SALARY) as TOTAL_PAYROLL,
        COUNT(CASE WHEN MANAGER_ID IS NULL THEN 1 END) as TOP_LEVEL_MANAGERS,
        COUNT(CASE WHEN COMMISSION_PCT IS NOT NULL THEN 1 END) as EMPLOYEES_WITH_COMMISSION
      FROM HR_EMPLOYEES
    `;
    
    const [deptStats, jobStats, overallStats] = await Promise.all([
      executeQuery(deptStatsSql),
      executeQuery(jobStatsSql),
      executeQuery(overallStatsSql)
    ]);
    
    res.json({
      departmentStats: deptStats.rows,
      jobStats: jobStats.rows,
      overallStats: overallStats.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching employee statistics:', error);
    res.status(500).json({ error: 'Failed to fetch employee statistics' });
  }
});

/**
 * GET /api/employees/search
 * Search employees by query parameter
 */
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q;
    
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search query parameter "q" is required' });
    }
    
    const searchPattern = `%${searchTerm}%`;
    
    const sql = `
      SELECT 
        e.EMPLOYEE_ID,
        e.FIRST_NAME,
        e.LAST_NAME,
        e.EMAIL,
        e.PHONE_NUMBER,
        e.HIRE_DATE,
        e.SALARY,
        e.COMMISSION_PCT,
        e.JOB_ID,
        j.JOB_TITLE,
        e.DEPARTMENT_ID,
        d.DEPARTMENT_NAME,
        e.MANAGER_ID,
        m.FIRST_NAME || ' ' || m.LAST_NAME as MANAGER_NAME
      FROM HR_EMPLOYEES e
      LEFT JOIN HR_JOBS j ON e.JOB_ID = j.JOB_ID
      LEFT JOIN HR_DEPARTMENTS d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
      LEFT JOIN HR_EMPLOYEES m ON e.MANAGER_ID = m.EMPLOYEE_ID
      WHERE UPPER(e.FIRST_NAME) LIKE UPPER(:searchPattern)
         OR UPPER(e.LAST_NAME) LIKE UPPER(:searchPattern)
         OR UPPER(e.EMAIL) LIKE UPPER(:searchPattern)
         OR TO_CHAR(e.EMPLOYEE_ID) LIKE :searchPattern
         OR UPPER(j.JOB_TITLE) LIKE UPPER(:searchPattern)
         OR UPPER(d.DEPARTMENT_NAME) LIKE UPPER(:searchPattern)
      ORDER BY e.LAST_NAME, e.FIRST_NAME
    `;
    
    const result = await executeQuery(sql, { searchPattern });
    
    res.json({ data: result.rows });
    
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({ error: 'Failed to search employees' });
  }
});

/**
 * GET /api/employees/:id
 * Get a specific employee by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    const sql = `
      SELECT 
        e.EMPLOYEE_ID,
        e.FIRST_NAME,
        e.LAST_NAME,
        e.EMAIL,
        e.PHONE_NUMBER,
        e.HIRE_DATE,
        e.SALARY,
        e.COMMISSION_PCT,
        j.JOB_TITLE,
        j.JOB_ID,
        d.DEPARTMENT_NAME,
        d.DEPARTMENT_ID,
        m.FIRST_NAME || ' ' || m.LAST_NAME as MANAGER_NAME,
        e.MANAGER_ID
      FROM HR_EMPLOYEES e
      LEFT JOIN HR_JOBS j ON e.JOB_ID = j.JOB_ID
      LEFT JOIN HR_DEPARTMENTS d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
      LEFT JOIN HR_EMPLOYEES m ON e.MANAGER_ID = m.EMPLOYEE_ID
      WHERE e.EMPLOYEE_ID = :employeeId
    `;
    
    const result = await executeQuery(sql, { employeeId });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ data: result.rows[0] });
    
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

/**
 * POST /api/employees
 * Create a new employee
 */
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      hireDate,
      jobId,
      salary,
      commissionPct,
      managerId,
      departmentId
    } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !jobId) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email, jobId' 
      });
    }
    
    // Validate field lengths based on schema
    if (firstName && firstName.length > 20) {
      return res.status(400).json({ error: 'First name cannot exceed 20 characters' });
    }
    
    if (lastName.length > 25) {
      return res.status(400).json({ error: 'Last name cannot exceed 25 characters' });
    }
    
    if (email.length > 25) {
      return res.status(400).json({ error: 'Email cannot exceed 25 characters' });
    }
    
    if (phoneNumber && phoneNumber.length > 20) {
      return res.status(400).json({ error: 'Phone number cannot exceed 20 characters' });
    }
    
    // Validate foreign key references
    if (jobId) {
      const jobCheckSql = 'SELECT COUNT(*) as COUNT FROM HR_JOBS WHERE JOB_ID = :jobId';
      const jobCheck = await executeQuery(jobCheckSql, { jobId });
      
      if (jobCheck.rows[0].COUNT === 0) {
        return res.status(400).json({ error: 'Invalid job ID - job not found' });
      }
    }
    
    if (managerId) {
      const managerCheckSql = 'SELECT COUNT(*) as COUNT FROM HR_EMPLOYEES WHERE EMPLOYEE_ID = :managerId';
      const managerCheck = await executeQuery(managerCheckSql, { managerId });
      
      if (managerCheck.rows[0].COUNT === 0) {
        return res.status(400).json({ error: 'Invalid manager ID - employee not found' });
      }
    }
    
    if (departmentId) {
      const deptCheckSql = 'SELECT COUNT(*) as COUNT FROM HR_DEPARTMENTS WHERE DEPARTMENT_ID = :departmentId';
      const deptCheck = await executeQuery(deptCheckSql, { departmentId });
      
      if (deptCheck.rows[0].COUNT === 0) {
        return res.status(400).json({ error: 'Invalid department ID - department not found' });
      }
    }
    
    // Validate salary and commission ranges
    if (salary && (salary < 0 || salary > 999999.99)) {
      return res.status(400).json({ error: 'Salary must be between 0 and 999,999.99' });
    }
    
    if (commissionPct && (commissionPct < 0 || commissionPct > 0.99)) {
      return res.status(400).json({ error: 'Commission percentage must be between 0.00 and 0.99' });
    }
    
    const sql = `
      INSERT INTO HR_EMPLOYEES (
        EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL, PHONE_NUMBER,
        HIRE_DATE, JOB_ID, SALARY, COMMISSION_PCT, MANAGER_ID, DEPARTMENT_ID
      ) VALUES (
        HR_EMPLOYEES_SEQ.NEXTVAL, :firstName, :lastName, :email, :phoneNumber,
        :hireDate, :jobId, :salary, :commissionPct, :managerId, :departmentId
      )
    `;
    
    const binds = {
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || null,
      hireDate: hireDate || new Date(),
      jobId,
      salary: salary || null,
      commissionPct: commissionPct || null,
      managerId: managerId || null,
      departmentId: departmentId || null
    };
    
    await executeQuery(sql, binds);
    
    res.status(201).json({ 
      message: 'Employee created successfully',
      data: { email }
    });
    
  } catch (error) {
    console.error('Error creating employee:', error);
    
    // Handle specific Oracle errors
    if (error.errorNum === 1) {
      res.status(409).json({ error: 'Employee with this email already exists' });
    } else if (error.errorNum === 2291) {
      res.status(400).json({ error: 'Invalid foreign key reference (job, manager, or department)' });
    } else if (error.errorNum === 12899) {
      res.status(400).json({ error: 'One or more field values exceed maximum length' });
    } else if (error.errorNum === 1438) {
      res.status(400).json({ error: 'Numeric value is too large for the field precision' });
    } else {
      res.status(500).json({ error: 'Failed to create employee' });
    }
  }
});

/**
 * POST /api/employees/hire
 * Hire a new employee using stored procedure
 */
router.post('/hire', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      jobId,
      salary,
      commissionPct,
      managerId,
      departmentId
    } = req.body;

    // Debug: Log the incoming request data
    console.log('Hire request data:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!firstName || !lastName || !email || !jobId) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({ 
        error: 'First name, last name, email, and job ID are required' 
      });
    }

    // Call the stored procedure
    const sql = `
      BEGIN
        employee_hire_sp(
          p_first_name => :firstName,
          p_last_name => :lastName,
          p_email => :email,
          p_phone_number => :phoneNumber,
          p_job_id => :jobId,
          p_salary => :salary,
          p_commission_pct => :commissionPct,
          p_manager_id => :managerId,
          p_department_id => :departmentId
        );
      END;
    `;
    
    const binds = {
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || null,
      jobId,
      salary: salary || null,
      commissionPct: commissionPct || null,
      managerId: managerId || null,
      departmentId: departmentId || null
    };

    // Debug: Log the bind parameters
    console.log('Bind parameters:', JSON.stringify(binds, null, 2));

    await executeQuery(sql, binds);
    
    res.status(201).json({ 
      message: 'Employee hired successfully',
      data: { email }
    });
    
  } catch (error) {
    console.error('Error hiring employee:', error);
    console.error('Error details:', {
      message: error.message,
      errorNum: error.errorNum,
      offset: error.offset,
      stack: error.stack
    });
    
    // Handle specific Oracle errors
    if (error.errorNum === 1) {
      res.status(409).json({ error: 'Employee with this email already exists' });
    } else if (error.errorNum === 2291) {
      res.status(400).json({ error: 'Invalid foreign key reference (job, manager, or department)' });
    } else if (error.errorNum === 12899) {
      res.status(400).json({ error: 'One or more field values exceed maximum length' });
    } else if (error.errorNum === 1438) {
      res.status(400).json({ error: 'Numeric value is too large for the field precision' });
    } else if (error.errorNum === 20100) {
      // Handle salary validation trigger error
      res.status(400).json({ error: error.message || 'Salary out of range for the selected job position' });
    } else if (error.errorNum === 20101) {
      // Handle job ID validation trigger error
      res.status(400).json({ error: error.message || 'Invalid job ID specified' });
    } else {
      res.status(500).json({ error: 'Failed to hire employee: ' + error.message });
    }
  }
});

/**
 * PUT /api/employees/:id
 * Update an existing employee
 */
router.put('/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      jobId,
      salary,
      commissionPct,
      managerId,
      departmentId
    } = req.body;
    
    // Validation for field lengths
    if (firstName && firstName.length > 20) {
      return res.status(400).json({ error: 'First name cannot exceed 20 characters' });
    }
    
    if (lastName && lastName.length > 25) {
      return res.status(400).json({ error: 'Last name cannot exceed 25 characters' });
    }
    
    if (email && email.length > 25) {
      return res.status(400).json({ error: 'Email cannot exceed 25 characters' });
    }
    
    if (phoneNumber && phoneNumber.length > 20) {
      return res.status(400).json({ error: 'Phone number cannot exceed 20 characters' });
    }
    
    // Validate foreign key references if provided
    if (jobId) {
      const jobCheckSql = 'SELECT COUNT(*) as COUNT FROM HR_JOBS WHERE JOB_ID = :jobId';
      const jobCheck = await executeQuery(jobCheckSql, { jobId });
      
      if (jobCheck.rows[0].COUNT === 0) {
        return res.status(400).json({ error: 'Invalid job ID - job not found' });
      }
    }
    
    if (managerId) {
      const managerCheckSql = 'SELECT COUNT(*) as COUNT FROM HR_EMPLOYEES WHERE EMPLOYEE_ID = :managerId';
      const managerCheck = await executeQuery(managerCheckSql, { managerId });
      
      if (managerCheck.rows[0].COUNT === 0) {
        return res.status(400).json({ error: 'Invalid manager ID - employee not found' });
      }
    }
    
    if (departmentId) {
      const deptCheckSql = 'SELECT COUNT(*) as COUNT FROM HR_DEPARTMENTS WHERE DEPARTMENT_ID = :departmentId';
      const deptCheck = await executeQuery(deptCheckSql, { departmentId });
      
      if (deptCheck.rows[0].COUNT === 0) {
        return res.status(400).json({ error: 'Invalid department ID - department not found' });
      }
    }
    
    // Validate salary and commission ranges
    if (salary && (salary < 0 || salary > 999999.99)) {
      return res.status(400).json({ error: 'Salary must be between 0 and 999,999.99' });
    }
    
    if (commissionPct && (commissionPct < 0 || commissionPct > 0.99)) {
      return res.status(400).json({ error: 'Commission percentage must be between 0.00 and 0.99' });
    }
    
    const sql = `
      UPDATE HR_EMPLOYEES SET
        FIRST_NAME = :firstName,
        LAST_NAME = :lastName,
        EMAIL = :email,
        PHONE_NUMBER = :phoneNumber,
        JOB_ID = :jobId,
        SALARY = :salary,
        COMMISSION_PCT = :commissionPct,
        MANAGER_ID = :managerId,
        DEPARTMENT_ID = :departmentId
      WHERE EMPLOYEE_ID = :employeeId
    `;
    
    const binds = {
      employeeId,
      firstName,
      lastName,
      email,
      phoneNumber,
      jobId,
      salary,
      commissionPct,
      managerId,
      departmentId
    };
    
    const result = await executeQuery(sql, binds);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee updated successfully' });
    
  } catch (error) {
    console.error('Error updating employee:', error);
    
    // Handle specific Oracle errors
    if (error.errorNum === 1) {
      res.status(409).json({ error: 'Employee with this email already exists' });
    } else if (error.errorNum === 2291) {
      res.status(400).json({ error: 'Invalid foreign key reference (job, manager, or department)' });
    } else if (error.errorNum === 12899) {
      res.status(400).json({ error: 'One or more field values exceed maximum length' });
    } else if (error.errorNum === 1438) {
      res.status(400).json({ error: 'Numeric value is too large for the field precision' });
    } else if (error.errorNum === 20100) {
      // Handle salary validation trigger error
      res.status(400).json({ error: error.message || 'Salary out of range for the selected job position' });
    } else if (error.errorNum === 20101) {
      // Handle job ID validation trigger error
      res.status(400).json({ error: error.message || 'Invalid job ID specified' });
    } else {
      res.status(500).json({ error: 'Failed to update employee' });
    }
  }
});

/**
 * DELETE /api/employees/:id
 * Delete an employee
 */
router.delete('/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    const sql = 'DELETE FROM HR_EMPLOYEES WHERE EMPLOYEE_ID = :employeeId';
    const result = await executeQuery(sql, { employeeId });
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

/**
 * GET /api/employees/search/:term
 * Search employees by name or email
 */
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = `%${req.params.term}%`;
    
    const sql = `
      SELECT 
        e.EMPLOYEE_ID,
        e.FIRST_NAME,
        e.LAST_NAME,
        e.EMAIL,
        e.PHONE_NUMBER,
        e.HIRE_DATE,
        e.SALARY,
        e.COMMISSION_PCT,
        e.JOB_ID,
        j.JOB_TITLE,
        e.DEPARTMENT_ID,
        d.DEPARTMENT_NAME,
        e.MANAGER_ID,
        m.FIRST_NAME || ' ' || m.LAST_NAME as MANAGER_NAME
      FROM HR_EMPLOYEES e
      LEFT JOIN HR_JOBS j ON e.JOB_ID = j.JOB_ID
      LEFT JOIN HR_DEPARTMENTS d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
      LEFT JOIN HR_EMPLOYEES m ON e.MANAGER_ID = m.EMPLOYEE_ID
      WHERE UPPER(e.FIRST_NAME) LIKE UPPER(:searchTerm)
         OR UPPER(e.LAST_NAME) LIKE UPPER(:searchTerm)
         OR UPPER(e.EMAIL) LIKE UPPER(:searchTerm)
         OR TO_CHAR(e.EMPLOYEE_ID) LIKE :searchTerm
         OR UPPER(j.JOB_TITLE) LIKE UPPER(:searchTerm)
         OR UPPER(d.DEPARTMENT_NAME) LIKE UPPER(:searchTerm)
      ORDER BY e.LAST_NAME, e.FIRST_NAME
    `;
    
    const result = await executeQuery(sql, { searchTerm });
    
    res.json({ data: result.rows });
    
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({ error: 'Failed to search employees' });
  }
});

module.exports = router;
