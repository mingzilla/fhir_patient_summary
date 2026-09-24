# Synthesised report — fourth patient

_Report for patient 12069, generated from `fhir_sample.duckdb`._

A child's record, and it reads like one: 33 of its 194 clinical events are immunisations and 20 are
visits, most of them check-ups. Eight allergies are recorded, every one of them on 2014-03-15 and
every one still active — mould, house dust mite, animal dander, grass and tree pollen, dairy, nut
and peanut — and the loratadine and epinephrine auto-injector ordered the same day are the
treatment still in force for them. All eight are recorded at low criticality, which is the risk
the allergy poses rather than how bad a reaction was. Five years later, on 2019-02-05, an acute
allergic reaction was seen in the emergency room and treated with prednisone; it resolved the same
day, and it is one of only two problems in the whole record. The measurements are a child's rather
than an adult's — body mass index 17.36, blood pressure 124.67 over 80.55 — with body mass index
down from 17.42 while both blood pressures rose. Six of the nine key measurements were never
taken. The record's last event is 2019-02-11, so the age above is the age then and not the age
today.

---

## Patient

| Patient |  Sex   | Age |    Born    |  Died  | First seen |   As of    | Clinical events | Source |
|---------|--------|----:|------------|--------|------------|------------|----------------:|--------|
| Welch   | female | 6   | 2013-01-07 | living | 2013-01-07 | 2019-02-11 | 194             | 12069  |

## Problems

|   Onset    |  Status  |          Problem           | Years |       Outcome       | Source | Pair |
|------------|----------|----------------------------|------:|---------------------|--------|------|
| 2019-02-05 | RESOLVED | Acute allergic reaction    | 0     | resolved 2019-02-05 | 12301  |      |
| 2018-04-17 | RESOLVED | Viral sinusitis (disorder) | 0     | resolved 2018-04-24 | 12275  |      |

## Prescriptions

|  Ordered   |                     Medication                     | Status  | Gap (days) | Course | Source |
|------------|----------------------------------------------------|---------|-----------:|--------|--------|
| 2019-02-05 | predniSONE 5 MG Oral Tablet                        | stopped | NULL       | first  | 12303  |
| 2014-03-15 | Loratadine 5 MG Chewable Tablet                    | active  | NULL       | first  | 12194  |
| 2014-03-15 | NDA020800 0.3 ML Epinephrine 1 MG/ML Auto-Injector | active  | NULL       | first  | 12196  |
_No renewal pattern: every order is a first._

## Measurements that matter

|  Code   |       Measurement        | Latest |  Unit  | Previous |       Change       |  Why it matters  | Source | Source (prev) |
|---------|--------------------------|-------:|--------|---------:|--------------------|------------------|--------|---------------|
| 39156-5 | Body Mass Index          | 17.36  | kg/m2  | 17.42    | falling from 17.42 | weight           | 12282  | 12264         |
| 8462-4  | Diastolic Blood Pressure | 80.55  | mm[Hg] | 79.9     | rising from 79.9   | blood pressure   | 12283  | 12265         |
| 8480-6  | Systolic Blood Pressure  | 124.67 | mm[Hg] | 121.08   | rising from 121.08 | blood pressure   | 12283  | 12265         |
| 18262-6 | (not in this record)     | NULL   |        | NULL     | not measured       | cholesterol      | NULL   | NULL          |
| 2085-9  | (not in this record)     | NULL   |        | NULL     | not measured       | cholesterol      | NULL   | NULL          |
| 2093-3  | (not in this record)     | NULL   |        | NULL     | not measured       | cholesterol      | NULL   | NULL          |
| 2857-1  | (not in this record)     | NULL   |        | NULL     | not measured       | prostate         | NULL   | NULL          |
| 38483-4 | (not in this record)     | NULL   |        | NULL     | not measured       | kidney           | NULL   | NULL          |
| 4548-4  | (not in this record)     | NULL   |        | NULL     | not measured       | diabetes control | NULL   | NULL          |

## Allergies

|  Recorded  |         Allergen         | Criticality | Status | Source |
|------------|--------------------------|-------------|--------|--------|
| 2014-03-15 | Allergy to mould         | low         | ACTIVE | 12170  |
| 2014-03-15 | House dust mite allergy  | low         | ACTIVE | 12171  |
| 2014-03-15 | Dander (animal) allergy  | low         | ACTIVE | 12172  |
| 2014-03-15 | Allergy to grass pollen  | low         | ACTIVE | 12173  |
| 2014-03-15 | Allergy to tree pollen   | low         | ACTIVE | 12174  |
| 2014-03-15 | Allergy to dairy product | low         | ACTIVE | 12175  |
| 2014-03-15 | Allergy to nut           | low         | ACTIVE | 12176  |
| 2014-03-15 | Allergy to peanuts       | low         | ACTIVE | 12177  |

## Visits

|    Date    |                Visit                 | Results | Reports |        New problem         | Source |
|------------|--------------------------------------|--------:|--------:|----------------------------|--------|
| 2019-02-11 | Encounter for problem                | 0       | 0       |                            | 12307  |
| 2019-02-05 | Emergency room admission (procedure) | 0       | 0       | Acute allergic reaction    | 12300  |
| 2018-12-24 | Encounter for check up (procedure)   | 17      | 1       |                            | 12278  |
| 2018-04-17 | Encounter for symptom                | 0       | 0       | Viral sinusitis (disorder) | 12274  |
| 2017-12-18 | Encounter for check up (procedure)   | 6       | 0       |                            | 12260  |
| 2016-12-12 | Encounter for check up (procedure)   | 6       | 0       |                            | 12249  |
| 2016-06-13 | Encounter for check up (procedure)   | 6       | 0       |                            | 12240  |
| 2015-12-14 | Encounter for check up (procedure)   | 6       | 0       |                            | 12229  |
| 2015-06-15 | Encounter for check up (procedure)   | 6       | 0       |                            | 12218  |
| 2014-12-15 | Encounter for check up (procedure)   | 5       | 0       |                            | 12209  |
| 2014-06-16 | Encounter for check up (procedure)   | 5       | 0       |                            | 12200  |
| 2014-03-17 | Encounter for check up (procedure)   | 5       | 0       |                            | 12156  |
| 2014-03-15 | Encounter for problem                | 15      | 0       |                            | 12169  |
| 2014-03-03 | Encounter for problem                | 0       | 0       |                            | 12152  |
| 2013-12-16 | Encounter for check up (procedure)   | 5       | 0       |                            | 12144  |
| 2013-09-16 | Encounter for check up (procedure)   | 5       | 0       |                            | 12130  |
| 2013-06-17 | Encounter for check up (procedure)   | 5       | 0       |                            | 12117  |
| 2013-04-15 | Encounter for check up (procedure)   | 5       | 0       |                            | 12104  |
| 2013-02-11 | Encounter for check up (procedure)   | 5       | 0       |                            | 12094  |
| 2013-01-07 | Encounter for check up (procedure)   | 16      | 1       |                            | 12072  |

## What the record is made of

|        Resource        | Rows |  Class   |
|------------------------|-----:|----------|
| observation            | 118  | clinical |
| immunization           | 33   | clinical |
| claim                  | 23   | billing  |
| encounter              | 20   | clinical |
| explanation_of_benefit | 20   | billing  |
| allergy_intolerance    | 8    | clinical |
| procedure              | 8    | clinical |
| medication_request     | 3    | clinical |
| condition              | 2    | clinical |
| diagnostic_report      | 2    | clinical |
| care_plan              | 1    | not read |
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
