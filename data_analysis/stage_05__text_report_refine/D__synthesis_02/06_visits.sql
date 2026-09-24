-- Panel 6 - the visit list. One row per encounter, newest first.
--
-- The sort is `date DESC, id ASC`. The id is unique, so the order is total - but within one
-- day it is arbitrary in clinical terms: two visits on 2001-05-24 come out in id order, which
-- is insertion order, not the order they happened. Stated rather than left to look meaningful.
.mode markdown
SET VARIABLE pid = 1390;
SELECT e.period_start::date AS "Date", coalesce(e.type_display, e.class_code) AS "Visit",
       (SELECT count(*) FROM observation o WHERE o.encounter_id = e.id) AS "Results",
       (SELECT count(*) FROM diagnostic_report d WHERE d.encounter_id = e.id) AS "Reports",
       coalesce((SELECT string_agg(DISTINCT c.code_display, '; ' ORDER BY c.code_display)
                   FROM condition c WHERE c.encounter_id = e.id), '') AS "New problem",
       e.id::varchar AS "Source"
FROM encounter e WHERE e.patient_id = getvariable('pid')
ORDER BY e.period_start DESC, e.id;
