-- Panel: the core measurements - latest, previous, direction.
.mode markdown
SET VARIABLE pid = 1643;
WITH ranked AS (
    SELECT code, code_display, value_quantity_unit, effective_datetime::date AS taken_on,
           value_quantity_value AS v,
           row_number() OVER (PARTITION BY code ORDER BY effective_datetime DESC) AS rn,
           count(*)     OVER (PARTITION BY code) AS readings
    FROM observation WHERE patient_id = getvariable('pid') AND value_quantity_value IS NOT NULL
), per_code AS (
    SELECT code, any_value(code_display) AS name, any_value(value_quantity_unit) AS unit,
           max(CASE WHEN rn = 1 THEN v  END) AS latest,
           max(CASE WHEN rn = 2 THEN v  END) AS previous,
           max(CASE WHEN rn = 1 THEN taken_on END) AS latest_at,
           any_value(readings) AS readings
    FROM ranked GROUP BY code
)
SELECT code AS "Code", name AS "Measurement",
       round(latest, 2) AS "Latest", coalesce(unit, '') AS "Unit",
       round(previous, 2) AS "Previous", readings AS "Readings",
       CASE WHEN previous IS NULL THEN 'single reading'
            WHEN latest > previous THEN 'rising'
            WHEN latest < previous THEN 'falling' ELSE 'unchanged' END AS "Trend",
       latest_at AS "Latest at"
FROM per_code ORDER BY latest_at DESC, code;
