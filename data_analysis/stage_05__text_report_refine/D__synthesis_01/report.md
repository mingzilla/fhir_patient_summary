# Synthesised report

_Report for patient 1643, generated from `fhir_sample.duckdb`._

Five problems were active when he died and three more had resolved, all of them short-lived respiratory infections. Their durations tell the story better than their dates: tobacco use ran for 36 years, prediabetes for 28, anaemia for 21 and hyperlipidaemia for 9, and prostate cancer appeared in 2001 with its metastasis recorded the same day. Against that background the prescription record holds one drug renewed annually — simvastatin, every 365 days from 1996 to 2004 — which reads as a course being continued rather than a sequence of decisions. The measurements that matter are moving in two directions at once: PSA rising from 0.72 to 5.14 ng/mL, creatinine falling from 3.11 to 1.03 mg/dL, and HbA1c at 6.36 per cent and rising.

---

## Patient

| Patient | Sex  | Age |    Born    |    Died    | First seen |   As of    | Clinical events | Source |
|---------|------|----:|------------|------------|------------|------------|----------------:|--------|
| Pulido  | male | 71  | 1934-10-17 | 2005-05-23 | 1965-12-29 | 2005-05-25 | 473             | 1643   |

## Problems

|   Onset    |  Status  |                        Problem                         | Years |       Outcome       | Source |                          Pair                          |
|------------|----------|--------------------------------------------------------|------:|---------------------|--------|--------------------------------------------------------|
| 2001-05-24 | ACTIVE   | Neoplasm of prostate                                   | 4     | ongoing             | 2021   | Metastasis from malignant tumor of prostate (disorder) |
| 2001-05-24 | ACTIVE   | Metastasis from malignant tumor of prostate (disorder) | 4     | ongoing             | 2022   | Neoplasm of prostate                                   |
| 1996-05-01 | ACTIVE   | Hyperlipidemia                                         | 9     | ongoing             | 1680   |                                                        |
| 1984-10-17 | ACTIVE   | Anemia (disorder)                                      | 21    | ongoing             | 1667   |                                                        |
| 1977-07-27 | ACTIVE   | Prediabetes                                            | 28    | ongoing             | 1657   |                                                        |
| 1969-01-01 | ACTIVE   | Smokes tobacco daily                                   | 36    | ongoing             | 1653   |                                                        |
| 2004-02-10 | RESOLVED | Acute viral pharyngitis (disorder)                     | 0     | resolved 2004-02-17 | 2145   |                                                        |
| 2003-04-05 | RESOLVED | Acute viral pharyngitis (disorder)                     | 0     | resolved 2003-04-14 | 2092   |                                                        |
| 2000-06-05 | RESOLVED | Viral sinusitis (disorder)                             | 0     | resolved 2000-06-12 | 1960   |                                                        |

## Prescriptions

|  Ordered   |                     Medication                      | Status  | Gap (days) |  Course  | Source |
|------------|-----------------------------------------------------|---------|-----------:|----------|--------|
| 2004-05-20 | Simvistatin 10 MG                                   | active  | 365        | re-order | 2170   |
| 2003-05-21 | Simvistatin 10 MG                                   | stopped | 365        | re-order | 2117   |
| 2002-05-21 | Simvistatin 10 MG                                   | stopped | 365        | re-order | 2048   |
| 2001-05-21 | Simvistatin 10 MG                                   | stopped | 365        | re-order | 1986   |
| 2000-06-05 | Amoxicillin 250 MG / Clavulanate 125 MG Oral Tablet | stopped | NULL       | first    | 1961   |
| 2000-05-21 | Simvistatin 10 MG                                   | stopped | 365        | re-order | 1953   |
| 1999-05-22 | Simvistatin 10 MG                                   | stopped | 365        | re-order | 1899   |
| 1998-05-22 | Simvistatin 10 MG                                   | stopped | 365        | re-order | 1844   |
| 1997-05-22 | Simvistatin 10 MG                                   | stopped | 365        | re-order | 1794   |
| 1996-05-22 | Simvistatin 10 MG                                   | stopped | NULL       | first    | 1733   |
| 1984-10-17 | ferrous sulfate 325 MG Oral Tablet                  | active  | NULL       | first    | 1671   |
| 1965-12-29 | 24hr nicotine transdermal patch                     | active  | NULL       | first    | 1647   |

## Measurements that matter

|  Code   |                      Measurement                      | Latest |  Unit  | Previous |       Change        |  Why it matters  | Source | Source (prev) |
|---------|-------------------------------------------------------|-------:|--------|---------:|---------------------|------------------|--------|---------------|
| 38483-4 | Creatinine                                            | 1.03   | mg/dL  | 3.11     | falling from 3.11   | kidney           | 2184   | 2152          |
| 39156-5 | Body Mass Index                                       | 27.37  | kg/m2  | 27.37    | steady              | weight           | 2180   | 2127          |
| 4548-4  | Hemoglobin A1c/Hemoglobin.total in Blood              | 6.36   | %      | 6.11     | rising from 6.11    | diabetes control | 2191   | 2138          |
| 8462-4  | Diastolic Blood Pressure                              | 76.08  | mm[Hg] | 72.29    | rising from 72.29   | blood pressure   | 2181   | 2128          |
| 8480-6  | Systolic Blood Pressure                               | 129.48 | mm[Hg] | 129.16   | rising from 129.16  | blood pressure   | 2181   | 2128          |
| 18262-6 | Low Density Lipoprotein Cholesterol                   | 107.75 | mg/dL  | 110.72   | falling from 110.72 | cholesterol      | 2168   | 2115          |
| 2085-9  | High Density Lipoprotein Cholesterol                  | 70.75  | mg/dL  | 53.14    | rising from 53.14   | cholesterol      | 2169   | 2116          |
| 2093-3  | Total Cholesterol                                     | 183.29 | mg/dL  | 181.21   | rising from 181.21  | cholesterol      | 2166   | 2113          |
| 2857-1  | Prostate specific Ag [Mass/volume] in Serum or Plasma | 5.14   | ng/mL  | 0.72     | rising from 0.72    | prostate         | 2008   | 1950          |

