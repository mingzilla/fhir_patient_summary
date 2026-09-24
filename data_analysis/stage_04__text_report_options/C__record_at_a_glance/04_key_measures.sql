-- Panel: a few measurements chosen for clinical weight, not the whole 43.
.mode markdown
SET VARIABLE pid = 1643;
WITH key_codes(code, why) AS (
    VALUES ('4548-4', 'diabetes control'), ('39156-5', 'weight'), ('8480-6', 'blood pressure'),
           ('8462-4', 'blood pressure'), ('38483-4', 'kidney'), ('2093-3', 'cholesterol'),
           ('18262-6', 'cholesterol'), ('2085-9', 'cholesterol'), ('2857-1', 'prostate')
),
ranked AS (
    SELECT o.code, o.code_display, o.value_quantity_unit, o.effective_datetime::date AS taken_on,
           o.value_quantity_value AS v,
           row_number() OVER (PARTITION BY o.code ORDER BY o.effective_datetime DESC) AS rn
    FROM observation o JOIN key_codes k ON k.code = o.code
    WHERE o.patient_id = getvariable('pid') AND o.value_quantity_value IS NOT NULL
),
per_code AS (
    SELECT r.code AS "Code", any_value(r.code_display) AS "Measurement",
           any_value(r.value_quantity_unit) AS "Unit",
           max(CASE WHEN rn = 1 THEN v END) AS latest,
           max(CASE WHEN rn = 2 THEN v END) AS previous,
           max(CASE WHEN rn = 1 THEN taken_on END) AS latest_at,
           any_value(k.why) AS "Why it matters"
    FROM ranked r JOIN key_codes k ON k.code = r.code GROUP BY r.code
)
SELECT "Code", "Measurement", round(latest, 2) AS "Latest", "Unit",
       round(previous, 2) AS "Previous",
       CASE WHEN previous IS NULL THEN ''
            WHEN latest > previous THEN 'rising from ' || round(previous, 2)::varchar
            WHEN latest < previous THEN 'falling from ' || round(previous, 2)::varchar
            ELSE 'steady' END AS "Change",
       "Why it matters"
FROM per_code ORDER BY latest_at DESC, "Code";
