# Record-at-a-glance report

_Report for patient 1643, generated from `fhir_sample.duckdb`._

473 events across forty years, and 77 per cent of them are observations: 365 rows of measurements that collapse to 43 distinct things measured. Billing accounts for a further 76 rows, which is the largest part of the record no clinician reads. The year-by-year count shows the shape of the care — a steady 45 to 59 events a year through the late 1990s and 2000s, against far fewer in the earliest decades — and it ends at three events in 2005, the year he died. Among the measurements, three are worth attention: PSA rose from 0.72 to 5.14, creatinine fell from 3.11 to 1.03, and HbA1c sits at 6.36 and rising.

---

## Patient

| Patient | Sex  | Age |    Born    |    Died    | First seen | Last seen  | Events |
|---------|------|----:|------------|------------|------------|------------|-------:|
| Pulido  | male | 71  | 1934-10-17 | 2005-05-23 | 1965-12-29 | 2005-05-25 | 473    |

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
| care_plan              | 5    | clinical |
| goal                   | 5    | clinical |

## Activity by year

| Year | Events |
|-----:|-------:|
| 1965 | 2      |
| 1969 | 2      |
| 1977 | 2      |
| 1984 | 4      |
| 1995 | 1      |
| 1996 | 53     |
| 1997 | 57     |
| 1998 | 45     |
| 1999 | 52     |
| 2000 | 48     |
| 2001 | 52     |
| 2002 | 59     |
| 2003 | 46     |
| 2004 | 47     |
| 2005 | 3      |

## Measurements that matter

|  Code   |                      Measurement                      | Latest | Unit  | Previous |       Change        |  Why it matters  |
|---------|-------------------------------------------------------|-------:|-------|---------:|---------------------|------------------|
| 38483-4 | Creatinine                                            | 1.03   | mg/dL | 3.11     | falling from 3.11   | kidney           |
| 39156-5 | Body Mass Index                                       | 27.37  | kg/m2 | 27.37    | steady              | weight           |
| 4548-4  | Hemoglobin A1c/Hemoglobin.total in Blood              | 6.36   | %     | 6.11     | rising from 6.11    | diabetes control |
| 18262-6 | Low Density Lipoprotein Cholesterol                   | 107.75 | mg/dL | 110.72   | falling from 110.72 | cholesterol      |
| 2085-9  | High Density Lipoprotein Cholesterol                  | 70.75  | mg/dL | 53.14    | rising from 53.14   | cholesterol      |
| 2093-3  | Total Cholesterol                                     | 183.29 | mg/dL | 181.21   | rising from 181.21  | cholesterol      |
| 2857-1  | Prostate specific Ag [Mass/volume] in Serum or Plasma | 5.14   | ng/mL | 0.72     | rising from 0.72    | prostate         |


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
