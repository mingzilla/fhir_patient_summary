-- Panel 4 - the measurements that matter. One row per key code, always nine rows.
--
-- Codes the record does not carry still get a row, with `Latest` empty and `Change` reading
-- `not measured`. That is a finding about the record rather than a gap in the panel: "no PSA was
-- ever taken" is information, and a panel whose size changes with the patient cannot be scanned.
--
-- `Source` is the observation each reading came from, so both the latest and the previous value
-- can be traced back past the report.
.mode markdown
SET VARIABLE pid = 12069;
WITH key_codes(code, why) AS (
    VALUES ('4548-4', 'diabetes control'), ('39156-5', 'weight'), ('8480-6', 'blood pressure'),
           ('8462-4', 'blood pressure'), ('38483-4', 'kidney'), ('2093-3', 'cholesterol'),
           ('18262-6', 'cholesterol'), ('2085-9', 'cholesterol'), ('2857-1', 'prostate')
),
-- Values come from two places. `observation` holds a measurement with its own code; an
-- observation with components - blood pressure is the case here - holds no value at all, and the
-- numbers live one level down in `observation_component`. Reading only the first would let this
-- panel say "not measured" about a blood pressure taken nine times, which is worse than saying
-- nothing. The component's parent supplies the date and the `Source` id.
values_all AS (
    SELECT o.id, o.code, o.code_display, o.value_quantity_unit,
           o.effective_datetime AS occurred, o.value_quantity_value AS v
    FROM observation o
    WHERE o.patient_id = getvariable('pid') AND o.value_quantity_value IS NOT NULL
    UNION ALL
    SELECT o.id, c.code, c.code_display, c.value_quantity_unit,
           o.effective_datetime, c.value_quantity_value
    FROM observation_component c JOIN observation o ON o.id = c.observation_id
    WHERE o.patient_id = getvariable('pid') AND c.value_quantity_value IS NOT NULL
),
ranked AS (
    SELECT id, code, code_display, value_quantity_unit, occurred::date AS taken_on, v,
           row_number() OVER (PARTITION BY code ORDER BY occurred DESC, id DESC) AS rn
    FROM values_all
),
per_code AS (
    SELECT k.code AS "Code", k.why AS "Why it matters",
           any_value(r.code_display)      AS "Measurement",
           any_value(r.value_quantity_unit) AS "Unit",
           max(CASE WHEN r.rn = 1 THEN r.v        END) AS latest,
           max(CASE WHEN r.rn = 2 THEN r.v        END) AS previous,
           max(CASE WHEN r.rn = 1 THEN r.taken_on END) AS latest_at,
           max(CASE WHEN r.rn = 1 THEN r.id       END) AS source_id,
           max(CASE WHEN r.rn = 2 THEN r.id       END) AS source_prev
    FROM key_codes k LEFT JOIN ranked r ON r.code = k.code
    GROUP BY k.code, k.why
)
SELECT "Code", coalesce("Measurement", '(not in this record)') AS "Measurement",
       round(latest, 2) AS "Latest", coalesce("Unit", '') AS "Unit",
       round(previous, 2) AS "Previous",
       CASE WHEN latest IS NULL   THEN 'not measured'
            WHEN previous IS NULL THEN ''
            WHEN latest > previous THEN 'rising from ' || round(previous, 2)::varchar
            WHEN latest < previous THEN 'falling from ' || round(previous, 2)::varchar
            ELSE 'steady' END AS "Change",
       "Why it matters", source_id::varchar AS "Source", source_prev::varchar AS "Source (prev)"
FROM per_code
ORDER BY latest_at DESC NULLS LAST, "Code";
