# Report options

| Date | Author | Source |
|---|---|---|
| 2026-09-24 | aire__john | `fhir_sample.duckdb`, patient 1643 — 473 events, 1965-12-29 to 2005-05-25 |
| 2026-09-24 | aire__ian | the same database rebuilt over seven patients; D₃ (87788) and D₄ (12069) added |

Step 3 of the plan: **a report for one patient that synthesises several FHIR resource types into
a readable narrative or a structured overview.** Four options, each a finished markdown report.

| Option | The report | Led by | Panels |
|---|---|---|---|
| **A** | [`A__visit_led/report.md`](A__visit_led/report.md) | the shape of the care | patient · visits · what happened at each visit · measurements (43 rows) |
| **B** | [`B__problem_led/report.md`](B__problem_led/report.md) | what was wrong, and for how long | patient · problems · prescriptions · measurements (43 rows) |
| **C** | [`C__record_at_a_glance/report.md`](C__record_at_a_glance/report.md) | what the record is made of | patient · record mix · activity by year · measurements that matter (7 rows) |
| **D** | [`D__synthesis/report.md`](D__synthesis/report.md) | **what was wrong, for how long, and where it is going** | patient · problems · prescriptions · measurements that matter · allergies · visits · record mix |
| **D₂** | [`D__synthesis_02/report.md`](D__synthesis_02/report.md) | the same, for a different patient | identical seven panels |
| **D₃** | [`D__synthesis_03/report.md`](D__synthesis_03/report.md) | the same, for the thinnest record here | identical seven panels |
| **D₄** | [`D__synthesis_04/report.md`](D__synthesis_04/report.md) | the same, for a child | identical seven panels |

**D and D₂ are the same six panels over two patients**, which is what makes them worth having as
a pair: patient 1643 died in 2005 with prostate cancer, patient 1390 is living with cardiac and
cerebrovascular disease, and both reports come out in the same seven sections — 136 and 140 lines.
A layout that only works for one patient is a layout that has not been tested.

| | 1643 (Pulido) | 1390 (Portillo) |
|---|---|---|
| Age | 71, died 2005-05-23 | 83, living |
| Active problems | 6 | 7 |
| Reading the prescriptions panel | one drug **re-ordered every 365 days** | five drugs **ordered once and still active** 25 years later |
| The narrative turns on | prostate cancer and its metastasis | a cardiac arrest, then AF and stroke, then two osteoporotic fractures, then Alzheimer's in 2018 |

That second row is the useful contrast: the same panel surfaces *renewal* in one patient and
*continuation* in the other, because the `Course` and `Gap (days)` columns describe the course
rather than counting it. A `count(*)` would have shown 12 and 11 and said nothing.

### D₃ and D₄ — two shapes picked to break the panels

D₂ is a second patient of the *same* shape: an old man with a long problem list. D₃ and D₄ were
chosen by shape instead, to attack what the first two could not reach.

| | 87788 (Abbott) | 12069 (Welch) |
|---|---|---|
| The shape | 81 clinical events — the thinnest record here | born 2013, 186 events, mostly well-child care |
| Picked to test | panels with almost nothing to show | the first female patient here, and wording for a child |
| Problems | 1 active — hypertension, ongoing 8 years | 0 active; both recorded problems resolved |
| Measurements | 3 of the 9 taken | 3 of the 9 taken, all of them a child's |
| The narrative turns on | one chronic problem treated and never stopped | 8 allergies recorded at one encounter, and the reaction five years later |

**What it found.** The panels held. `not measured` appears six times in each, and the conditional
footer on the prescriptions panel fired for D₄ and correctly stayed silent for D₃ — where a drug
really is re-ordered, 724 days later. `Age` needed no change to describe a child, because it was
never a claim about adulthood. But neither record is current, and the only thing in the report
saying so is the strip's `As of`, so both narratives state it outright: a reader who takes `Age`
for the age today is wrong by years, and for a paediatric record that is the difference between a
child and a teenager.

**And what it did not find, because the panel was not there.** 12069 was picked to exercise the
allergy path, and the report had no allergy panel — so the 8 allergies that made it worth choosing
were the one thing it could not show, and its narrative could only infer them from a steroid, an
antihistamine and an auto-injector. `05_allergies` now closes that. The lesson is not that the
patient was chosen badly: it is that **a case picked to test a path proves nothing unless the path
is in the report**, and neither check script can see a panel that was never written.

