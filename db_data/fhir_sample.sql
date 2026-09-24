-- DuckDB schema for a 7-patient FHIR sample.
--
-- Every table mirrors one FHIR resource, and every column is named after the element it came
-- from, so this file doubles as a map of the API. Two shapes are worth noticing:
--
--   1. Embedded arrays are child tables. FHIR nests them inside the resource (Observation.component,
--      AllergyIntolerance.reaction), but they are 1:* and behave like tables, so they are modelled
--      as tables. `observation_reference_range` and `allergy_reaction` come out EMPTY because this
--      dataset populates neither.
--   2. `diagnostic_report_result` is a genuine link table. DiagnosticReport.result[] points at
--      Observations, so the many-to-many lands in its own table.
--
-- Rebuild, from this directory:
--   python3 fhir_sample_load.py fhir_sample.duckdb
--
-- This file is run as it stands. Each table reads from one source_<table>, which
-- fhir_sample_load.py fetches and binds before running this - the rows, typed as the FHIR
-- elements they came from. There is no CSV and no file of rows anywhere in the chain, so
-- this schema needs the loader to have run and cannot be run on its own.

CREATE OR REPLACE TABLE patient AS SELECT
    id,
    gender,
    TRY_CAST(birth_date AS DATE)              AS birth_date,
    TRY_CAST(deceased_boolean AS BOOLEAN)     AS deceased_boolean,
    TRY_CAST(deceased_datetime AS TIMESTAMP)  AS deceased_datetime,
    marital_status,
    name_family,
    name_given,
    address_city,
    address_state,
    address_postal_code
FROM source_patient;

CREATE OR REPLACE TABLE patient_name       AS SELECT * FROM source_patient_name;
CREATE OR REPLACE TABLE patient_identifier AS SELECT * FROM source_patient_identifier;

CREATE OR REPLACE TABLE encounter AS SELECT
    id, patient_id, status, class_code, type_code, type_display,
    TRY_CAST(period_start AS TIMESTAMP) AS period_start,
    TRY_CAST(period_end   AS TIMESTAMP) AS period_end,
    service_provider
FROM source_encounter;

CREATE OR REPLACE TABLE condition AS SELECT
    id, patient_id, encounter_id,
    clinical_status, verification_status, category,
    code, code_display, code_system,
    TRY_CAST(onset_datetime     AS TIMESTAMP) AS onset_datetime,
    TRY_CAST(recorded_date      AS TIMESTAMP) AS recorded_date,
    TRY_CAST(abatement_datetime AS TIMESTAMP) AS abatement_datetime
FROM source_condition;

CREATE OR REPLACE TABLE observation AS SELECT
    id, patient_id, encounter_id, status, category,
    code, code_display, code_system,
    TRY_CAST(effective_datetime      AS TIMESTAMP) AS effective_datetime,
    value_type,
    TRY_CAST(value_quantity_value    AS DOUBLE)    AS value_quantity_value,
    value_quantity_unit, value_quantity_code, value_codeable_text, value_string,
    data_absent_reason,
    TRY_CAST(component_count         AS INTEGER)   AS component_count
FROM source_observation;

CREATE OR REPLACE TABLE observation_component AS SELECT
    observation_id,
    TRY_CAST(ordinal AS INTEGER)            AS ordinal,
    code, code_display,
    TRY_CAST(value_quantity_value AS DOUBLE) AS value_quantity_value,
    value_quantity_unit, value_codeable_text
FROM source_observation_component;

CREATE OR REPLACE TABLE observation_reference_range AS SELECT
    observation_id,
    TRY_CAST(ordinal AS INTEGER)   AS ordinal,
    TRY_CAST(low_value  AS DOUBLE) AS low_value, low_unit,
    TRY_CAST(high_value AS DOUBLE) AS high_value, high_unit,
    type_code, type_display, text
FROM source_observation_reference_range;

CREATE OR REPLACE TABLE medication_request AS SELECT
    id, patient_id, encounter_id, status, intent, priority,
    TRY_CAST(authored_on AS TIMESTAMP)      AS authored_on,
    medication_type, medication_code, medication_text,
    TRY_CAST(dosage_count AS INTEGER)       AS dosage_count,
    dosage_text,
    TRY_CAST(dose_value   AS DOUBLE)        AS dose_value,
    dose_unit,
    TRY_CAST(frequency    AS INTEGER)       AS frequency,
    TRY_CAST(period       AS DOUBLE)        AS period,
    period_unit, route_code
FROM source_medication_request;

CREATE OR REPLACE TABLE allergy_intolerance AS SELECT
    id, patient_id, clinical_status, verification_status, criticality, type, category,
    code, code_display, code_system,
    TRY_CAST(recorded_date  AS TIMESTAMP) AS recorded_date,
    TRY_CAST(reaction_count AS INTEGER)   AS reaction_count
FROM source_allergy_intolerance;

CREATE OR REPLACE TABLE allergy_reaction AS SELECT
    allergy_id,
    TRY_CAST(ordinal AS INTEGER)     AS ordinal,
    manifestation_code, manifestation_display, severity,
    TRY_CAST(onset AS TIMESTAMP)     AS onset,
    description
