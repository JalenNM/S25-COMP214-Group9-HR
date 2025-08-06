-- Task 3-1: Procedure to validate salary range for a job

CREATE OR REPLACE PROCEDURE check_salary (
    p_the_job     VARCHAR2,
    p_the_salary  NUMBER
)
IS
    v_minsal HR_JOBS.min_salary%TYPE;
    v_maxsal HR_JOBS.max_salary%TYPE;
BEGIN
    -- Retrieve min and max salary for the specified job ID
    SELECT min_salary, max_salary
    INTO v_minsal, v_maxsal
    FROM HR_JOBS
    WHERE job_id = UPPER(p_the_job);

    -- Raise error if salary is outside the valid range
    IF p_the_salary NOT BETWEEN v_minsal AND v_maxsal THEN
        RAISE_APPLICATION_ERROR(-20100,
            'Salary out of range. Should be between ' || v_minsal || ' and ' || v_maxsal);
    END IF;

EXCEPTION
    -- Handle case when job ID is not found in HR_JOBS table
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20101, 'Job ID ' || p_the_job || ' not found.');
END;
/
  
-- Procedure testing

-- Valid salary test case
BEGIN
    check_salary('SA_REP', 8000);
END;
/

-- Invalid salary test case (below minimum)
BEGIN
    check_salary('SA_REP', 500);
END;
/

-- Task 3-2: Trigger to enforce salary validation before inserting or updating HR_EMPLOYEES

CREATE OR REPLACE TRIGGER check_salary_trg
BEFORE INSERT OR UPDATE OF job_id, salary ON HR_EMPLOYEES
FOR EACH ROW
BEGIN
    -- Call the procedure to check salary validity
    check_salary(UPPER(:NEW.job_id), :NEW.salary);
END;
/

-- Test Case 1: Valid Insert (should succeed)
INSERT INTO HR_EMPLOYEES (
    employee_id, first_name, last_name, email, phone_number,
    hire_date, job_id, salary, manager_id, department_id
) VALUES (
    1000, 'Elena', 'Beh', 'abc3@abc.com', '123-456-7890',
    SYSDATE, 'SA_REP', 8000, 145, 30
);

-- Test Case 2: Invalid Insert - Salary too low (should raise error)
INSERT INTO HR_EMPLOYEES (
    employee_id, first_name, last_name, email, phone_number,
    hire_date, job_id, salary, manager_id, department_id
) VALUES (
    1001, 'Sami', 'Bee', 'sami@abc.com', '987-654-3210',
    SYSDATE, 'SA_REP', 500, 145, 30
);

-- Test Case 3: Valid Salary Update (should succeed)
UPDATE HR_EMPLOYEES
SET salary = 30000
WHERE employee_id = 100;

-- Test Case 4: Invalid Salary Update - Above max (should raise error)
UPDATE HR_EMPLOYEES
SET salary = 50000
WHERE employee_id = 100;

-- Test Case 5: Invalid Job Change - Salary outside new job range (should raise error)
UPDATE HR_EMPLOYEES
SET job_id = 'HR_REP'
WHERE employee_id = 115;
