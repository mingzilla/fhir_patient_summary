# Dashboard API contract

The wire the dashboard UI is built against. Seven endpoints, one per panel, each returning
the rows of one verified SQL as a JSON array.

This is a mirror of `data_analysis/stage_05__text_report_refine/D__synthesis_01/report.md`:
every table in that report is one endpoint here, with the same columns and the same order.
Two endpoints are named after their panel file rather than their report heading -
`medications` is the report's **Prescriptions**, and `key_measures` is its **Measurements
that matter**.

## Running it

```sh
uv run uvicorn src.main:app --reload --port 8021
```

Reads `db_data/fhir_sample.duckdb` **read-only**. Seven patients are
in it: `1`, `181`, `821`, `1390`, `1643`, `12069`, `87788`.

**There is no authentication.** Every endpoint here is open, and
`docker-compose-mingzilla.yml` is the public Cloudflare stack, so a deployment puts the whole
record behind nothing but the hostname. That is a deliberate decision for this prototype, taken
on the grounds that the data is Synthea's synthetic sample and no model is called - there is
nothing real to leak and nothing expensive to abuse. **Do not point this at a real record
without putting a gate in front of it.** The gate the previous build had is in `_previous/`.

## The shape of every response

A **bare JSON array** of row objects. No envelope, no pagination, no wrapper - the array is
exactly what the panel prints, so it can be plotted as it arrives.

```json
GET /dashboard/1643/record_mix
[{"Resource": "observation", "Rows": 365, "Class": "clinical"}, ...]
```

| | |
|---|---|
| **Keys are the report's column headings**, verbatim | `"Gap (days)"`, `"Source (prev)"`, `"Why it matters"`, `"Clinical events"` all contain a space, and two contain a `/` or `()`. Index with `row["Gap (days)"]`, never `row.gap_days` |
| **Dates are strings** | `"YYYY-MM-DD"`. Not epoch numbers |
| **Numbers are JSON numbers** | `Latest`, `Age`, `Rows` and friends arrive unquoted |
| **Missing values are `null`**, not `""` | except the string columns the panels coalesce to `""` on purpose (`Unit`, `Pair`, `New problem`) |
| **Zero rows is `200 []`** | not a 404. `Allergies (0)` is a finding, and the UI should say *none known* - which is a different statement from *not checked* |
| **Unknown patient is `404`** | `{"detail": "no patient '999999' in this record"}`. A non-numeric id is also 404, not a 422 |

`GET /healthz` returns `{"status": "ok"}`.

## The seven endpoints

Every example below is patient `1643`, real output.

| # | Endpoint | Panel SQL | Rows |
|---|---|---|---|
| 1 | `/dashboard/{patient_id}/patient` | `01_patient.sql` | always exactly **1** |
| 2 | `/dashboard/{patient_id}/problems` | `02_problems.sql` | 0..n, ongoing first then newest onset |
| 3 | `/dashboard/{patient_id}/medications` | `03_medications.sql` | 0..n, newest order first |
| 4 | `/dashboard/{patient_id}/key_measures` | `04_key_measures.sql` | always exactly **9** |
| 5 | `/dashboard/{patient_id}/allergies` | `05_allergies.sql` | 0..n, newest recorded first |
| 6 | `/dashboard/{patient_id}/visits` | `06_visits.sql` | 0..n, newest first |
| 7 | `/dashboard/{patient_id}/record_mix` | `07_record_mix.sql` | always exactly **12** |

### 1. `patient` - the header strip

One row. A scalar strip, **not a chart**.

```json
{"Patient": "Pulido", "Sex": "male", "Age": 71, "Born": "1934-10-17", "Died": "2005-05-23",
 "First seen": "1965-12-29", "As of": "2005-05-25", "Clinical events": 473, "Source": "1643"}
```

| Field | Type | Null | Meaning |
|---|---|---|---|
| `Patient` | string | no | family name |
| `Sex` | string | no | `male` / `female` |
| `Age` | number | no | years at death, or at `As of` when living |
| `Born` | date | no | |
| `Died` | string | no | the literal `"living"`, else a date. **A string either way** - test for `"living"`, do not test for null |
| `First seen` | date | no | earliest dated event in the record |
| `As of` | date | no | latest dated event. Derived, never written down |
| `Clinical events` | number | no | count over the eight clinical types only |
| `Source` | string | no | the patient id, as a string |

`Clinical events` is **not** the record total - it excludes billing and unread tables. See
invariant 1 below for the total.

### 2. `problems` - the problem list

```json
{"Onset": "2001-05-24", "Status": "ACTIVE", "Problem": "Neoplasm of prostate", "Years": 4,
 "Outcome": "ongoing", "Source": "2021", "Pair": "Metastasis from malignant tumor of prostate (disorder)"}
```

