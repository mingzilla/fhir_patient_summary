-- Panel: how much happened each year - the shape of a life.
.mode markdown
SET VARIABLE pid = 1643;
WITH event AS (
    SELECT period_start AS occurred FROM encounter WHERE patient_id = getvariable('pid')
    UNION ALL SELECT onset_datetime FROM condition WHERE patient_id = getvariable('pid')
    UNION ALL SELECT effective_datetime FROM observation WHERE patient_id = getvariable('pid')
    UNION ALL SELECT coalesce(performed_datetime, performed_start) FROM procedure WHERE patient_id = getvariable('pid')
    UNION ALL SELECT authored_on FROM medication_request WHERE patient_id = getvariable('pid')
    UNION ALL SELECT occurrence_datetime FROM immunization WHERE patient_id = getvariable('pid')
    UNION ALL SELECT effective_datetime FROM diagnostic_report WHERE patient_id = getvariable('pid')
),
per_year AS (SELECT year(occurred) AS "Year", count(*) AS "Events" FROM event GROUP BY 1)
SELECT "Year", "Events" FROM per_year ORDER BY "Year";
