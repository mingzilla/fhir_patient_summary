-- Panel 2 - the problem list. One row per condition, with duration.
.mode markdown
SET VARIABLE pid = 87788;
-- `as_of` is derived over the same eight types panel 1 uses. Deriving it from fewer would let
-- the two panels state different dates for one patient, and the Years column would shift with
-- no visible cause.
WITH event AS (
    SELECT period_start AS occurred FROM encounter WHERE patient_id = getvariable('pid')
    UNION ALL SELECT onset_datetime FROM condition WHERE patient_id = getvariable('pid')
    UNION ALL SELECT effective_datetime FROM observation WHERE patient_id = getvariable('pid')
    UNION ALL SELECT coalesce(performed_datetime, performed_start) FROM procedure WHERE patient_id = getvariable('pid')
    UNION ALL SELECT authored_on FROM medication_request WHERE patient_id = getvariable('pid')
    UNION ALL SELECT occurrence_datetime FROM immunization WHERE patient_id = getvariable('pid')
    UNION ALL SELECT effective_datetime FROM diagnostic_report WHERE patient_id = getvariable('pid')
    UNION ALL SELECT recorded_date FROM allergy_intolerance WHERE patient_id = getvariable('pid')
),
as_of AS (SELECT max(occurred)::date AS d FROM event)
SELECT c.onset_datetime::date AS "Onset", upper(c.clinical_status) AS "Status",
       c.code_display AS "Problem",
       date_diff('year', c.onset_datetime::date,
                 coalesce(c.abatement_datetime::date, (SELECT d FROM as_of))) AS "Years",
       CASE WHEN c.abatement_datetime IS NULL THEN 'ongoing'
            ELSE 'resolved ' || c.abatement_datetime::date::varchar END AS "Outcome",
       c.id::varchar AS "Source",
       -- The other problem recorded on the same day, or empty. `Pair` reports *co-recording*,
       -- which the data carries, and deliberately not cause and consequence, which it does not:
       -- of the five same-day pairs in this dataset, two are a cause and its consequence and
       -- three are one condition written twice, once generally and once specifically. A column
       -- calling all five "finding"/"cause" would assert four things that are not true.
       coalesce((SELECT p2.code_display FROM condition p2
                  WHERE p2.patient_id = c.patient_id
                    AND p2.onset_datetime::date = c.onset_datetime::date
                    AND p2.id <> c.id LIMIT 1), '') AS "Pair"
FROM condition c WHERE c.patient_id = getvariable('pid')
ORDER BY c.abatement_datetime IS NOT NULL, c.onset_datetime DESC, c.id;
