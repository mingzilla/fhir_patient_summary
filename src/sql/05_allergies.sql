-- Panel 5 - allergies. One row per recorded allergy.
--
-- The only safety resource in the record, and the one panel where an empty table is
-- unambiguously a finding rather than a gap: *none known* is what a clinician needs from this
-- tab. The application's `Allergies (0)` tab reads the same way, and this panel exists because
-- the report claimed that model while having no panel to match it.
--
-- `Criticality` is the risk the allergy poses, **not** how bad an episode was. `allergy_reaction`
-- holds that second thing - manifestation and severity - and it is empty for every patient in
-- this sample, so no column here claims a severity the record never captured. `reaction_count`
-- is 0 on all nine rows for the same reason.
--
-- `category` is deliberately absent, and this is a judgement worth stating. It reads `food` on
-- all nine rows in this sample, including `Allergy to grass pollen`, `House dust mite allergy`
-- and `Dander (animal) allergy`. A column repeating that would put a value in the table that the
-- record does not support, which is the failure this whole report is built to avoid.
--
-- The sort is `recorded_date DESC, id ASC`. Where a patient's allergies were all recorded at one
-- encounter - every one of patient 12069's was - the order within that day is id order, which is
-- insertion order and not clinical order. Same caveat as panel 6, stated rather than left to
-- look meaningful.
.mode markdown
SET VARIABLE pid = 1643;
SELECT a.recorded_date::date AS "Recorded", a.code_display AS "Allergen",
       a.criticality AS "Criticality", upper(a.clinical_status) AS "Status",
       a.id::varchar AS "Source"
FROM allergy_intolerance a WHERE a.patient_id = getvariable('pid')
ORDER BY a.recorded_date DESC, a.id;
