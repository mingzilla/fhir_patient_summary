-- Panel 3 - prescriptions as courses. One row per order, with the gap since the last order of
-- the same drug, which exposes a renewal pattern a count cannot.
.mode markdown
SET VARIABLE pid = 12069;
SELECT m.authored_on::date AS "Ordered", m.medication_text AS "Medication", m.status AS "Status",
       date_diff('day', lag(m.authored_on) OVER (PARTITION BY m.medication_code ORDER BY m.authored_on),
                 m.authored_on) AS "Gap (days)",
       CASE WHEN lag(m.authored_on) OVER (PARTITION BY m.medication_code ORDER BY m.authored_on) IS NULL
            THEN 'first' ELSE 're-order' END AS "Course",
       m.id::varchar AS "Source"
FROM medication_request m WHERE m.patient_id = getvariable('pid')
ORDER BY m.authored_on DESC, m.id;

-- A conditional footer. `.mode list` rather than markdown, because an empty markdown result still
-- prints its header row - which would put a bare column heading under every table that did have a
-- renewal pattern. In list mode an empty result prints nothing at all.
.mode list
.headers off
SELECT '_No renewal pattern: every order is a first._'
WHERE NOT EXISTS (
    SELECT 1 FROM medication_request m WHERE m.patient_id = getvariable('pid')
    GROUP BY m.medication_code HAVING count(*) > 1
);
