-- Employee Hire Stored Procedure
-- This procedure hires a new employee by inserting into HR_EMPLOYEES table
-- with automatic EMPLOYEE_ID generation

CREATE OR REPLACE PROCEDURE employee_hire_sp(
    p_first_name IN VARCHAR2,
    p_last_name IN VARCHAR2,
    p_email IN VARCHAR2,
    p_phone_number IN VARCHAR2 DEFAULT NULL,
    p_job_id IN VARCHAR2,
    p_salary IN NUMBER DEFAULT NULL,
    p_commission_pct IN NUMBER DEFAULT NULL,
    p_manager_id IN NUMBER DEFAULT NULL,
    p_department_id IN NUMBER DEFAULT NULL
)
AS
    v_employee_id NUMBER;
BEGIN
    -- Generate next employee ID by finding max and adding 1
    SELECT NVL(MAX(EMPLOYEE_ID), 100) + 1 
    INTO v_employee_id 
    FROM HR_EMPLOYEES;
    
    -- Insert the new employee
    INSERT INTO HR_EMPLOYEES (
        EMPLOYEE_ID,
        FIRST_NAME,
        LAST_NAME,
        EMAIL,
        PHONE_NUMBER,
        HIRE_DATE,
        JOB_ID,
        SALARY,
        COMMISSION_PCT,
        MANAGER_ID,
        DEPARTMENT_ID
    ) VALUES (
        v_employee_id,
        p_first_name,
        p_last_name,
        p_email,
        p_phone_number,
        SYSDATE,  -- Use current date as hire date
        p_job_id,
        p_salary,
        p_commission_pct,
        p_manager_id,
        p_department_id
    );
    
    -- Commit the transaction
    COMMIT;
    
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20001, 'Employee with this email already exists');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20002, 'Error hiring employee: ' || SQLERRM);
END employee_hire_sp;
/