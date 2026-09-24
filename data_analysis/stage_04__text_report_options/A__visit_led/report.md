# Visit-led report

_Report for patient 1643, generated from `fhir_sample.duckdb`._

A man who died in May 2005, with forty years of care in the record and a clear rhythm to it. From 1996 the pattern is annual: a follow-up visit where simvastatin is re-ordered, a metabolic and lipid panel drawn, and from 2001 a prostate examination alongside it. The two prostate findings appear together on 2001-05-24 — neoplasm and metastasis, recorded the same day as the biopsy — and the death certificate four years later gives the cause as prostate cancer. Between those annual visits the record holds only minor, self-limited illness: two episodes of pharyngitis and one of sinusitis, each resolving within a fortnight.

---

## Patient

| Patient | Sex  | Age |    Born    |    Died    | First seen | Last seen  | Events |
|---------|------|----:|------------|------------|------------|------------|-------:|
| Pulido  | male | 71  | 1934-10-17 | 2005-05-23 | 1965-12-29 | 2005-05-25 | 473    |

## Visits

|    Date    |               Visit                | Results | Reports |                                 New problem                                  |
|------------|------------------------------------|--------:|--------:|------------------------------------------------------------------------------|
| 2005-05-25 | Death Certification                | 1       | 1       |                                                                              |
| 2004-10-12 | Encounter for 'check-up'           | 0       | 0       |                                                                              |
| 2004-06-16 | Encounter for check up (procedure) | 15      | 1       |                                                                              |
| 2004-05-20 | Follow-up encounter                | 20      | 2       |                                                                              |
| 2004-02-10 | Encounter for symptom              | 1       | 0       | Acute viral pharyngitis (disorder)                                           |
| 2003-06-11 | Encounter for check up (procedure) | 15      | 1       |                                                                              |
| 2003-05-21 | Follow-up encounter                | 20      | 2       |                                                                              |
| 2003-04-05 | Encounter for symptom              | 1       | 0       | Acute viral pharyngitis (disorder)                                           |
| 2002-06-05 | Encounter for check up (procedure) | 30      | 3       |                                                                              |
| 2002-05-21 | Follow-up encounter                | 20      | 2       |                                                                              |
| 2001-05-30 | Encounter for check up (procedure) | 16      | 1       |                                                                              |
| 2001-05-24 | Encounter for symptom              | 1       | 0       |                                                                              |
| 2001-05-24 | Encounter for problem              | 1       | 0       | Metastasis from malignant tumor of prostate (disorder); Neoplasm of prostate |
| 2001-05-21 | Follow-up encounter                | 20      | 2       |                                                                              |
| 2000-06-05 | Encounter for symptom              | 0       | 0       | Viral sinusitis (disorder)                                                   |
| 2000-05-24 | Encounter for check up (procedure) | 14      | 1       |                                                                              |
| 2000-05-21 | Follow-up encounter                | 23      | 2       |                                                                              |
| 1999-10-14 | Encounter for 'check-up'           | 0       | 0       |                                                                              |
| 1999-05-22 | Follow-up encounter                | 20      | 2       |                                                                              |
| 1999-05-19 | Encounter for check up (procedure) | 21      | 2       |                                                                              |
| 1998-05-22 | Follow-up encounter                | 20      | 2       |                                                                              |
| 1998-05-13 | Encounter for check up (procedure) | 17      | 1       |                                                                              |
| 1997-05-22 | Follow-up encounter                | 20      | 2       |                                                                              |
| 1997-05-07 | Encounter for check up (procedure) | 28      | 2       |                                                                              |
| 1996-05-22 | Follow-up encounter                | 0       | 0       |                                                                              |
| 1996-05-01 | Encounter for check up (procedure) | 41      | 4       | Hyperlipidemia                                                               |
| 1995-04-15 | Encounter for symptom              | 0       | 0       |                                                                              |
| 1984-10-17 | Encounter for 'check-up'           | 0       | 0       | Anemia (disorder)                                                            |
| 1984-10-17 | Encounter for problem              | 0       | 0       |                                                                              |
| 1977-07-27 | Encounter for check up (procedure) | 0       | 0       | Prediabetes                                                                  |
| 1969-01-01 | Encounter for check up (procedure) | 0       | 0       | Smokes tobacco daily                                                         |
| 1965-12-29 | Encounter for check up (procedure) | 0       | 0       |                                                                              |

## What happened at each visit

