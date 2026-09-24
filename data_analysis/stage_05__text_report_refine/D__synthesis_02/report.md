# Synthesised report — second patient

_Report for patient 1390, generated from `fhir_sample.duckdb`._

An 83-year-old man, living, with 34 years of problems in the record. A cardiac arrest in 1984 is
followed by atrial fibrillation and a stroke in 1993, and the three drugs started that day —
verapamil, digoxin and warfarin — are all still active 25 years later, alongside alendronic acid
begun for osteoporosis in 1995. That osteoporosis has produced two pathological fractures, an
ankle in 2009 and a forearm in 2016, each treated with analgesics and each resolved. Cholesterol
has fallen on treatment while body mass index has drifted up to 28.44. In 2018 he was started on
galantamine for Alzheimer's disease, the most recent problem in a record that otherwise changed
very little for a quarter of a century.

---

## Patient

| Patient  | Sex  | Age |    Born    |  Died  | First seen |   As of    | Clinical events | Source |
|----------|------|----:|------------|--------|------------|------------|----------------:|--------|
| Portillo | male | 83  | 1935-04-14 | living | 1984-02-19 | 2018-12-16 | 182             | 1390   |

## Problems

|   Onset    |  Status  |                       Problem                        | Years |       Outcome       | Source |                         Pair                         |
|------------|----------|------------------------------------------------------|------:|---------------------|--------|------------------------------------------------------|
| 2018-03-18 | ACTIVE   | Alzheimer's disease (disorder)                       | 0     | ongoing             | 1597   |                                                      |
| 1995-11-12 | ACTIVE   | Osteoporosis (disorder)                              | 23    | ongoing             | 1414   |                                                      |
| 1993-10-31 | ACTIVE   | Atrial Fibrillation                                  | 25    | ongoing             | 1403   | Stroke                                               |
| 1993-10-31 | ACTIVE   | Stroke                                               | 25    | ongoing             | 1404   | Atrial Fibrillation                                  |
| 1991-10-20 | ACTIVE   | Body mass index 30+ - obesity (finding)              | 27    | ongoing             | 1399   |                                                      |
| 1984-02-19 | ACTIVE   | Cardiac Arrest                                       | 34    | ongoing             | 1394   | History of cardiac arrest (situation)                |
| 1984-02-19 | ACTIVE   | History of cardiac arrest (situation)                | 34    | ongoing             | 1395   | Cardiac Arrest                                       |
| 2018-12-03 | RESOLVED | Viral sinusitis (disorder)                           | 0     | resolved 2018-12-10 | 1630   |                                                      |
| 2016-06-24 | RESOLVED | Fracture of forearm                                  | 0     | resolved 2016-08-23 | 1556   | Pathological fracture due to osteoporosis (disorder) |
| 2016-06-24 | RESOLVED | Pathological fracture due to osteoporosis (disorder) | 0     | resolved 2016-08-23 | 1557   | Fracture of forearm                                  |
| 2014-04-26 | RESOLVED | Streptococcal sore throat (disorder)                 | 0     | resolved 2014-05-09 | 1512   |                                                      |
| 2009-11-28 | RESOLVED | Fracture of ankle                                    | 0     | resolved 2009-12-28 | 1420   | Pathological fracture due to osteoporosis (disorder) |
| 2009-11-28 | RESOLVED | Pathological fracture due to osteoporosis (disorder) | 0     | resolved 2009-12-28 | 1421   | Fracture of ankle                                    |

## Prescriptions

|  Ordered   |                            Medication                            | Status  | Gap (days) | Course | Source |
|------------|------------------------------------------------------------------|---------|-----------:|--------|--------|
| 2018-03-18 | Galantamine 4 MG Oral Tablet                                     | active  | NULL       | first  | 1611   |
| 2016-06-24 | Meperidine Hydrochloride 50 MG Oral Tablet                       | stopped | NULL       | first  | 1560   |
| 2016-06-24 | Ibuprofen 200 MG Oral Tablet                                     | stopped | NULL       | first  | 1562   |
| 2015-01-04 | Clopidogrel 75 MG Oral Tablet                                    | stopped | NULL       | first  | 1518   |
| 2015-01-04 | Alteplase 100 MG Injection                                       | stopped | NULL       | first  | 1520   |
| 2009-11-28 | Acetaminophen 325 MG / HYDROcodone Bitartrate 7.5 MG Oral Tablet | stopped | NULL       | first  | 1424   |
| 2009-11-28 | Acetaminophen 325 MG Oral Tablet                                 | stopped | NULL       | first  | 1426   |
| 1995-11-12 | Alendronic acid 10 MG Oral Tablet                                | active  | NULL       | first  | 1415   |
| 1993-10-31 | Verapamil Hydrochloride 40 MG                                    | active  | NULL       | first  | 1405   |
| 1993-10-31 | Digoxin 0.125 MG Oral Tablet                                     | active  | NULL       | first  | 1407   |
| 1993-10-31 | Warfarin Sodium 5 MG Oral Tablet                                 | active  | NULL       | first  | 1409   |
_No renewal pattern: every order is a first._

## Measurements that matter

