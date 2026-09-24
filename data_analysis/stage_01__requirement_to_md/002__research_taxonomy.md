# Taxonomy — Patient Summary Prototype

Names this project uses. Where each sits in the record's hierarchy. Which are precise FHIR terms, and
which are our own jargon.

## Conventions

| Mark | Meaning |
|---|---|
| `[brackets]` | A word we invented. No FHIR resource by that name |
| `←` | The term the reader is most likely to reach for |
| `grouping` | A resource that holds other resources. Not itself a finding |

## Taxonomy tree

### Part 1 — the record, as FHIR holds it

```text
Patient                             the subject. everything below hangs off one
|
+-- Clinical findings
|   |
|   +-- Condition                   the diagnosis record
|   |   |-- category = problem-list-item    ← a "problem"
|   |   +-- category = encounter-diagnosis  ← a "visit diagnosis"
|   |
|   +-- Observation                 a measurement, or an assertion. category says which kind
|   |   |-- category = laboratory           ← a "lab result"
|   |   |-- category = vital-signs
|   |   |   +-- Blood pressure              ONE Observation, TWO components
|   |   |       |-- component 8480-6         systolic
|   |   |       +-- component 8462-4         diastolic
|   |   |-- category = survey               e.g. smoking status. still an Observation
|   |   |-- category = exam                 a clinician's finding
|   |   +-- category = procedure
|   |
|   +-- DiagnosticReport            grouping, not a finding. result[] points at Observations
|   |
|   +-- AllergyIntolerance          the only safety resource
|       |-- code                    identifies the substance  ← "penicillin"
|       |-- criticality             low | high | unable-to-assess. drives UI emphasis
|       +-- reaction[]
|           |-- manifestation       e.g. rash
|           +-- severity            mild | moderate | severe. NOT criticality
|
+-- Care
|   |-- Encounter                   the context most other resources point at
|   |                               e.g. Condition.encounter, Observation.encounter
|   |-- Procedure
|   |-- Immunization
|   +-- CarePlan
|
+-- Medication
|   |-- MedicationRequest           an order  ← a "prescription"
|   |   |-- intent                  order | plan | proposal
|   |   +-- status                  active | stopped | completed
|   +-- MedicationStatement         what the patient reports taking
|       +-- status                  active | completed | entered-in-error
|
+-- Administrative                  not clinical
    |-- Claim
    +-- ExplanationOfBenefit
```

### Part 2 — our vocabulary, none of which is a FHIR resource

```text
[Summary]                           the artifact a clinician reads
|
+-- [Narrative]                     the sentences the prose model wrote
|                                   NOT Resource.narrative, which is FHIR's XHTML block
+-- [Fact]                          one deterministic value
|   +-- [Fact table]                every fact, printed beside the narrative
+-- [Problem card]                  a Condition and the metrics hanging off it
+-- [Event stream]                  every record entry as a card, newest first

[Fetch]
|
+-- [Record]                        one patient's resources, gathered
|                                   NOT a database row
+-- [Pagination]                    following link[relation=next]
|                                   NOT paging the rendered list. two different things
+-- [Record stamp]                  the newest meta.lastUpdated in the record
+-- [Change probe]                  _lastUpdated=gt{stamp}&_summary=count

[Store]
|
+-- [Summary cache]                 patient_id, record stamp, encrypted summary
+-- [Cache hit]                     the stamp matches and nothing was written since
+-- [Lazy invalidation]             nothing is deleted on a write. the next request notices
```

## Terms against jargon

`Term` is the name this project commits to. `Jargon` is a word to avoid, or to use only with its
qualifier attached.