|    Date    |               Visit                |     Kind     |                               What                               |
|------------|------------------------------------|--------------|------------------------------------------------------------------|
| 2005-05-25 | Death Certification                | report       | U.S. standard certificate of death - 2003 revision               |
| 2004-10-12 | Encounter for 'check-up'           | procedure    | Colonoscopy                                                      |
| 2004-06-16 | Encounter for check up (procedure) | immunisation | Influenza, seasonal, injectable, preservative free               |
| 2004-06-16 | Encounter for check up (procedure) | report       | Basic Metabolic Panel                                            |
| 2004-05-20 | Follow-up encounter                | prescription | Simvistatin 10 MG (active)                                       |
| 2004-05-20 | Follow-up encounter                | report       | Comprehensive metabolic 2000 panel - Serum or Plasma             |
| 2004-05-20 | Follow-up encounter                | report       | Lipid Panel                                                      |
| 2004-02-10 | Encounter for symptom              | problem      | Acute viral pharyngitis (disorder) (resolved)                    |
| 2003-06-11 | Encounter for check up (procedure) | immunisation | Influenza, seasonal, injectable, preservative free               |
| 2003-06-11 | Encounter for check up (procedure) | procedure    | Documentation of current medications                             |
| 2003-06-11 | Encounter for check up (procedure) | report       | Basic Metabolic Panel                                            |
| 2003-05-21 | Follow-up encounter                | prescription | Simvistatin 10 MG (stopped)                                      |
| 2003-05-21 | Follow-up encounter                | report       | Comprehensive metabolic 2000 panel - Serum or Plasma             |
| 2003-05-21 | Follow-up encounter                | report       | Lipid Panel                                                      |
| 2003-04-05 | Encounter for symptom              | problem      | Acute viral pharyngitis (disorder) (resolved)                    |
| 2002-06-05 | Encounter for check up (procedure) | immunisation | Influenza, seasonal, injectable, preservative free               |
| 2002-06-05 | Encounter for check up (procedure) | report       | Basic Metabolic Panel                                            |
| 2002-06-05 | Encounter for check up (procedure) | report       | Complete blood count (hemogram) panel - Blood by Automated count |
| 2002-06-05 | Encounter for check up (procedure) | report       | Lipid Panel                                                      |
| 2002-05-21 | Follow-up encounter                | prescription | Simvistatin 10 MG (stopped)                                      |
| 2002-05-21 | Follow-up encounter                | report       | Comprehensive metabolic 2000 panel - Serum or Plasma             |
| 2002-05-21 | Follow-up encounter                | report       | Lipid Panel                                                      |
| 2001-05-30 | Encounter for check up (procedure) | immunisation | Influenza, seasonal, injectable, preservative free               |
| 2001-05-30 | Encounter for check up (procedure) | immunisation | pneumococcal polysaccharide vaccine, 23 valent                   |
| 2001-05-30 | Encounter for check up (procedure) | procedure    | Digital examination of rectum                                    |
| 2001-05-30 | Encounter for check up (procedure) | report       | Basic Metabolic Panel                                            |
| 2001-05-24 | Encounter for problem              | problem      | Metastasis from malignant tumor of prostate (disorder) (active)  |
| 2001-05-24 | Encounter for problem              | problem      | Neoplasm of prostate (active)                                    |
| 2001-05-24 | Encounter for symptom              | procedure    | Biopsy of prostate                                               |
| 2001-05-21 | Follow-up encounter                | prescription | Simvistatin 10 MG (stopped)                                      |
| 2001-05-21 | Follow-up encounter                | report       | Comprehensive metabolic 2000 panel - Serum or Plasma             |
| 2001-05-21 | Follow-up encounter                | report       | Lipid Panel                                                      |
| 2000-06-05 | Encounter for symptom              | prescription | Amoxicillin 250 MG / Clavulanate 125 MG Oral Tablet (stopped)    |
| 2000-06-05 | Encounter for symptom              | problem      | Viral sinusitis (disorder) (resolved)                            |
| 2000-05-24 | Encounter for check up (procedure) | immunisation | Influenza, seasonal, injectable, preservative free               |
| 2000-05-24 | Encounter for check up (procedure) | report       | Basic Metabolic Panel                                            |
| 2000-05-21 | Follow-up encounter                | prescription | Simvistatin 10 MG (stopped)                                      |
| 2000-05-21 | Follow-up encounter                | procedure    | Digital examination of rectum                                    |
| 2000-05-21 | Follow-up encounter                | report       | Comprehensive metabolic 2000 panel - Serum or Plasma             |
| 2000-05-21 | Follow-up encounter                | report       | Lipid Panel                                                      |
| 1999-10-14 | Encounter for 'check-up'           | procedure    | Colonoscopy                                                      |
| 1999-05-22 | Follow-up encounter                | prescription | Simvistatin 10 MG (stopped)                                      |
| 1999-05-22 | Follow-up encounter                | report       | Comprehensive metabolic 2000 panel - Serum or Plasma             |
| 1999-05-22 | Follow-up encounter                | report       | Lipid Panel                                                      |
| 1999-05-19 | Encounter for check up (procedure) | immunisation | Influenza, seasonal, injectable, preservative free               |
| 1999-05-19 | Encounter for check up (procedure) | procedure    | Digital examination of rectum                                    |
| 1999-05-19 | Encounter for check up (procedure) | report       | Basic Metabolic Panel                                            |
| 1999-05-19 | Encounter for check up (procedure) | report       | Lipid Panel                                                      |
| 1998-05-22 | Follow-up encounter                | prescription | Simvistatin 10 MG (stopped)                                      |
| 1998-05-22 | Follow-up encounter                | report       | Comprehensive metabolic 2000 panel - Serum or Plasma             |
| 1998-05-22 | Follow-up encounter                | report       | Lipid Panel                                                      |
| 1998-05-13 | Encounter for check up (procedure) | immunisation | Influenza, seasonal, injectable, preservative free               |
| 1998-05-13 | Encounter for check up (procedure) | procedure    | Digital examination of rectum                                    |
| 1998-05-13 | Encounter for check up (procedure) | report       | Basic Metabolic Panel                                            |
| 1997-05-22 | Follow-up encounter                | prescription | Simvistatin 10 MG (stopped)                                      |
| 1997-05-22 | Follow-up encounter                | report       | Comprehensive metabolic 2000 panel - Serum or Plasma             |
| 1997-05-22 | Follow-up encounter                | report       | Lipid Panel                                                      |
| 1997-05-07 | Encounter for check up (procedure) | immunisation | Influenza, seasonal, injectable, preservative free               |
| 1997-05-07 | Encounter for check up (procedure) | procedure    | Digital examination of rectum                                    |
| 1997-05-07 | Encounter for check up (procedure) | report       | Basic Metabolic Panel                                            |
| 1997-05-07 | Encounter for check up (procedure) | report       | Complete blood count (hemogram) panel - Blood by Automated count |
| 1996-05-22 | Follow-up encounter                | prescription | Simvistatin 10 MG (stopped)                                      |
| 1996-05-01 | Encounter for check up (procedure) | immunisation | Influenza, seasonal, injectable, preservative free               |
| 1996-05-01 | Encounter for check up (procedure) | immunisation | Td (adult) preservative free                                     |
| 1996-05-01 | Encounter for check up (procedure) | problem      | Hyperlipidemia (active)                                          |
| 1996-05-01 | Encounter for check up (procedure) | procedure    | Digital examination of rectum                                    |
| 1996-05-01 | Encounter for check up (procedure) | procedure    | Documentation of current medications                             |
| 1996-05-01 | Encounter for check up (procedure) | report       | Basic Metabolic Panel                                            |
| 1996-05-01 | Encounter for check up (procedure) | report       | Comprehensive metabolic 2000 panel - Serum or Plasma             |
| 1996-05-01 | Encounter for check up (procedure) | report       | Lipid Panel                                                      |
| 1996-05-01 | Encounter for check up (procedure) | report       | Lipid Panel                                                      |
| 1984-10-17 | Encounter for problem              | prescription | ferrous sulfate 325 MG Oral Tablet (active)                      |
| 1984-10-17 | Encounter for 'check-up'           | problem      | Anemia (disorder) (active)                                       |
| 1977-07-27 | Encounter for check up (procedure) | problem      | Prediabetes (active)                                             |
| 1969-01-01 | Encounter for check up (procedure) | problem      | Smokes tobacco daily (active)                                    |
| 1965-12-29 | Encounter for check up (procedure) | prescription | 24hr nicotine transdermal patch (active)                         |

