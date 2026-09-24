-- Panel: the problem list - one row per condition, with duration.
.mode markdown
SET VARIABLE pid = 1643;
SELECT c.onset_datetime::date AS "Onset", upper(c.clinical_status) AS "Status",
       c.code_display AS "Problem",
       date_diff('year', c.onset_datetime::date,
                 coalesce(c.abatement_datetime::date, DATE '2005-05-25')) AS "Years",
       CASE WHEN c.abatement_datetime IS NULL THEN 'ongoing'
            ELSE 'resolved ' || c.abatement_datetime::date::varchar END AS "Outcome"
FROM condition c WHERE c.patient_id = getvariable('pid')
ORDER BY c.abatement_datetime IS NOT NULL, c.onset_datetime DESC, c.code;
