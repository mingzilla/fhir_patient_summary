-- Panel: patient strip.
.mode markdown
SET VARIABLE pid = 1643;
WITH span AS (
    SELECT min(occurred)::date AS "First seen", max(occurred)::date AS "Last seen", count(*) AS "Events"
    FROM (
        SELECT period_start AS occurred FROM encounter  WHERE patient_id = getvariable('pid')
        UNION ALL SELECT onset_datetime     FROM condition  WHERE patient_id = getvariable('pid')
        UNION ALL SELECT effective_datetime FROM observation WHERE patient_id = getvariable('pid')
        UNION ALL SELECT coalesce(performed_datetime, performed_start) FROM procedure WHERE patient_id = getvariable('pid')
        UNION ALL SELECT authored_on        FROM medication_request WHERE patient_id = getvariable('pid')
        UNION ALL SELECT occurrence_datetime FROM immunization WHERE patient_id = getvariable('pid')
        UNION ALL SELECT effective_datetime FROM diagnostic_report WHERE patient_id = getvariable('pid')
    ) t
)
SELECT p.name_family AS "Patient", p.gender AS "Sex",
       date_diff('year', p.birth_date, coalesce(p.deceased_datetime::date, DATE '2005-05-25')) AS "Age",
       p.birth_date AS "Born",
       coalesce(p.deceased_datetime::date::varchar, 'living') AS "Died",
       span."First seen", span."Last seen", span."Events"
FROM patient p, span WHERE p.id = getvariable('pid');
