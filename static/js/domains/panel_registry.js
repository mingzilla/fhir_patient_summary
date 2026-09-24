import { AllergyRow } from './allergy_row.js';
import { KeyMeasureRow } from './key_measure_row.js';
import { MedicationRow } from './medication_row.js';
import { PatientHeader } from './patient_header.js';
import { ProblemRow } from './problem_row.js';
import { RecordMixRow } from './record_mix_row.js';
import { VisitRow } from './visit_row.js';

/**
 * The seven panels, enumerated once.
 *
 * `title` is the report's heading, which is not always the endpoint's name: the endpoint
 * `medications` is the report's **Prescriptions**, and `key_measures` is its **Measurements
 * that matter**. The contract names both, and the report is what the reader is shown.
 *
 * `endpoint` is the path segment under `/dashboard/{patient_id}/`. `domain` maps a row of it.
 * The store, the service and the page all read this list rather than repeating it.
 */
export const PANEL_REGISTRY = Object.freeze([
  Object.freeze({ key: 'patient', title: 'Patient', endpoint: 'patient', domain: PatientHeader }),
  Object.freeze({ key: 'problems', title: 'Problems', endpoint: 'problems', domain: ProblemRow }),
  Object.freeze({ key: 'medications', title: 'Prescriptions', endpoint: 'medications',
                  domain: MedicationRow }),
  Object.freeze({ key: 'key_measures', title: 'Measurements that matter',
                  endpoint: 'key_measures', domain: KeyMeasureRow }),
  Object.freeze({ key: 'allergies', title: 'Allergies', endpoint: 'allergies',
                  domain: AllergyRow }),
  Object.freeze({ key: 'visits', title: 'Visits', endpoint: 'visits', domain: VisitRow }),
  Object.freeze({ key: 'record_mix', title: 'What the record is made of',
                  endpoint: 'record_mix', domain: RecordMixRow }),
]);

export const PANEL_KEY = Object.freeze(
  Object.fromEntries(PANEL_REGISTRY.map((panel) => [panel.key.toUpperCase(), panel.key])),
);

/** The header is a scalar strip and is not one of the six chart panels. */
export const HEADER_PANEL_KEY = PANEL_KEY.PATIENT;
