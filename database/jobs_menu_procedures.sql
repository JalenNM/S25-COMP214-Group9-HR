
--Task 2-1: Function to get job title from job ID
CREATE OR REPLACE FUNCTION get_job_description (
    p_job_id IN VARCHAR2
) RETURN VARCHAR2 IS
    v_job_title VARCHAR2(50);
BEGIN
    SELECT job_title
    INTO v_job_title
    FROM hr_jobs
    WHERE job_id = p_job_id;

    RETURN v_job_title;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 'Job not found';
END;
/


-- Task 2-2: Procedure to update job title and salary range
CREATE OR REPLACE PROCEDURE update_job_info (
    p_job_id IN VARCHAR2,
    p_job_title IN VARCHAR2,
    p_min_salary IN NUMBER,
    p_max_salary IN NUMBER
) AS
BEGIN
    UPDATE hr_jobs
    SET job_title = p_job_title,
        min_salary = p_min_salary,
        max_salary = p_max_salary
    WHERE job_id = p_job_id;

    COMMIT;
END;
/


-- Task 2-3: Procedure to insert a new job
CREATE OR REPLACE PROCEDURE new_job (
    p_job_id IN VARCHAR2,
    p_job_title IN VARCHAR2,
    p_min_salary IN NUMBER,
    p_max_salary IN NUMBER
) AS
BEGIN
    INSERT INTO hr_jobs (job_id, job_title, min_salary, max_salary)
    VALUES (p_job_id, p_job_title, p_min_salary, p_max_salary);

    COMMIT;
END;
/
