-- Panel: what the record is made of.
.mode markdown
SET VARIABLE pid = 1643;
WITH counts AS (
    SELECT 'observation' AS "Resource", count(*) AS "Rows" FROM observation WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'condition', count(*) FROM condition WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'encounter', count(*) FROM encounter WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'diagnostic_report', count(*) FROM diagnostic_report WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'medication_request', count(*) FROM medication_request WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'procedure', count(*) FROM procedure WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'immunization', count(*) FROM immunization WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'claim', count(*) FROM claim WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'explanation_of_benefit', count(*) FROM explanation_of_benefit WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'care_plan', count(*) FROM care_plan WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'goal', count(*) FROM goal WHERE patient_id = getvariable('pid')
)
SELECT "Resource", "Rows",
       CASE WHEN "Resource" IN ('claim', 'explanation_of_benefit') THEN 'billing' ELSE 'clinical' END AS "Class"
FROM counts WHERE "Rows" > 0 ORDER BY "Rows" DESC, "Resource";