## Measurements

|  Code   |                                Measurement                                | Latest |  Unit   | Previous | Readings |   Trend   | Latest at  |
|---------|---------------------------------------------------------------------------|-------:|---------|---------:|---------:|-----------|------------|
| 20565-8 | Carbon Dioxide                                                            | 22.93  | mmol/L  | 24.98    | 18       | falling   | 2004-06-16 |
| 2069-3  | Chloride                                                                  | 106.75 | mmol/L  | 110.52   | 18       | falling   | 2004-06-16 |
| 2339-0  | Glucose                                                                   | 67.55  | mg/dL   | 83.83    | 18       | falling   | 2004-06-16 |
| 29463-7 | Body Weight                                                               | 87.92  | kg      | 87.92    | 9        | unchanged | 2004-06-16 |
| 2947-0  | Sodium                                                                    | 141.05 | mmol/L  | 136.22   | 18       | rising    | 2004-06-16 |
| 38483-4 | Creatinine                                                                | 1.03   | mg/dL   | 3.11     | 18       | falling   | 2004-06-16 |
| 39156-5 | Body Mass Index                                                           | 27.37  | kg/m2   | 27.37    | 9        | unchanged | 2004-06-16 |
| 4548-4  | Hemoglobin A1c/Hemoglobin.total in Blood                                  | 6.36   | %       | 6.11     | 9        | rising    | 2004-06-16 |
| 49765-1 | Calcium                                                                   | 9.32   | mg/dL   | 10.14    | 18       | falling   | 2004-06-16 |
| 6298-4  | Potassium                                                                 | 4.0    | mmol/L  | 3.85     | 18       | rising    | 2004-06-16 |
| 6299-2  | Urea Nitrogen                                                             | 15.41  | mg/dL   | 18.77    | 18       | falling   | 2004-06-16 |
| 72514-3 | Pain severity - 0-10 verbal numeric rating [Score] - Reported             | 0.51   | {score} | 3.84     | 9        | falling   | 2004-06-16 |
| 8302-2  | Body Height                                                               | 179.23 | cm      | 179.23   | 9        | unchanged | 2004-06-16 |
| 10834-0 | Globulin [Mass/volume] in Serum by calculation                            | 2.33   | g/L     | 2.64     | 9        | falling   | 2004-05-20 |
| 1742-6  | Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma   | 34.24  | U/L     | 55.93    | 9        | falling   | 2004-05-20 |
| 1751-7  | Albumin [Mass/volume] in Serum or Plasma                                  | 3.87   | g/dL    | 5.06     | 9        | falling   | 2004-05-20 |
| 18262-6 | Low Density Lipoprotein Cholesterol                                       | 107.75 | mg/dL   | 110.72   | 12       | falling   | 2004-05-20 |
| 1920-8  | Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma | 11.35  | U/L     | 36.95    | 9        | falling   | 2004-05-20 |
| 1975-2  | Bilirubin.total [Mass/volume] in Serum or Plasma                          | 0.67   | mg/dL   | 0.68     | 9        | falling   | 2004-05-20 |
| 2085-9  | High Density Lipoprotein Cholesterol                                      | 70.75  | mg/dL   | 53.14    | 12       | rising    | 2004-05-20 |
| 2093-3  | Total Cholesterol                                                         | 183.29 | mg/dL   | 181.21   | 12       | rising    | 2004-05-20 |
| 2571-8  | Triglycerides                                                             | 129.28 | mg/dL   | 147.4    | 12       | falling   | 2004-05-20 |
| 2885-2  | Protein [Mass/volume] in Serum or Plasma                                  | 77.62  | g/dL    | 73.89    | 9        | rising    | 2004-05-20 |
| 33914-3 | Glomerular filtration rate/1.73 sq M.predicted                            | 82.59  | mL/min  | 72.39    | 9        | rising    | 2004-05-20 |
| 6768-6  | Alkaline phosphatase [Enzymatic activity/volume] in Serum or Plasma       | 74.12  | U/L     | 66.1     | 9        | rising    | 2004-05-20 |
| 8331-1  | Oral temperature                                                          | 37.37  | Cel     | 37.84    | 2        | falling   | 2004-02-10 |
| 21000-5 | Erythrocyte distribution width [Entitic volume] by Automated count        | 42.35  | fL      | 43.5     | 2        | falling   | 2002-06-05 |
| 32207-3 | Platelet distribution width [Entitic volume] in Blood by Automated count  | 200.77 | fL      | 505.4    | 2        | falling   | 2002-06-05 |
| 32623-1 | Platelet mean volume [Entitic volume] in Blood by Automated count         | 9.62   | fL      | 10.52    | 2        | falling   | 2002-06-05 |
| 4544-3  | Hematocrit [Volume Fraction] of Blood by Automated count                  | 44.65  | %       | 49.7     | 2        | falling   | 2002-06-05 |
| 6690-2  | Leukocytes [#/volume] in Blood by Automated count                         | 8.79   | 10*3/uL | 10.05    | 2        | falling   | 2002-06-05 |
| 718-7   | Hemoglobin [Mass/volume] in Blood                                         | 13.68  | g/dL    | 14.54    | 2        | falling   | 2002-06-05 |
| 777-3   | Platelets [#/volume] in Blood by Automated count                          | 230.96 | 10*3/uL | 214.82   | 2        | rising    | 2002-06-05 |
| 785-6   | MCH [Entitic mass] by Automated count                                     | 29.61  | pg      | 27.13    | 2        | rising    | 2002-06-05 |
| 786-4   | MCHC [Mass/volume] by Automated count                                     | 35.23  | g/dL    | 35.79    | 2        | falling   | 2002-06-05 |
| 787-2   | MCV [Entitic volume] by Automated count                                   | 85.58  | fL      | 84.0     | 2        | rising    | 2002-06-05 |
| 789-8   | Erythrocytes [#/volume] in Blood by Automated count                       | 4.3    | 10*6/uL | 4.79     | 2        | falling   | 2002-06-05 |
| 2857-1  | Prostate specific Ag [Mass/volume] in Serum or Plasma                     | 5.14   | ng/mL   | 0.72     | 6        | rising    | 2001-05-24 |


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
