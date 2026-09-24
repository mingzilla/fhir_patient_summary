-- Panel: what happened at each visit - one row per item.
.mode markdown
SET VARIABLE pid = 1643;
WITH item AS (
    SELECT e.period_start::date AS "Date", coalesce(e.type_display, e.class_code) AS "Visit",
           'problem' AS "Kind", c.code_display || ' (' || c.clinical_status || ')' AS "What"
      FROM encounter e JOIN condition c ON c.encounter_id = e.id WHERE e.patient_id = getvariable('pid')
    UNION ALL SELECT e.period_start::date, coalesce(e.type_display, e.class_code), 'prescription',
           m.medication_text || ' (' || m.status || ')'
      FROM encounter e JOIN medication_request m ON m.encounter_id = e.id WHERE e.patient_id = getvariable('pid')
    UNION ALL SELECT e.period_start::date, coalesce(e.type_display, e.class_code), 'procedure', p.code_display
      FROM encounter e JOIN procedure p ON p.encounter_id = e.id WHERE e.patient_id = getvariable('pid')
    UNION ALL SELECT e.period_start::date, coalesce(e.type_display, e.class_code), 'immunisation', i.vaccine_display
      FROM encounter e JOIN immunization i ON i.encounter_id = e.id WHERE e.patient_id = getvariable('pid')
    UNION ALL SELECT e.period_start::date, coalesce(e.type_display, e.class_code), 'report', d.code_display
      FROM encounter e JOIN diagnostic_report d ON d.encounter_id = e.id WHERE e.patient_id = getvariable('pid')
)
SELECT * FROM item ORDER BY "Date" DESC, "Kind", "What";
