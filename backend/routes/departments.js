const express = require('express');
const { executeQuery } = require('../db/connection');
const router = express.Router();

/**
 * GET /api/departments
 * Get all departments
 */
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        d.DEPARTMENT_ID,
        d.DEPARTMENT_NAME,
        d.MANAGER_ID,
        m.FIRST_NAME || ' ' || m.LAST_NAME as MANAGER_NAME,
        l.STREET_ADDRESS || ', ' || l.CITY || ', ' || l.STATE_PROVINCE as LOCATION,
        COUNT(e.EMPLOYEE_ID) as EMPLOYEE_COUNT
      FROM HR_DEPARTMENTS d
      LEFT JOIN HR_EMPLOYEES m ON d.MANAGER_ID = m.EMPLOYEE_ID
      LEFT JOIN HR_LOCATIONS l ON d.LOCATION_ID = l.LOCATION_ID
      LEFT JOIN HR_EMPLOYEES e ON d.DEPARTMENT_ID = e.DEPARTMENT_ID
      GROUP BY d.DEPARTMENT_ID, d.DEPARTMENT_NAME, d.MANAGER_ID, 
               m.FIRST_NAME, m.LAST_NAME, l.STREET_ADDRESS, l.CITY, l.STATE_PROVINCE
      ORDER BY d.DEPARTMENT_NAME
    `;
    
    const result = await executeQuery(sql);
    
    res.json({ data: result.rows });
    
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

/**
 * GET /api/departments/stats
 * Get department statistics and analytics
 */
router.get('/stats', async (req, res) => {
  try {
    const sql = `
      SELECT 
        d.DEPARTMENT_ID,
        d.DEPARTMENT_NAME,
        COUNT(e.EMPLOYEE_ID) as EMPLOYEE_COUNT,
        AVG(e.SALARY) as AVERAGE_SALARY,
        MIN(e.SALARY) as MIN_SALARY,
        MAX(e.SALARY) as MAX_SALARY,
        SUM(e.SALARY) as TOTAL_SALARY_COST,
        COUNT(CASE WHEN e.MANAGER_ID IS NULL THEN 1 END) as MANAGERS_COUNT,
        m.FIRST_NAME || ' ' || m.LAST_NAME as MANAGER_NAME,
        l.CITY || ', ' || l.STATE_PROVINCE as LOCATION
      FROM HR_DEPARTMENTS d
      LEFT JOIN HR_EMPLOYEES e ON d.DEPARTMENT_ID = e.DEPARTMENT_ID
      LEFT JOIN HR_EMPLOYEES m ON d.MANAGER_ID = m.EMPLOYEE_ID
      LEFT JOIN HR_LOCATIONS l ON d.LOCATION_ID = l.LOCATION_ID
      GROUP BY d.DEPARTMENT_ID, d.DEPARTMENT_NAME, d.MANAGER_ID, 
               m.FIRST_NAME, m.LAST_NAME, l.CITY, l.STATE_PROVINCE
      ORDER BY EMPLOYEE_COUNT DESC, d.DEPARTMENT_NAME
    `;
    
    const result = await executeQuery(sql);
    
    // Calculate overall statistics
    const overallSql = `
      SELECT 
        COUNT(DISTINCT d.DEPARTMENT_ID) as TOTAL_DEPARTMENTS,
        COUNT(e.EMPLOYEE_ID) as TOTAL_EMPLOYEES,
        AVG(e.SALARY) as OVERALL_AVERAGE_SALARY,
        SUM(e.SALARY) as TOTAL_PAYROLL
      FROM HR_DEPARTMENTS d
      LEFT JOIN HR_EMPLOYEES e ON d.DEPARTMENT_ID = e.DEPARTMENT_ID
    `;
    
    const overallResult = await executeQuery(overallSql);
    
    res.json({
      data: result.rows,
      summary: overallResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching department statistics:', error);
    res.status(500).json({ error: 'Failed to fetch department statistics' });
  }
});

/**
 * GET /api/departments/:id
 * Get a specific department by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    const sql = `
      SELECT 
        d.DEPARTMENT_ID,
        d.DEPARTMENT_NAME,
        d.MANAGER_ID,
        m.FIRST_NAME || ' ' || m.LAST_NAME as MANAGER_NAME,
        d.LOCATION_ID,
        l.STREET_ADDRESS,
        l.CITY,
        l.STATE_PROVINCE,
        l.POSTAL_CODE,
        c.COUNTRY_NAME
      FROM HR_DEPARTMENTS d
      LEFT JOIN HR_EMPLOYEES m ON d.MANAGER_ID = m.EMPLOYEE_ID
      LEFT JOIN HR_LOCATIONS l ON d.LOCATION_ID = l.LOCATION_ID
      LEFT JOIN HR_COUNTRIES c ON l.COUNTRY_ID = c.COUNTRY_ID
      WHERE d.DEPARTMENT_ID = :departmentId
    `;
    
    const result = await executeQuery(sql, { departmentId });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ data: result.rows[0] });
    
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

/**
 * GET /api/departments/:id/employees
 * Get all employees in a specific department
 */
router.get('/:id/employees', async (req, res) => {
  try {
    const departmentId = req.params.id;
    
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
        m.FIRST_NAME || ' ' || m.LAST_NAME as MANAGER_NAME
      FROM HR_EMPLOYEES e
      LEFT JOIN HR_JOBS j ON e.JOB_ID = j.JOB_ID
      LEFT JOIN HR_EMPLOYEES m ON e.MANAGER_ID = m.EMPLOYEE_ID
      WHERE e.DEPARTMENT_ID = :departmentId
      ORDER BY e.LAST_NAME, e.FIRST_NAME
    `;
    
    const result = await executeQuery(sql, { departmentId });
    
    res.json({ data: result.rows });
    
  } catch (error) {
    console.error('Error fetching department employees:', error);
    res.status(500).json({ error: 'Failed to fetch department employees' });
  }
});