| Word | Term | Jargon | Why |
|---|---|---|---|
| Patient | X | | the resource, and the subject of everything |
| Condition | X | | the resource name |
| problem | | X | means `Condition` with `category = problem-list-item`. say which |
| diagnosis | | X | no Diagnosis resource exists. a diagnosis is a Condition |
| Observation | X | | the resource name |
| observation | | X | the everyday word, for anything noticed. not the resource |
| category | X | | the server's own division of an Observation. values include laboratory, vital-signs, survey, exam, procedure |
| measured | | X | our invention, not FHIR's. `category` is the server's division and the field to use |
| asserted | | X | same. it also misclassifies: a reported pain score is a vital sign, and an exam finding is neither measured nor reported |
| result | X | | `DiagnosticReport.result`, and the clinical word for a measured value |
| lab | | X | colloquial. say Observation with `category = laboratory` |
| vital sign | X | | `category = vital-signs` |
| Blood pressure | X | | one Observation with two components, never two Observations |
| Encounter | X | | the resource name |
| visit | | X | means Encounter. use the resource name in the data layer |
| grouping | X | | a resource that holds other resources. DiagnosticReport is one |
| MedicationRequest | X | | the resource name |
| prescription | X | | the clinical word for a MedicationRequest with `intent = order` |
| medication | | X | ambiguous: the drug, the order, or the statement. name which |
| AllergyIntolerance | X | | one resource covering both words. do not split them |
| allergy | | X | one of the two `type` values, so it names half the resource |
| criticality | X | | low / high / unable-to-assess. drives the UI emphasis |
| severity | X | | `reaction.severity`: mild / moderate / severe. NOT the same as criticality |
| Event | | X | no Event resource exists. an event is one dated entry, of any type |
| record | | X | means one patient's gathered resources, not a database row |
| Summary | | X | our artifact. name the parts: narrative, facts, problem cards |
| narrative | X | | FHIR's `Resource.narrative`. never use it for the model's sentences |
| prose | | X | our word for the model's sentences. see the collision above |
| fact | | X | our word for a deterministic value. no FHIR equivalent |
| reference range | X | | the laboratory's own interval, supplied by the server when it has one. not a clinical target |
| treatment target | | X | clinical policy, e.g. an HbA1c goal. the server has no element for it |
| threshold | | X | our word for where a target is applied. prefer treatment target |
| interpretation | X | | the FHIR element. HL7 codes for high, low, normal |
| flag | | X | our UI marker. a computed stand-in for `interpretation` |
| coding | X | | the array inside a CodeableConcept |
| code | X | | one entry in that array |
| display | X | | the human text on a code. may be absent |
| bundle | X | | what every search and every read returns |
| next link | X | | `link[relation=next]`. the thing that makes pagination unavoidable |
| pagination | | X | two meanings here: following next links, and paging the UI. always qualify |
| cache | | X | our summary cache, not HTTP caching. the server also sends ETag and Last-Modified |
| stamp | | X | our word. means write time, from `meta.lastUpdated` |
| probe | | X | our word for the change check. prefer change probe |
| admin | | X | the billing resources, `Claim` and `ExplanationOfBenefit`. not clinical |
| billing | | X | same as admin. both appear in `$everything` alongside clinical resources |

## Identifiers

Which words are stable keys, and which only look like them. An identifier is consistent, extractable
and unambiguous. A non-identifier needs explaining every time it is read, so it cannot key anything.

| Is it an identifier | YES | No |
|---|---|---|
| patient id | X | |
| resource id, e.g. `Observation/9911` | X | |
| LOINC code, e.g. `4548-4` | X | |
| SNOMED code | X | |
| `meta.versionId` | X | |
| `meta.lastUpdated` | X | |
| the record stamp | X | |
| a code's `display` text | | X |
| a diagnosis written as a name | | X |
| the word "event" | | X |
| the narrative | | X |
| a problem's position in the spine | | X |

## Terms overloaded by context

Nine words below mean different things depending on who is speaking. Qualify them at the point of use,
or the reader supplies the wrong meaning. The last column carries a name this project used before.

| context | original term | desired term | legacy term |
|---|---|---|---|
| FHIR | narrative | `fhir__narrative` | |
| our summary | narrative | `summary__narrative` | `prose` |
| FHIR | pagination | `fhir__pagination` | |
| UI | pagination | `ui__pagination` | |
| HTTP | cache | `http__cache` | |
| our store | cache | `store__cache` | |
| FHIR | observation | `fhir__observation` | |
| everyday speech | observation | `plain__observation` | |
| FHIR Observation | code | `Observation__code` | what was measured |
| FHIR Condition | code | `Condition__code` | the diagnosis |
| FHIR AllergyIntolerance | code | `AllergyIntolerance__code` | the substance |
| FHIR Observation | category | `Observation__category` | its own value set |
| FHIR Condition | category | `Condition__category` | its own value set, different from Observation's |
| FHIR Condition | status | `Condition__clinicalStatus` | the element is `clinicalStatus`, there is no `status` |
| FHIR Observation | status | `Observation__status` | registered, preliminary, final, amended |
| FHIR MedicationRequest | status | `MedicationRequest__status` | active, stopped, completed |
| clinical | result | `clinical__result` | |
| FHIR DiagnosticReport | result | `DiagnosticReport__result` | points at Observations |
| our store | record stamp | `store__record_stamp` | `stamp` |
| clinical | treatment target | `clinical__treatment_target` | `target_band` |
| our UI | event | `ui__event` | `event card` |
| our fact table | code-keyed fact ids | `fact.4548-4.latest` | `fact.hba1c.latest` |