## Allergies

| Recorded | Allergen | Criticality | Status | Source |
|----------|----------|-------------|--------|--------|

## Visits

|    Date    |               Visit                | Results | Reports |                                 New problem                                  | Source |
|------------|------------------------------------|--------:|--------:|------------------------------------------------------------------------------|--------|
| 2005-05-25 | Death Certification                | 1       | 1       |                                                                              | 2200   |
| 2004-10-12 | Encounter for 'check-up'           | 0       | 0       |                                                                              | 2196   |
| 2004-06-16 | Encounter for check up (procedure) | 15      | 1       |                                                                              | 2176   |
| 2004-05-20 | Follow-up encounter                | 20      | 2       |                                                                              | 2149   |
| 2004-02-10 | Encounter for symptom              | 1       | 0       | Acute viral pharyngitis (disorder)                                           | 2144   |
| 2003-06-11 | Encounter for check up (procedure) | 15      | 1       |                                                                              | 2123   |
| 2003-05-21 | Follow-up encounter                | 20      | 2       |                                                                              | 2096   |
| 2003-04-05 | Encounter for symptom              | 1       | 0       | Acute viral pharyngitis (disorder)                                           | 2091   |
| 2002-06-05 | Encounter for check up (procedure) | 30      | 3       |                                                                              | 2054   |
| 2002-05-21 | Follow-up encounter                | 20      | 2       |                                                                              | 2027   |
| 2001-05-30 | Encounter for check up (procedure) | 16      | 1       |                                                                              | 1992   |
| 2001-05-24 | Encounter for symptom              | 1       | 0       |                                                                              | 2015   |
| 2001-05-24 | Encounter for problem              | 1       | 0       | Metastasis from malignant tumor of prostate (disorder); Neoplasm of prostate | 2020   |
| 2001-05-21 | Follow-up encounter                | 20      | 2       |                                                                              | 1965   |
| 2000-06-05 | Encounter for symptom              | 0       | 0       | Viral sinusitis (disorder)                                                   | 1959   |
| 2000-05-24 | Encounter for check up (procedure) | 14      | 1       |                                                                              | 1909   |
| 2000-05-21 | Follow-up encounter                | 23      | 2       |                                                                              | 1928   |
| 1999-10-14 | Encounter for 'check-up'           | 0       | 0       |                                                                              | 1905   |
| 1999-05-22 | Follow-up encounter                | 20      | 2       |                                                                              | 1878   |
| 1999-05-19 | Encounter for check up (procedure) | 21      | 2       |                                                                              | 1850   |
| 1998-05-22 | Follow-up encounter                | 20      | 2       |                                                                              | 1823   |
| 1998-05-13 | Encounter for check up (procedure) | 17      | 1       |                                                                              | 1800   |
| 1997-05-22 | Follow-up encounter                | 20      | 2       |                                                                              | 1773   |
| 1997-05-07 | Encounter for check up (procedure) | 28      | 2       |                                                                              | 1738   |
| 1996-05-22 | Follow-up encounter                | 0       | 0       |                                                                              | 1732   |
| 1996-05-01 | Encounter for check up (procedure) | 41      | 4       | Hyperlipidemia                                                               | 1679   |
| 1995-04-15 | Encounter for symptom              | 0       | 0       |                                                                              | 1675   |
| 1984-10-17 | Encounter for 'check-up'           | 0       | 0       | Anemia (disorder)                                                            | 1666   |
| 1984-10-17 | Encounter for problem              | 0       | 0       |                                                                              | 1670   |
| 1977-07-27 | Encounter for check up (procedure) | 0       | 0       | Prediabetes                                                                  | 1656   |
| 1969-01-01 | Encounter for check up (procedure) | 0       | 0       | Smokes tobacco daily                                                         | 1652   |
| 1965-12-29 | Encounter for check up (procedure) | 0       | 0       |                                                                              | 1646   |

## What the record is made of

|        Resource        | Rows |  Class   |
|------------------------|-----:|----------|
| observation            | 365  | clinical |
| claim                  | 44   | billing  |
| diagnostic_report      | 33   | clinical |
| encounter              | 32   | clinical |
| explanation_of_benefit | 32   | billing  |
| medication_request     | 12   | clinical |
| immunization           | 11   | clinical |
| procedure              | 11   | clinical |
| condition              | 9    | clinical |
| care_plan              | 5    | not read |
| goal                   | 5    | not read |
| allergy_intolerance    | 0    | clinical |


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