/**
 * POST /api/departments
 * Create a new department
 */
router.post('/', async (req, res) => {
  try {
    const { departmentName, managerId, locationId } = req.body;
    
    // Validation
    if (!departmentName) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    
    if (departmentName.length > 30) {
      return res.status(400).json({ error: 'Department name cannot exceed 30 characters' });
    }
    
    // Validate managerId is a valid employee if provided
    if (managerId) {
      const managerCheckSql = 'SELECT COUNT(*) as COUNT FROM HR_EMPLOYEES WHERE EMPLOYEE_ID = :managerId';
      const managerCheck = await executeQuery(managerCheckSql, { managerId });
      
      if (managerCheck.rows[0].COUNT === 0) {
        return res.status(400).json({ error: 'Invalid manager ID - employee not found' });
      }
    }
    
    // Validate locationId is valid if provided
    if (locationId) {
      const locationCheckSql = 'SELECT COUNT(*) as COUNT FROM HR_LOCATIONS WHERE LOCATION_ID = :locationId';
      const locationCheck = await executeQuery(locationCheckSql, { locationId });
      
      if (locationCheck.rows[0].COUNT === 0) {
        return res.status(400).json({ error: 'Invalid location ID - location not found' });
      }
    }
    
    const sql = `
      INSERT INTO HR_DEPARTMENTS (DEPARTMENT_ID, DEPARTMENT_NAME, MANAGER_ID, LOCATION_ID)
      VALUES (HR_DEPARTMENTS_SEQ.NEXTVAL, :departmentName, :managerId, :locationId)
    `;
    
    const binds = {
      departmentName,
      managerId: managerId || null,
      locationId: locationId || null
    };
    
    await executeQuery(sql, binds);
    
    res.status(201).json({ 
      message: 'Department created successfully',
      data: { departmentName }
    });
    
  } catch (error) {
    console.error('Error creating department:', error);
    
    // Handle specific Oracle errors
    if (error.errorNum === 1) {
      res.status(409).json({ error: 'Department with this name already exists' });
    } else if (error.errorNum === 2291) {
      res.status(400).json({ error: 'Invalid foreign key reference (manager or location)' });
    } else if (error.errorNum === 12899) {
      res.status(400).json({ error: 'Department name exceeds maximum length (30 characters)' });
    } else {
      res.status(500).json({ error: 'Failed to create department' });
    }
  }
});

/**
 * PUT /api/departments/:id
 * Update an existing department
 */
router.put('/:id', async (req, res) => {
  try {
    const departmentId = req.params.id;
    const { departmentName, managerId, locationId } = req.body;
    
    // Validation
    if (departmentName && departmentName.length > 30) {
      return res.status(400).json({ error: 'Department name cannot exceed 30 characters' });
    }
    
    // Validate managerId is a valid employee if provided
    if (managerId) {
      const managerCheckSql = 'SELECT COUNT(*) as COUNT FROM HR_EMPLOYEES WHERE EMPLOYEE_ID = :managerId';
      const managerCheck = await executeQuery(managerCheckSql, { managerId });
      
      if (managerCheck.rows[0].COUNT === 0) {
        return res.status(400).json({ error: 'Invalid manager ID - employee not found' });
      }
    }
    
    // Validate locationId is valid if provided
    if (locationId) {
      const locationCheckSql = 'SELECT COUNT(*) as COUNT FROM HR_LOCATIONS WHERE LOCATION_ID = :locationId';
      const locationCheck = await executeQuery(locationCheckSql, { locationId });
      
      if (locationCheck.rows[0].COUNT === 0) {
        return res.status(400).json({ error: 'Invalid location ID - location not found' });
      }
    }
    
    const sql = `
      UPDATE HR_DEPARTMENTS SET
        DEPARTMENT_NAME = :departmentName,
        MANAGER_ID = :managerId,
        LOCATION_ID = :locationId
      WHERE DEPARTMENT_ID = :departmentId
    `;
    
    const binds = {
      departmentId,
      departmentName,
      managerId,
      locationId
    };
    
    const result = await executeQuery(sql, binds);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ message: 'Department updated successfully' });
    
  } catch (error) {
    console.error('Error updating department:', error);
    
    // Handle specific Oracle errors
    if (error.errorNum === 2291) {
      res.status(400).json({ error: 'Invalid foreign key reference (manager or location)' });
    } else if (error.errorNum === 12899) {
      res.status(400).json({ error: 'Department name exceeds maximum length (30 characters)' });
    } else {
      res.status(500).json({ error: 'Failed to update department' });
    }
  }
});

/**
 * DELETE /api/departments/:id
 * Delete a department
 */
router.delete('/:id', async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    // Check if department has employees
    const checkSql = 'SELECT COUNT(*) as EMPLOYEE_COUNT FROM HR_EMPLOYEES WHERE DEPARTMENT_ID = :departmentId';
    const checkResult = await executeQuery(checkSql, { departmentId });
    
    if (checkResult.rows[0].EMPLOYEE_COUNT > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department with active employees' 
      });
    }
    
    const sql = 'DELETE FROM HR_DEPARTMENTS WHERE DEPARTMENT_ID = :departmentId';
    const result = await executeQuery(sql, { departmentId });
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ message: 'Department deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

module.exports = router;