| Field | Type | Null | Meaning |
|---|---|---|---|
| `Onset` | date | no | |
| `Status` | string | no | upper-cased: `ACTIVE` / `RESOLVED` |
| `Problem` | string | no | the condition's display name |
| `Years` | number | no | duration to resolution, or to `As of` when ongoing |
| `Outcome` | string | no | `ongoing`, or `resolved YYYY-MM-DD` |
| `Source` | string | no | condition id |
| `Pair` | string | no | the other problem recorded the **same day**, else `""` |

`Pair` reports **co-recording, not cause and consequence**. Of the five same-day pairs in this
sample, two are a cause and its consequence and three are one condition written twice. Do not
draw it as an arrow or a graph edge.

Sorted `Outcome` ongoing-first, then `Onset` descending.

### 3. `medications` - prescriptions as courses

```json
{"Ordered": "2004-05-20", "Medication": "Simvistatin 10 MG", "Status": "active",
 "Gap (days)": 365, "Course": "re-order", "Source": "2170"}
```

| Field | Type | Null | Meaning |
|---|---|---|---|
| `Ordered` | date | no | |
| `Medication` | string | no | the drug, as ordered |
| `Status` | string | no | **lower-case**, raw: `active` / `stopped` / `completed` |
| `Gap (days)` | number | **yes** | days since the previous order of the *same* drug. `null` on a first order |
| `Course` | string | no | `first` / `re-order` |
| `Source` | string | no | medication_request id |

The panel prints a footer sentence when no drug repeats: *"No renewal pattern: every order is
a first."* It is **not served**, because it is a second result block and would make the JSON
parse for some patients and not others. Derive it instead - it is true exactly when every
`Course` is `first`. Patient `12069` is the case that triggers it.

### 4. `key_measures` - the measurements that matter

Always nine rows. Codes the record does not carry still get a row.

```json
{"Code": "38483-4", "Measurement": "Creatinine", "Latest": 1.03, "Unit": "mg/dL",
 "Previous": 3.11, "Change": "falling from 3.11", "Why it matters": "kidney",
 "Source": "2184", "Source (prev)": "2152"}
```

| Field | Type | Null | Meaning |
|---|---|---|---|
| `Code` | string | no | LOINC code. The row key |
| `Measurement` | string | no | display name, or the literal `"(not in this record)"` |
| `Latest` | number | **yes** | `null` when never measured |
| `Unit` | string | no | `""` when the record carries none |
| `Previous` | number | **yes** | the reading before `Latest` |
| `Change` | string | no | see below |
| `Why it matters` | string | no | `weight`, `blood pressure`, `kidney`, `cholesterol`, `diabetes control`, `prostate` |
| `Source` | string | **yes** | observation id behind `Latest` |
| `Source (prev)` | string | **yes** | observation id behind `Previous` |

`Change` is a **sentence, not a number** - no chart can plot it, which is why `Latest` and
`Previous` are here too. Five values:

| `Change` | When |
|---|---|
| `"not measured"` | `Latest` is `null` |
| `""` | measured once, so there is nothing to compare |
| `"rising from 23.54"` | `Latest` > `Previous` |
| `"falling from 3.11"` | `Latest` < `Previous` |
| `"steady"` | equal |

Plot `Latest`/`Previous`; print `Change` as text beside the sparkline. A `"not measured"` row
is information about the record - *no PSA was ever taken* - not a gap in the data. The panel
keeps nine rows so its size does not change with the patient.

### 5. `allergies` - the only safety resource

```json
{"Recorded": "2014-03-15", "Allergen": "Allergy to mould", "Criticality": "low",
 "Status": "ACTIVE", "Source": "12170"}
```

| Field | Type | Null | Meaning |
|---|---|---|---|
| `Recorded` | date | no | |
| `Allergen` | string | no | |
| `Criticality` | string | no | `low` / `high` / `unable-to-assess` |
| `Status` | string | no | upper-cased |
| `Source` | string | no | allergy_intolerance id |

**Six of the seven patients return `[]`.** That is the point of the endpoint. `Clinical
events`-style counts aside, this is the one tab where an empty array is unambiguously *none
known* rather than *not checked*, and the UI should say so in words.

`Criticality` is the risk the allergy poses, **not** how bad a reaction was. The record's
`reaction[]` is empty for every patient in this sample, so no field here claims a severity.
There is deliberately no `category` field either: it reads `food` on all nine allergy rows in
the sample, including grass pollen and house dust mite.

### 6. `visits` - the encounter list

```json
{"Date": "2005-05-25", "Visit": "Death Certification", "Results": 1, "Reports": 1,
 "New problem": "", "Source": "2200"}
```

| Field | Type | Null | Meaning |
|---|---|---|---|
| `Date` | date | no | encounter start |
| `Visit` | string | no | encounter type, falling back to its class code |
| `Results` | number | no | observations recorded at this encounter |
| `Reports` | number | no | diagnostic reports at this encounter |
| `New problem` | string | no | conditions recorded at this encounter, `"; "`-joined, `""` if none |
| `Source` | string | no | encounter id |

Sorted date descending, id ascending. **Within one day the order is arbitrary in clinical
terms** - it is insertion order. Do not label it as a sequence.

