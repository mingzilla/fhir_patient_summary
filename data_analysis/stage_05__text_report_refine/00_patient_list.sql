-- The patient list. One row per patient, in panel 1's nine columns.
--
-- The seven panels each answer for one patient, named by `pid`. This answers for every patient
-- in the record, which is the one question they cannot be asked: a client wanting the list
-- would otherwise have to know the ids in advance and make one call per patient.
--
-- **It lives above the option folders, not in one of them.** It is not a panel and it is not
-- about a patient, so `build_reports.sh` must not fold it into a report and `check_panels.sh`
-- must not check it as one. Both glob inside the option folders, and this is outside them.
-- What holds it correct is a test rather than a snapshot: `tests/test__patient_list.py` asserts
-- this is row-for-row equal to `01_patient.sql` for every patient in the record.
--
-- **It runs in the DuckDB CLI, like the panels.** `lim` and `off` are set here with defaults so
-- `.mode markdown` and a naked `duckdb fhir_sample.duckdb < 00_patient_list.sql` produce the
-- table. The dashboard rewrites those two literals with the caller's paging and runs the same
-- text; it does not use `?`, because DuckDB refuses a prepared parameter in anything but the
-- last statement, which is what stops this being a panel with a bound `pid` in the first place.
--
-- `lim = 0` is no limit: `nullif` turns it into NULL, and `LIMIT NULL` is DuckDB for "all".
-- An empty record is the one case where `200 []` does not mean "this patient has no rows".
.mode markdown
SET VARIABLE lim = 0;
SET VARIABLE off = 0;
WITH event AS (
    SELECT patient_id, period_start AS occurred FROM encounter
    UNION ALL SELECT patient_id, onset_datetime     FROM condition
    UNION ALL SELECT patient_id, effective_datetime FROM observation
    UNION ALL SELECT patient_id, coalesce(performed_datetime, performed_start) FROM procedure
    UNION ALL SELECT patient_id, authored_on        FROM medication_request
    UNION ALL SELECT patient_id, occurrence_datetime FROM immunization
    UNION ALL SELECT patient_id, effective_datetime FROM diagnostic_report
    UNION ALL SELECT patient_id, recorded_date      FROM allergy_intolerance
),
span AS (
    SELECT patient_id,
           min(occurred)::date AS first_seen,
           max(occurred)::date AS as_of,
           count(*) AS events
    FROM event GROUP BY patient_id
),
-- The given name, which the list needs and panel 1 does not.
--
-- `patient.name_given` exists and is null for every row: the loader never fills it. The names
-- are in `patient_name`, one row per name a patient has, so this is where they come from.
--
-- `official` first, because a patient may carry more than one name - id 197832 has both
-- `official` Boyle and `maiden` Price, and without the preference one patient would appear
-- twice. `min()` rather than a bare column because the group must collapse to one row either
-- way, and `given IS NOT NULL` because an empty `min()` is not a name.
name AS (
    SELECT patient_id,
           coalesce(min(given) FILTER (WHERE use = 'official'), min(given)) AS given
    FROM patient_name
    WHERE given IS NOT NULL
    GROUP BY patient_id
)
SELECT p.name_family AS "Patient", name.given AS "Given", p.gender AS "Sex",
       date_diff('year', p.birth_date, coalesce(p.deceased_datetime::date, span.as_of)) AS "Age",
       p.birth_date AS "Born",
       coalesce(p.deceased_datetime::date::varchar, 'living') AS "Died",
       span.first_seen AS "First seen", span.as_of AS "As of",
       coalesce(span.events, 0) AS "Clinical events",
       p.id::varchar AS "Source"
FROM patient p
LEFT JOIN span ON span.patient_id = p.id
LEFT JOIN name ON name.patient_id = p.id
ORDER BY p.id
LIMIT nullif(getvariable('lim'), 0) OFFSET getvariable('off');