**D is the recommendation**, and it is A, B and C's good parts and none of their weak ones: B's
problems and prescriptions panels, C's *measurements that matter* panel, and no 43-row table.

## How a report is built

A report is a **set of tables**, not one query. Each folder holds one `.sql` per panel, and the
`.txt` beside it is that query's output — so every table in every report can be recreated rather
than trusted:

```sh
cd _docs/fhir_sample_data
duckdb fhir_sample.duckdb < options_report/D__synthesis/02_problems.sql
sh options_report/build_reports.sh          # reassembles every report.md
sh options_report/check_panels.sh           # 3 runs per panel, all must agree
python3 options_report/check_narratives.py  # does each narrative match its own tables
```

`check_panels.sh` resolves the database path itself. That is deliberate: run with the wrong path,
DuckDB silently creates an *empty* database there, every query fails with "table not found", and
the differing errors report every panel as unstable — a false alarm indistinguishable from a real
ordering bug.

The panels use DuckDB's `.mode markdown`, so the tables in the reports are the query output
verbatim. To add a patient: **copy a folder, change the one `SET VARIABLE pid` line in each
panel, and rewrite `narrative.md`** — `build_reports.sh` reads the narrative from the folder and
the patient id from the panels, so nothing else needs editing. `D__synthesis_02`, `_03` and `_04`
were made that way — for `_03` and `_04` the whole change was one `SET VARIABLE pid` line per
panel plus a new `narrative.md`, which is the point of the design.

**The narrative at the top of each report is written by hand from the tables below it.** The
tables are generated; the prose is not. That split is deliberate and it is the honest one at this
stage: a claim in a table can be checked by re-running its query, and a claim in a sentence
cannot. `check_narratives.py` narrows the gap — it asserts that every number in a narrative
appears somewhere in that report's tables, which is the same guard the application applies to a
model's prose, turned on prose a person wrote. Generating the narrative from the tables is a
separate step; the earlier work in this repo showed both that a model can do it well and how
easily it invents when the inputs are poor.

## Reproducibility, and what the check found

Every panel is verified stable — three consecutive runs and the saved `.txt` all agree, for all
forty. That check found three real defects: a visit list and a record-mix table whose row order
varied between runs because the `ORDER BY` had no tiebreaker, and a `string_agg(DISTINCT …)` whose
concatenation order was undefined. A report that claims to be reproducible and is not is worse
than one that admits it is a snapshot, so the ordering is total everywhere: every sort has a
tiebreaker and every aggregate an inner `ORDER BY`.

**The checks did not find the fourth defect, and could not have.** No panel read
`allergy_intolerance` — a populated table, 9 rows in this sample. So the record mix's claim to
show what the record *holds* was wrong, and the report cited the application's `Allergies (0)`
tab as its model while having no panel to match it. `check_panels.sh` proves a panel is *stable*,
not that it is *complete*, and `check_narratives.py` only tests a narrative against tables that
exist. Breadth is not a property either tool can see. The gap surfaced by picking a patient
*because* of its allergies — 12069, whose 8 recorded allergies the report did not show — and then
noticing that the panel it was supposed to exercise did not exist. `05_allergies` is that panel.

---

## D — synthesised (the recommendation)

Seven panels, and every row in every table carries a **`Source`** — the resource id the row came
from, so a claim can be traced back past the report to the record. That is the same posture as
the `.sql` beside each panel: nothing here has to be taken on trust.

| Panel | Taken from | Provenance | What changed |
|---|---|---|---|
| `01_patient` | A/B/C | `patient.id` | `Age`/`As of` derive from the record's last event; `Events` renamed **`Clinical events`** |
| `02_problems` | B | `condition.id` | duration uses the same derived date |
| `03_medications` | B | `medication_request.id` | sort gained an id tiebreaker |
| `04_key_measures` | C | the observation behind `Latest` **and** behind `Previous` | `Previous` had no provenance; it now has `Source (prev)` |
| `05_allergies` | — | `allergy_intolerance.id` | new, and the only panel added after the six were frozen; **omits `category`** — see below |
| `06_visits` | A | `encounter.id` | new here; the within-day tiebreaker is now stated in the query |
| `07_record_mix` | C | — | new here, **no `Source`**: an aggregate has no single row behind it, and naming the table only repeated the first column |

