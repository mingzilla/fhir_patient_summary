-- Panel: prescriptions as courses - the gap since the previous order of the same drug.
.mode markdown
SET VARIABLE pid = 1643;
SELECT m.authored_on::date AS "Ordered", m.medication_text AS "Medication", m.status AS "Status",
       date_diff('day', lag(m.authored_on) OVER (PARTITION BY m.medication_code ORDER BY m.authored_on),
                 m.authored_on) AS "Gap (days)",
       CASE WHEN lag(m.authored_on) OVER (PARTITION BY m.medication_code ORDER BY m.authored_on) IS NULL
            THEN 'first' ELSE 're-order' END AS "Course"
FROM medication_request m WHERE m.patient_id = getvariable('pid')
ORDER BY m.authored_on DESC;
