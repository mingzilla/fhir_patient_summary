-- Panel: the visit list - one row per visit.
.mode markdown
SET VARIABLE pid = 1643;
SELECT e.period_start::date AS "Date",
       coalesce(e.type_display, e.class_code) AS "Visit",
       (SELECT count(*) FROM observation o WHERE o.encounter_id = e.id) AS "Results",
       (SELECT count(*) FROM diagnostic_report d WHERE d.encounter_id = e.id) AS "Reports",
       coalesce((SELECT string_agg(DISTINCT c.code_display, '; ' ORDER BY c.code_display) FROM condition c WHERE c.encounter_id = e.id), '') AS "New problem"
FROM encounter e WHERE e.patient_id = getvariable('pid')
ORDER BY e.period_start DESC, e.id;