**Two quantities that look like a contradiction and are not.** The patient strip counts **473
clinical events** across the eight clinical types; the record mix sums to **559** because it
counts every table, billing included. Both were right and the pair read as a disagreement, which
is the report's fault rather than the data's — so the strip's column is now named for what it
counts, and the record mix says what it adds. The two are now kept in step *by construction*: the
record mix's `clinical` class is defined as exactly the types the strip's event CTE lists, so
adding a type to one and not the other puts them out of step by that type's row count — for
patient 12069, 8. Both were changed together when `05_allergies` was added.

**The report order is the reading order**: Patient · Problems · Prescriptions · Measurements that
matter · Allergies · Visits · Record mix. What is wrong with the patient, how long it has been
wrong, what is being done, where the numbers are going, **what they react to**, then the care
history, then the shape of the record.

**`Allergies` was first written as `07` and moved to `05`, and the move is the point.** Appending
it was the cheap way to add it and the wrong one: it put the report's only safety-critical panel
below `Record mix`, which this document elsewhere calls context the narrative does not introduce,
so the report ended on the least clinical table it has. The order above is the reason the panel is
numbered `05` — the numbers follow the reading order, they do not merely identify files. Renaming
`05`–`07` in four folders is mechanical; leaving a safety panel last because moving it was
inconvenient is not a trade worth making.

**`category` is in the table and not in the report.** `allergy_intolerance.category` reads `food`
on all nine rows in this sample — including `Allergy to grass pollen`, `House dust mite allergy`
and `Dander (animal) allergy`. A `Category` column would state something the record does not
support, which is the failure this report exists to avoid, so the panel omits it and says so in
the query. The same table's `reaction_count` is 0 on every row and `allergy_reaction` is empty
sample-wide, so no column claims a severity either — `Criticality` is the risk the allergy poses,
not how bad an episode was, which is the distinction the domain model draws.

**One deviation from the brief, and I think it is the stronger reading.** It asked for
`SET VARIABLE as_of` in place of the hardcoded dates. That does remove the literal, but the value
is still patient-specific — it would sit in five panels and be wrong for the next patient, which
is exactly what the "nothing patient-specific outside the pid line" constraint forbids. So
`as_of` is **derived** from the record's last dated event instead: no constant to maintain, and
the panels stay patient-independent. A caller who wants a different reference point can still
pass one.

**For.** 142 lines, seven panels, and it leads with the patient rather than the record. Its
narrative synthesises the first three panels — problems and their durations, the prescription
pattern, where the measurements are going — which is what the requirement asks for.

**Against.** It inherits B's weakest link: nothing connects a prescription to the problem it
treats, so the medication panel floats free of the problem list. *Measurements that matter*
contains a **judgement** — which nine codes count is clinic policy, not data, and my choice of
nine is a guess sitting in a `VALUES` clause. And at seven panels it is no longer the *shortest*
report, which was its original selling point; `Visits` and `Record mix` are context, and the
narrative does not introduce them.

## What the others give up

**A** is the structure the data was shaped for — every row carries an `encounter_id`, so the join
is exact — but its 76-row drill-down makes it a report about care rather than about a patient.
Keep it for an auditor or a care co-ordinator, not a clinician.

**B** is where D's core comes from. On its own it carries a 43-row measurements table, which is a
table wearing a panel's clothes: equal weight, two pages, nothing a person reads.

**C** shows *shape* rather than content — 59 events in 2002 against three in 2005 says something
about a life that no list does — and its measurements panel is the most clinically pointed thing
here: **PSA rising from 0.72 to 5.14**, creatinine falling from 3.11 to 1.03. But record mix and
activity-by-year are orientation. As panels inside a report they earn their place; as the report
they are a table of contents.

## What none of them do

- **No interpretation in the tables.** None says *"the prostate cancer metastasised"* — only the
  hand-written narrative does. The tables present; they do not conclude.
- **No normal ranges.** `rising` and `falling` are described, not judged, because this dataset
  carries no reference range — 0 of 365 observations have one. Judging means a local table of
  targets, which is clinic policy rather than data.
- **No treatment-to-problem link.** The rule the data does not supply, and the one gap D
  inherits from B.
- **One patient.** `v_record_mix` is the start of the cross-patient direction; nothing here uses
  it.
- **No allergies, still, in A, B or C.** D gained `05_allergies` and counts the table in its
  record mix; the three earlier options do not. A and B read no allergy data at all, and C has a
  record mix of its own that omits `allergy_intolerance` — so C's list of what the record holds is
  wrong in the same way D's was, and has not been fixed.
