-- Panel 1 - patient strip. One row.
--
-- `Clinical events` counts the eight clinical types only. Panel 7 counts every table including
-- billing, so its total is larger; naming this column is what stops the two reading as a
-- contradiction rather than as two different quantities. The two must move together: panel 7's
-- `clinical` class is defined as exactly the types this CTE lists, so adding a type here without
-- adding it there would put the strip and the mix out of step by that type's row count.
--
-- `as_of` is the last dated event in the record, derived rather than written down: a hardcoded
-- date would be patient-specific data outside the one `pid` line, and would silently be wrong
-- for the next patient. Every panel that needs "how long" derives it the same way.
.mode markdown
SET VARIABLE pid = 1643;
WITH event AS (
    SELECT period_start AS occurred FROM encounter  WHERE patient_id = getvariable('pid')
    UNION ALL SELECT onset_datetime     FROM condition  WHERE patient_id = getvariable('pid')
    UNION ALL SELECT effective_datetime FROM observation WHERE patient_id = getvariable('pid')
    UNION ALL SELECT coalesce(performed_datetime, performed_start) FROM procedure WHERE patient_id = getvariable('pid')
    UNION ALL SELECT authored_on        FROM medication_request WHERE patient_id = getvariable('pid')
    UNION ALL SELECT occurrence_datetime FROM immunization WHERE patient_id = getvariable('pid')
    UNION ALL SELECT effective_datetime FROM diagnostic_report WHERE patient_id = getvariable('pid')
    UNION ALL SELECT recorded_date      FROM allergy_intolerance WHERE patient_id = getvariable('pid')
),
span AS (SELECT min(occurred)::date AS first_seen, max(occurred)::date AS as_of, count(*) AS events FROM event)
SELECT p.name_family AS "Patient", p.gender AS "Sex",
       date_diff('year', p.birth_date, coalesce(p.deceased_datetime::date, span.as_of)) AS "Age",
       p.birth_date AS "Born",
       coalesce(p.deceased_datetime::date::varchar, 'living') AS "Died",
       span.first_seen AS "First seen", span.as_of AS "As of", span.events AS "Clinical events",
       p.id::varchar AS "Source"
FROM patient p, span WHERE p.id = getvariable('pid');
