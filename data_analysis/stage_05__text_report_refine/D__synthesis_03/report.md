# Synthesised report — third patient

_Report for patient 87788, generated from `fhir_sample.duckdb`._

Hypertension is the only ongoing problem in this record: recorded in 2009 and still active eight
years later, with hydrochlorothiazide ordered the same day and never stopped. Everything else is
acute and closed — six episodes of viral sinusitis or pharyngitis between 2012 and 2016, each
resolved within three weeks, and the one amoxicillin/clavulanate course ordered again 724 days
after the first. All three measurements the record carries are rising: systolic blood pressure
from 152.44 to 193.57, diastolic from 98.85 to 116.36, and body mass index from 23.54 to 24.96.
Six of the nine key measurements were never taken. The record's last event is 2017-07-15, so the
age above is the age then and not the age today.

---

## Patient

| Patient | Sex  | Age |    Born    |  Died  | First seen |   As of    | Clinical events | Source |
|---------|------|----:|------------|--------|------------|------------|----------------:|--------|
| Abbott  | male | 27  | 1990-09-01 | living | 2009-07-25 | 2017-07-15 | 81              | 87788  |

## Problems

|   Onset    |  Status  |              Problem               | Years |       Outcome       | Source | Pair |
|------------|----------|------------------------------------|------:|---------------------|--------|------|
| 2009-07-25 | ACTIVE   | Hypertension                       | 8     | ongoing             | 87792  |      |
| 2016-08-15 | RESOLVED | Viral sinusitis (disorder)         | 0     | resolved 2016-08-22 | 87883  |      |
| 2015-03-24 | RESOLVED | Acute viral pharyngitis (disorder) | 0     | resolved 2015-04-01 | 87877  |      |
| 2014-11-26 | RESOLVED | Viral sinusitis (disorder)         | 0     | resolved 2014-12-17 | 87871  |      |
| 2014-07-07 | RESOLVED | Viral sinusitis (disorder)         | 0     | resolved 2014-07-21 | 87867  |      |
| 2013-07-28 | RESOLVED | Viral sinusitis (disorder)         | 0     | resolved 2013-08-04 | 87850  |      |
| 2012-12-02 | RESOLVED | Viral sinusitis (disorder)         | 0     | resolved 2012-12-23 | 87817  |      |

## Prescriptions

|  Ordered   |                     Medication                      | Status  | Gap (days) |  Course  | Source |
|------------|-----------------------------------------------------|---------|-----------:|----------|--------|
| 2014-11-26 | Amoxicillin 250 MG / Clavulanate 125 MG Oral Tablet | stopped | 724        | re-order | 87872  |
| 2012-12-02 | Amoxicillin 250 MG / Clavulanate 125 MG Oral Tablet | stopped | NULL       | first    | 87818  |
| 2009-07-25 | Hydrochlorothiazide 25 MG                           | active  | NULL       | first    | 87799  |

## Measurements that matter

|  Code   |       Measurement        | Latest |  Unit  | Previous |       Change       |  Why it matters  | Source | Source (prev) |
|---------|--------------------------|-------:|--------|---------:|--------------------|------------------|--------|---------------|
| 39156-5 | Body Mass Index          | 24.96  | kg/m2  | 23.54    | rising from 23.54  | weight           | 87890  | 87857         |
| 8462-4  | Diastolic Blood Pressure | 116.36 | mm[Hg] | 98.85    | rising from 98.85  | blood pressure   | 87891  | 87858         |
| 8480-6  | Systolic Blood Pressure  | 193.57 | mm[Hg] | 152.44   | rising from 152.44 | blood pressure   | 87891  | 87858         |
| 18262-6 | (not in this record)     | NULL   |        | NULL     | not measured       | cholesterol      | NULL   | NULL          |
| 2085-9  | (not in this record)     | NULL   |        | NULL     | not measured       | cholesterol      | NULL   | NULL          |
| 2093-3  | (not in this record)     | NULL   |        | NULL     | not measured       | cholesterol      | NULL   | NULL          |
| 2857-1  | (not in this record)     | NULL   |        | NULL     | not measured       | prostate         | NULL   | NULL          |
| 38483-4 | (not in this record)     | NULL   |        | NULL     | not measured       | kidney           | NULL   | NULL          |
| 4548-4  | (not in this record)     | NULL   |        | NULL     | not measured       | diabetes control | NULL   | NULL          |