### 7. `record_mix` - what the record is made of

Always twelve rows. A table, or a stacked bar by `Class`.

```json
{"Resource": "observation", "Rows": 365, "Class": "clinical"}
```

| Field | Type | Null | Meaning |
|---|---|---|---|
| `Resource` | string | no | the table name |
| `Rows` | number | no | rows this patient has in it |
| `Class` | string | no | `clinical` / `billing` / `not read` |

Sorted `Rows` descending. There is deliberately **no `Source`** - an aggregate over a whole
table has no single row behind it. No row is filtered on its count: a type with no rows is a
fact about the record, and dropping it would change the panel's shape per patient.

`Class` is three values and not two. `clinical` is exactly the eight types the report reads;
`billing` and `not read` are rows the record holds that no part of this pipeline fetches.
Showing them is the point - it is what the boundary filters out.

## The search endpoint

```
GET /search?q=smi
[{"id":"1067","name":"Adolph Smith","birth_date":"1943-01-27","gender":"male"},
 {"id":"108457","name":"Jesus Smitham","birth_date":"1951-03-11","gender":"male"}]
```

A bare array of candidates, like every other endpoint. Real output above.

**This is the one endpoint that does not read the database.** It asks the FHIR server, because
the database holds only the patients already loaded into it, and a search has to be able to name
a patient who is not in it yet - that is what makes them addable. So the candidates and the
roster are two different answers from two different places, and the client intersects them.

| | |
|---|---|
| **First page only** | At most 20. `next` is deliberately never followed: a name search answers the query or says *narrow it*, and paging it would walk a roster rather than a name |
| **`[]` means nobody matched** | Not that the search failed. Nothing matched, or the query was under three characters - the server will not ask a question it would not cache |
| **`503` means the search did not run** | `{"detail": "search is unavailable"}`. The FHIR server could not be reached or did not answer with a Bundle. An empty list never has to mean both, which is the whole reason the failure is named |
| **A malformed search is a `503`, not a `200 []`** | HAPI answers an invalid search with HTTP 200 and an `OperationOutcome`. Read as a Bundle it would look like *nobody matched* |
| **`id` joins to the roster's `Source`, not to `Patient`** | Roster row `{"Patient":"Koepp", ..., "Source":"1"}`; candidate `{"id":"1","name":"Abdul Koepp"}`. `Patient` is the **surname**, so joining there compares a name against an id - it matches nothing, or matches the wrong person, and either way it looks like a working search. Both sides are strings |
| **The name columns are not the same string** | A candidate's `name` is `Given Family`; the roster's `Patient` is the family name alone. Same person, two shapes - a search hit and a drawn header - so render each with the component for its own shape |

### Why search is cached

**Search is the only endpoint that leaves this system.** The panels read the local database; this
one asks a FHIR server that is slower, is not ours, and need not answer.

| | |
|---|---|
| **Protects the server** | a clinician narrowing a spelling sends `smi`, then `smit`, then `smith` - three requests to a server we do not own, none of them a query anyone refined |
| **Answers faster** | measured: a cold `smi` is 829 ms and one FHIR request; the repeat is 11 ms and **no request at all** |
| **Held for** | 15 minutes, keyed by the query, so a refinement costs one call and then nothing |
| **If Redis is down** | search still answers from the server and the miss is logged. What is lost is the two rows above, not the feature |

## Invariants the UI can rely on

1. **`patient["Clinical events"]` equals the sum of `Rows` where `Class == "clinical"`** in
   `record_mix`. Verified on all seven patients. This is the one number that appears in two
   endpoints, and it is the same number.
2. **`record_mix` always has 12 rows and `key_measures` always 9**, whatever the patient.
   `patient` always has 1. A UI that sizes a container off the row count is safe for these
   three and only these three.
3. **Every other panel's row count varies with the patient** - `allergies` from 0 to 8,
   `visits` from 11 to 32, `problems` from 2 to 13.
4. **`Source` values are ids into the FHIR record**, as strings. They are traceable but not
   resolvable through this API.

## Where the SQL lives

The eight scripts are served from `src/sql/`, read and executed **at request time** - not copied
into Python. `SET VARIABLE pid = 1643` is the only patient-specific byte; it becomes a bound
parameter, so one set of scripts serves every patient.

| | |
|---|---|
| **Served from** | `src/sql/`, so the image needs `src/` and not `data_analysis/` |
| **Verified against** | the same panels in `stage_05__text_report_refine/`, compared by `tests/test__panel_sql.py` |
| **Equality, not identity** | two copies, so a test holds them together. One shared file would make drift impossible; it also made the app stop answering whenever the analysis was renumbered |
| **Checked** | all seven panels against patients `1643`, `12069`, `87788`: 21 comparisons of the endpoint's JSON against the panel's `.mode json`, all equal |

`D__synthesis_02`, `_03` and `_04` hold the same scripts for other patients, byte-identical
apart from the pid line. `_01` is the set that was copied.
