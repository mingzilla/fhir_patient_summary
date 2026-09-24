-- Panel 7 - what the record is made of. One row per resource type.
--
-- No `Source` column: an aggregate over a whole table has no single row behind it, and a
-- column naming the table would only repeat the first column. `Class` separates what a clinician
-- reads from what they do not.
--
-- Three classes, not two. `clinical` is exactly the eight types the report reads, and it sums
-- to the Patient strip's `Clinical events`; `billing` and `not read` are rows the record
-- holds that no part of this pipeline fetches. Listing them is the point of the panel -
-- it shows what the boundary filters out, and keeps the three totals reconcilable. No row is
-- filtered on its count: a type with no rows is a fact about the record, and dropping it would
-- change the panel's shape from patient to patient.
.mode markdown
SET VARIABLE pid = 12069;
WITH counts AS (
    SELECT 'observation' AS "Resource", count(*) AS "Rows" FROM observation WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'condition', count(*) FROM condition WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'encounter', count(*) FROM encounter WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'diagnostic_report', count(*) FROM diagnostic_report WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'medication_request', count(*) FROM medication_request WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'procedure', count(*) FROM procedure WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'immunization', count(*) FROM immunization WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'allergy_intolerance', count(*) FROM allergy_intolerance WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'claim', count(*) FROM claim WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'explanation_of_benefit', count(*) FROM explanation_of_benefit WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'care_plan', count(*) FROM care_plan WHERE patient_id = getvariable('pid')
    UNION ALL SELECT 'goal', count(*) FROM goal WHERE patient_id = getvariable('pid')
)
SELECT "Resource", "Rows",
       CASE WHEN "Resource" IN ('claim', 'explanation_of_benefit') THEN 'billing'
            WHEN "Resource" IN ('care_plan', 'goal')                THEN 'not read'
            ELSE 'clinical' END AS "Class"
FROM counts ORDER BY "Rows" DESC, "Resource";