## Allergies

| Recorded | Allergen | Criticality | Status | Source |
|----------|----------|-------------|--------|--------|

## Visits

|    Date    |               Visit                | Results | Reports |            New problem             | Source |
|------------|------------------------------------|--------:|--------:|------------------------------------|--------|
| 2017-07-15 | Encounter for check up (procedure) | 7       | 0       |                                    | 87886  |
| 2016-08-15 | Encounter for symptom              | 0       | 0       | Viral sinusitis (disorder)         | 87882  |
| 2015-03-24 | Encounter for symptom              | 1       | 0       | Acute viral pharyngitis (disorder) | 87876  |
| 2014-11-26 | Encounter for symptom              | 0       | 0       | Viral sinusitis (disorder)         | 87870  |
| 2014-07-12 | Encounter for check up (procedure) | 7       | 0       |                                    | 87853  |
| 2014-07-07 | Encounter for symptom              | 0       | 0       | Viral sinusitis (disorder)         | 87866  |
| 2013-08-03 | Encounter for check up (procedure) | 18      | 1       |                                    | 87822  |
| 2013-07-28 | Encounter for symptom              | 0       | 0       | Viral sinusitis (disorder)         | 87849  |
| 2012-12-02 | Encounter for symptom              | 0       | 0       | Viral sinusitis (disorder)         | 87816  |
| 2010-07-31 | Encounter for check up (procedure) | 7       | 0       |                                    | 87804  |
| 2009-07-25 | Encounter for check up (procedure) | 6       | 0       | Hypertension                       | 87791  |

## What the record is made of

|        Resource        | Rows |  Class   |
|------------------------|-----:|----------|
| observation            | 46   | clinical |
| claim                  | 14   | billing  |
| encounter              | 11   | clinical |
| explanation_of_benefit | 11   | billing  |
| immunization           | 9    | clinical |
| condition              | 7    | clinical |
| procedure              | 4    | clinical |
| medication_request     | 3    | clinical |
| diagnostic_report      | 1    | clinical |
| allergy_intolerance    | 0    | clinical |
| care_plan              | 0    | not read |
| goal                   | 0    | not read |


## Conventions

- **Ordering.** Every table is newest first, with a total sort — a tiebreaker on a unique column
  in every `ORDER BY`. Where rows share a day the tiebreaker is the resource id, which is
  insertion order and **not** clinical order: two visits on one day come out by id, and that is a
  tiebreaker rather than a finding.
- **`Clinical events`** counts the eight clinical types this report reads. The record mix lists
  twelve, because it shows what the record *holds*: `billing` and `not read` rows are counted
  there and fetched nowhere.
- **`Source`** is the resource id a row came from, so any line can be traced back past the report
  to the record. The record mix has none, because an aggregate over a whole table has no single
  row behind it.
- **`Age`** is age at `as of`, not age today: age at death for a deceased patient, and age at the
  last recorded event for a living one. The two differ whenever the record is not current.
- **A panel with no rows renders as an empty table, not as an absent one.** The eight tabs of
  the application work the same way, and for the same reason: `Allergies (0)` is a finding, while
  a missing panel is ambiguous between *none* and *not asked*.
- **A key measurement the record does not carry is shown as `not measured`**, not omitted. Nine
  codes are always listed, so the panel's shape does not change with the patient, and *no PSA was
  ever taken* is a fact about the record rather than a gap in the report.
- **`Years`** counts year boundaries crossed rather than complete years elapsed, which is what
  `date_diff('year', …)` returns. A span of three years and 364 days reads as 4, so the column is
  approximate by up to a year — deliberately, since it is for reading, not for arithmetic.
