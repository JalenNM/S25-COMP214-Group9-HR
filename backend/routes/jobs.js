const express = require('express');
const { executeQuery } = require('../db/connection');
const router = express.Router();

/**
 * GET /api/jobs
 * Get all jobs
 */
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        j.JOB_ID,
        j.JOB_TITLE,
        j.MIN_SALARY,
        j.MAX_SALARY,
        COUNT(e.EMPLOYEE_ID) as EMPLOYEE_COUNT
      FROM HR_JOBS j
      LEFT JOIN HR_EMPLOYEES e ON j.JOB_ID = e.JOB_ID
      GROUP BY j.JOB_ID, j.JOB_TITLE, j.MIN_SALARY, j.MAX_SALARY
      ORDER BY j.JOB_TITLE
    `;
    
    const result = await executeQuery(sql);
    
    res.json({ data: result.rows });
    
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

/**
 * GET /api/jobs/stats
 * Get job statistics and analytics
 */
router.get('/stats', async (req, res) => {
  try {
    // Job statistics with employee count and salary info
    const jobStatsSql = `
      SELECT 
        j.JOB_ID,
        j.JOB_TITLE,
        j.MIN_SALARY,
        j.MAX_SALARY,
        COUNT(e.EMPLOYEE_ID) as EMPLOYEE_COUNT,
        AVG(e.SALARY) as ACTUAL_AVERAGE_SALARY,
        MIN(e.SALARY) as ACTUAL_MIN_SALARY,
        MAX(e.SALARY) as ACTUAL_MAX_SALARY,
        SUM(e.SALARY) as TOTAL_SALARY_COST,
        CASE 
          WHEN COUNT(e.EMPLOYEE_ID) > 0 
          THEN ROUND((AVG(e.SALARY) - j.MIN_SALARY) / (j.MAX_SALARY - j.MIN_SALARY) * 100, 2)
          ELSE NULL 
        END as SALARY_RANGE_UTILIZATION_PCT
      FROM HR_JOBS j
      LEFT JOIN HR_EMPLOYEES e ON j.JOB_ID = e.JOB_ID
      GROUP BY j.JOB_ID, j.JOB_TITLE, j.MIN_SALARY, j.MAX_SALARY
      ORDER BY EMPLOYEE_COUNT DESC, j.JOB_TITLE
    `;
    
    // Overall job market statistics
    const overallStatsSql = `
      SELECT 
        COUNT(*) as TOTAL_JOBS,
        COUNT(CASE WHEN EXISTS (SELECT 1 FROM HR_EMPLOYEES e WHERE e.JOB_ID = j.JOB_ID) THEN 1 END) as ACTIVE_JOBS,
        COUNT(CASE WHEN NOT EXISTS (SELECT 1 FROM HR_EMPLOYEES e WHERE e.JOB_ID = j.JOB_ID) THEN 1 END) as VACANT_JOBS,
        AVG(j.MIN_SALARY) as AVERAGE_MIN_SALARY,
        AVG(j.MAX_SALARY) as AVERAGE_MAX_SALARY,
        MIN(j.MIN_SALARY) as LOWEST_MIN_SALARY,
        MAX(j.MAX_SALARY) as HIGHEST_MAX_SALARY
      FROM HR_JOBS j
    `;
    
    const [jobStats, overallStats] = await Promise.all([
      executeQuery(jobStatsSql),
      executeQuery(overallStatsSql)
    ]);
    
    res.json({
      jobStats: jobStats.rows,
      summary: overallStats.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

/**
 * GET /api/jobs/:id
 * Get a specific job by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    
    const sql = `
      SELECT 
        JOB_ID,
        JOB_TITLE,
        MIN_SALARY,
        MAX_SALARY
      FROM HR_JOBS
      WHERE JOB_ID = :jobId
    `;
    
    const result = await executeQuery(sql, { jobId });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ data: result.rows[0] });
    
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

/**
 * GET /api/jobs/:id/employees
 * Get all employees with a specific job
 */
router.get('/:id/employees', async (req, res) => {
  try {
    const jobId = req.params.id;
    
    const sql = `
      SELECT 
        e.EMPLOYEE_ID,
        e.FIRST_NAME,
        e.LAST_NAME,
        e.EMAIL,
        e.PHONE_NUMBER,
        e.HIRE_DATE,
        e.SALARY,
        d.DEPARTMENT_NAME,
        m.FIRST_NAME || ' ' || m.LAST_NAME as MANAGER_NAME
      FROM HR_EMPLOYEES e
      LEFT JOIN HR_DEPARTMENTS d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
      LEFT JOIN HR_EMPLOYEES m ON e.MANAGER_ID = m.EMPLOYEE_ID
      WHERE e.JOB_ID = :jobId
      ORDER BY e.LAST_NAME, e.FIRST_NAME
    `;
    
    const result = await executeQuery(sql, { jobId });
    
    res.json({ data: result.rows });
    
  } catch (error) {
    console.error('Error fetching job employees:', error);
    res.status(500).json({ error: 'Failed to fetch job employees' });
  }
});

/**
 * POST /api/jobs
 * Create a new job
 */
router.post('/', async (req, res) => {
  try {
    const { jobId, jobTitle, minSalary, maxSalary } = req.body;
    
    // Validation
    if (!jobId || !jobTitle) {
      return res.status(400).json({ error: 'Job ID and Job Title are required' });
    }
    
    // Validate field lengths based on schema
    if (jobId.length > 10) {
      return res.status(400).json({ error: 'Job ID cannot exceed 10 characters' });
    }
    
    if (jobTitle.length > 35) {
      return res.status(400).json({ error: 'Job title cannot exceed 35 characters' });
    }
    
    // Validate salary ranges
    if (minSalary && (minSalary < 0 || minSalary > 999999)) {
      return res.status(400).json({ error: 'Minimum salary must be between 0 and 999,999' });
    }
    
    if (maxSalary && (maxSalary < 0 || maxSalary > 999999)) {
      return res.status(400).json({ error: 'Maximum salary must be between 0 and 999,999' });
    }
    
    if (minSalary && maxSalary && minSalary > maxSalary) {
      return res.status(400).json({ error: 'Minimum salary cannot be greater than maximum salary' });
    }
    
    const sql = `
      INSERT INTO HR_JOBS (JOB_ID, JOB_TITLE, MIN_SALARY, MAX_SALARY)
      VALUES (:jobId, :jobTitle, :minSalary, :maxSalary)
    `;
    
    const binds = {
      jobId,
      jobTitle,
      minSalary: minSalary || null,
      maxSalary: maxSalary || null
    };
    
    await executeQuery(sql, binds);
    
    res.status(201).json({ 
      message: 'Job created successfully',
      data: { jobId, jobTitle }
    });
    
  } catch (error) {
    console.error('Error creating job:', error);
    
    // Handle specific Oracle errors
    if (error.errorNum === 1) {
      res.status(409).json({ error: 'Job with this ID already exists' });
    } else if (error.errorNum === 12899) {
      res.status(400).json({ error: 'One or more field values exceed maximum length' });
    } else if (error.errorNum === 1438) {
      res.status(400).json({ error: 'Salary value is too large for the field precision' });
    } else {
      res.status(500).json({ error: 'Failed to create job' });
    }
  }
});

/**
 * PUT /api/jobs/:id
 * Update an existing job
 */
router.put('/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    const { jobTitle, minSalary, maxSalary } = req.body;
    
    // Validation
    if (jobTitle && jobTitle.length > 35) {
      return res.status(400).json({ error: 'Job title cannot exceed 35 characters' });
    }
    
    // Validate salary ranges
    if (minSalary && (minSalary < 0 || minSalary > 999999)) {
      return res.status(400).json({ error: 'Minimum salary must be between 0 and 999,999' });
    }
    
    if (maxSalary && (maxSalary < 0 || maxSalary > 999999)) {
      return res.status(400).json({ error: 'Maximum salary must be between 0 and 999,999' });
    }
    
    if (minSalary && maxSalary && minSalary > maxSalary) {
      return res.status(400).json({ error: 'Minimum salary cannot be greater than maximum salary' });
    }
    
    const sql = `
      UPDATE HR_JOBS SET
        JOB_TITLE = :jobTitle,
        MIN_SALARY = :minSalary,
        MAX_SALARY = :maxSalary
      WHERE JOB_ID = :jobId
    `;
    
    const binds = {
      jobId,
      jobTitle,
      minSalary,
      maxSalary
    };
    
    const result = await executeQuery(sql, binds);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ message: 'Job updated successfully' });
    
  } catch (error) {
    console.error('Error updating job:', error);
    
    // Handle specific Oracle errors
    if (error.errorNum === 12899) {
      res.status(400).json({ error: 'One or more field values exceed maximum length' });
    } else if (error.errorNum === 1438) {
      res.status(400).json({ error: 'Salary value is too large for the field precision' });
    } else {
      res.status(500).json({ error: 'Failed to update job' });
    }
  }
});

/**
 * DELETE /api/jobs/:id
 * Delete a job
 */
router.delete('/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    
    // Check if job has employees
    const checkSql = 'SELECT COUNT(*) as EMPLOYEE_COUNT FROM HR_EMPLOYEES WHERE JOB_ID = :jobId';
    const checkResult = await executeQuery(checkSql, { jobId });
    
    if (checkResult.rows[0].EMPLOYEE_COUNT > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete job with active employees' 
      });
    }
    
    const sql = 'DELETE FROM HR_JOBS WHERE JOB_ID = :jobId';
    const result = await executeQuery(sql, { jobId });
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ message: 'Job deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

module.exports = router;