FROM source_allergy_reaction;

CREATE OR REPLACE TABLE procedure AS SELECT
    id, patient_id, encounter_id, status, code, code_display, code_system,
    TRY_CAST(performed_datetime AS TIMESTAMP) AS performed_datetime,
    TRY_CAST(performed_start    AS TIMESTAMP) AS performed_start,
    TRY_CAST(performed_end      AS TIMESTAMP) AS performed_end
FROM source_procedure;

CREATE OR REPLACE TABLE immunization AS SELECT
    id, patient_id, encounter_id, status, vaccine_code, vaccine_display,
    TRY_CAST(occurrence_datetime AS TIMESTAMP) AS occurrence_datetime,
    lot_number, site_code, route_code,
    TRY_CAST(dose_value AS DOUBLE)             AS dose_value,
    dose_unit
FROM source_immunization;

CREATE OR REPLACE TABLE diagnostic_report AS SELECT
    id, patient_id, encounter_id, status, category, code, code_display,
    TRY_CAST(effective_datetime AS TIMESTAMP) AS effective_datetime,
    TRY_CAST(issued             AS TIMESTAMP) AS issued,
    conclusion,
    TRY_CAST(result_count AS INTEGER)         AS result_count
FROM source_diagnostic_report;

CREATE OR REPLACE TABLE diagnostic_report_result AS SELECT
    report_id,
    TRY_CAST(ordinal AS INTEGER) AS ordinal,
    observation_id
FROM source_diagnostic_report_result;

CREATE OR REPLACE TABLE claim AS SELECT
    id, patient_id, status, use,
    TRY_CAST(created AS TIMESTAMP)        AS created,
    priority,
    TRY_CAST(total_value AS DOUBLE)       AS total_value,
    total_currency,
    TRY_CAST(billable_start AS TIMESTAMP) AS billable_start,
    TRY_CAST(billable_end   AS TIMESTAMP) AS billable_end
FROM source_claim;

CREATE OR REPLACE TABLE explanation_of_benefit AS SELECT
    id, patient_id, status, use,
    TRY_CAST(created AS TIMESTAMP)  AS created,
    outcome,
    TRY_CAST(total_value AS DOUBLE) AS total_value,
    total_currency
FROM source_explanation_of_benefit;

CREATE OR REPLACE TABLE care_plan AS SELECT
    id, patient_id, status, intent, title, category,
    TRY_CAST(period_start AS TIMESTAMP) AS period_start,
    TRY_CAST(period_end   AS TIMESTAMP) AS period_end
FROM source_care_plan;

CREATE OR REPLACE TABLE goal AS SELECT
    id, patient_id, lifecycle_status, achievement_status, description,
    TRY_CAST(start_date AS DATE)      AS start_date,
    TRY_CAST(target_count AS INTEGER) AS target_count
FROM source_goal;

CREATE OR REPLACE TABLE _load_manifest AS SELECT
    table_name,
    TRY_CAST(row_count AS INTEGER) AS row_count,
    source_types
FROM source__load_manifest;

-- Two views for reading the shape rather than the rows.

-- How much of each patient's record is billing.
CREATE OR REPLACE VIEW v_record_mix AS
SELECT patient_id, source_types AS resource_type, row_count,
       source_types IN ('Claim', 'ExplanationOfBenefit') AS is_billing
FROM (
    SELECT patient_id, 'Claim' AS source_types, COUNT(*) AS row_count FROM claim GROUP BY patient_id
    UNION ALL SELECT patient_id, 'ExplanationOfBenefit', COUNT(*) FROM explanation_of_benefit GROUP BY patient_id
    UNION ALL SELECT patient_id, 'Observation', COUNT(*) FROM observation GROUP BY patient_id
    UNION ALL SELECT patient_id, 'Encounter', COUNT(*) FROM encounter GROUP BY patient_id
    UNION ALL SELECT patient_id, 'Procedure', COUNT(*) FROM procedure GROUP BY patient_id
    UNION ALL SELECT patient_id, 'DiagnosticReport', COUNT(*) FROM diagnostic_report GROUP BY patient_id
    UNION ALL SELECT patient_id, 'Immunization', COUNT(*) FROM immunization GROUP BY patient_id
    UNION ALL SELECT patient_id, 'Condition', COUNT(*) FROM condition GROUP BY patient_id
    UNION ALL SELECT patient_id, 'MedicationRequest', COUNT(*) FROM medication_request GROUP BY patient_id
    UNION ALL SELECT patient_id, 'AllergyIntolerance', COUNT(*) FROM allergy_intolerance GROUP BY patient_id
);

-- The collapse the UI design proposes: 861 observations become one row per patient and code.
CREATE OR REPLACE VIEW v_observation_latest_per_code AS
SELECT patient_id, code, any_value(code_display) AS code_display, COUNT(*) AS readings,
       arg_max(value_quantity_value, effective_datetime) AS latest_value,
       arg_max(value_quantity_unit,  effective_datetime) AS unit,
       max(effective_datetime) AS latest_at,
       min(effective_datetime) AS first_at
FROM observation
GROUP BY patient_id, code;