|  Code   |             Measurement              | Latest |  Unit  | Previous |       Change        |  Why it matters  | Source | Source (prev) |
|---------|--------------------------------------|-------:|--------|---------:|---------------------|------------------|--------|---------------|
| 39156-5 | Body Mass Index                      | 28.44  | kg/m2  | 27.96    | rising from 27.96   | weight           | 1637   | 1601          |
| 8462-4  | Diastolic Blood Pressure             | 85.46  | mm[Hg] | 81.89    | rising from 81.89   | blood pressure   | 1638   | 1602          |
| 8480-6  | Systolic Blood Pressure              | 102.4  | mm[Hg] | 116.55   | falling from 116.55 | blood pressure   | 1638   | 1602          |
| 18262-6 | Low Density Lipoprotein Cholesterol  | 61.46  | mg/dL  | 80.94    | falling from 80.94  | cholesterol      | 1605   | 1532          |
| 2085-9  | High Density Lipoprotein Cholesterol | 78.24  | mg/dL  | 61.8     | rising from 61.8    | cholesterol      | 1606   | 1533          |
| 2093-3  | Total Cholesterol                    | 160.92 | mg/dL  | 169.49   | falling from 169.49 | cholesterol      | 1603   | 1530          |
| 2857-1  | (not in this record)                 | NULL   |        | NULL     | not measured        | prostate         | NULL   | NULL          |
| 38483-4 | (not in this record)                 | NULL   |        | NULL     | not measured        | kidney           | NULL   | NULL          |
| 4548-4  | (not in this record)                 | NULL   |        | NULL     | not measured        | diabetes control | NULL   | NULL          |

## Allergies

| Recorded | Allergen | Criticality | Status | Source |
|----------|----------|-------------|--------|--------|

## Visits

|    Date    |                Visit                 | Results | Reports |                                New problem                                | Source |
|------------|--------------------------------------|--------:|--------:|---------------------------------------------------------------------------|--------|
| 2018-12-16 | Encounter for check up (procedure)   | 6       | 0       |                                                                           | 1633   |
| 2018-12-09 | Outpatient procedure (procedure)     | 0       | 0       |                                                                           | 1625   |
| 2018-12-03 | Encounter for symptom                | 0       | 0       | Viral sinusitis (disorder)                                                | 1629   |
| 2018-12-02 | Outpatient procedure (procedure)     | 0       | 0       |                                                                           | 1620   |
| 2018-03-18 | Encounter for check up (procedure)   | 11      | 1       | Alzheimer's disease (disorder)                                            | 1596   |
| 2017-03-12 | Encounter for check up (procedure)   | 17      | 1       |                                                                           | 1571   |
| 2016-08-23 | Encounter for 'check-up'             | 0       | 0       |                                                                           | 1568   |
| 2016-06-24 | Emergency room admission (procedure) | 0       | 0       | Fracture of forearm; Pathological fracture due to osteoporosis (disorder) | 1555   |
| 2016-03-06 | Encounter for check up (procedure)   | 6       | 0       |                                                                           | 1544   |
| 2015-04-07 | Encounter for 'check-up'             | 0       | 0       |                                                                           | 1540   |
| 2015-03-01 | Encounter for check up (procedure)   | 10      | 1       |                                                                           | 1524   |
| 2015-01-04 | Emergency Encounter                  | 0       | 0       |                                                                           | 1516   |
| 2014-04-26 | Encounter for symptom                | 1       | 0       | Streptococcal sore throat (disorder)                                      | 1511   |
| 2014-02-23 | Encounter for check up (procedure)   | 6       | 0       |                                                                           | 1500   |
| 2013-02-17 | Encounter for check up (procedure)   | 6       | 0       |                                                                           | 1489   |
| 2012-02-12 | Encounter for check up (procedure)   | 21      | 2       |                                                                           | 1461   |
| 2011-02-06 | Encounter for check up (procedure)   | 6       | 0       |                                                                           | 1450   |
| 2010-04-08 | Encounter for 'check-up'             | 0       | 0       |                                                                           | 1446   |
| 2010-01-31 | Encounter for check up (procedure)   | 6       | 0       |                                                                           | 1435   |
| 2009-12-28 | Encounter for 'check-up'             | 0       | 0       |                                                                           | 1432   |
| 2009-11-28 | Emergency room admission (procedure) | 0       | 0       | Fracture of ankle; Pathological fracture due to osteoporosis (disorder)   | 1419   |
| 1995-11-12 | Encounter for check up (procedure)   | 0       | 0       | Osteoporosis (disorder)                                                   | 1413   |
| 1993-10-31 | Encounter for check up (procedure)   | 0       | 0       | Atrial Fibrillation; Stroke                                               | 1402   |
| 1991-10-20 | Encounter for check up (procedure)   | 0       | 0       | Body mass index 30+ - obesity (finding)                                   | 1398   |
| 1984-02-19 | Emergency Encounter                  | 0       | 0       | Cardiac Arrest; History of cardiac arrest (situation)                     | 1393   |

## What the record is made of

|        Resource        | Rows |  Class   |
|------------------------|-----:|----------|
| observation            | 96   | clinical |
| claim                  | 36   | billing  |
| encounter              | 25   | clinical |
| explanation_of_benefit | 25   | billing  |
| procedure              | 21   | clinical |
| condition              | 13   | clinical |
| immunization           | 11   | clinical |
| medication_request     | 11   | clinical |
| diagnostic_report      | 5    | clinical |
| care_plan              | 3    | not read |
| allergy_intolerance    | 0    | clinical |
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
