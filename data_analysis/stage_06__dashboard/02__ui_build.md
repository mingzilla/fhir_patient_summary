# The dashboard UI — how it is built and why

**Sources.** `01__api_contract.md` is the specification. `D__synthesis_01/report.md` (patient
1643) and `D__synthesis_04/report.md` (patient 12069) are what the UI re-presents, the second
being the thin record that tests whether the layout survives one.

## Running it

```sh
uv run uvicorn src.main:app --reload --port 8021
#   the page    -> http://127.0.0.1:8021/
#   a patient   -> http://127.0.0.1:8021/?patient=1643
#   the list    -> http://127.0.0.1:8021/dashboard/patients
#   a panel     -> http://127.0.0.1:8021/dashboard/1643/visits

npm test                     # the static utils (43 tests)
LD_LIBRARY_PATH=$HOME/.cache/playwright-userlibs/usr/lib/x86_64-linux-gnu \
  uv run python tests/e2e/capture_dashboard.py   # screenshots, both patients, both themes
```

`tests/e2e/capture_dashboard.py` is a look, not a test. It renders the page and prints what
each panel drew. The chart layer is verified by opening it: a clipped label, a wrong axis and a
chart initialised against a zero-width container all pass a unit test and are obvious in a
screenshot. Two of this build's real bugs were caught that way and by nothing else.

## Decisions

| Decision | Value | Why |
|---|---|---|
| UI location | `static/` | `src/main.py` mounts it at `/`, so one process serves the shell and the JSON it reads. |
| Page shape | an app shell — fixed bar, fixed column, one scrolling pane | The patient selector is the one control every panel is scoped to. A filter that scrolls away has to be found again on every panel. |
| Narrow screens | the column becomes a drawer; the figures stay in the bar | A 272px column on a 414px screen leaves nothing. The figures stay visible because *whose record is this* must not be behind a menu. |
| ECharts | vendored, `static/vendor/echarts.min.js` 5.6.1 | Must draw with no network, in a review and inside the container. See `static/vendor/README.md`. |
| Theme | dark first, light toggle, OS preference when unchosen | The toggle writes `data-theme` on `<html>` and beats the media query in both directions. |
| Roster | the seven contract ids; every label fetched from `/patient` | No roster endpoint exists. The ids are the questions, never the answers. |
| Empty panel | `200 []` renders *none known* in words | A finding, not an error — and a panel that failed to load reads `null` and says something different. |
| Provenance | `Source` in every table view and every tooltip | The contract calls it deliberate. `record_mix` has none and shows none. |
| Counting | `rows.length` yes; a sum over a column never | The count beside a heading is the panel's own `Allergies (0)`. A total the API did not return would be this frontend asserting its own arithmetic. |

## The shell

```
wide screen                                       phone
┌─────────────────────────────────────────┐       ┌───────────────────────┐
│ Patient summary  [Pulido][473][71][…] → │ fixed │ ☰  [Pulido][473][71]…→│ fixed
├──────────┬──────────────────────────────┤ 64px  ├───────────────────────┤
│ PATIENTS │  ┌────────────────────────┐  │       │ ┌───────────────────┐ │
│ Koepp    │  │ Problems          (9)  │  │       │ │ Problems      (9) │ │ scrolls
│ Hartmann │  └────────────────────────┘  │       │ └───────────────────┘ │
│ ▸ Pulido │  ┌────────────────────────┐  │       │ ┌───────────────────┐ │
│ Welch    │  │ Measurements      (9)  │  │       │ │ Measurements  (9) │ │
│ [theme]  │  └────────────────────────┘  │       │ └───────────────────┘ │
│ 272px    │         only this pane scrolls│       └───────────────────────┘
└──────────┴──────────────────────────────┘       ☰ opens the drawer: the
                                                  same list, plus theme and info
```

| Decision | Why |
|---|---|
| The patient **list** is the left column; the **figures** are the top bar | The figures answer *whose record is this* and belong where the eye lands first. The list is a control, and a control belongs in the column that never moves. |
| One rule at both sizes | On a phone the column becomes a drawer and the strip stays in the bar, so the wide and narrow layouts put the same thing in the same place. Nothing is learned twice. |
| The strip is a nowrap row that scrolls **sideways** | A wrapping row would change the bar's height, and the bar's height is the one thing that must not move. |
| Every panel is full width | Two panels sharing a row halves the room for a chart whose axis labels are conditions and drug names, and it changes the page's rhythm halfway down for no reason the reader can see. |
| `.app-shell`'s column is `minmax(0, 1fr)`, not the implicit `auto` | An `auto` column sizes to its widest content, and the figure strip is a nowrap row whose intrinsic width is far wider than a phone — an `auto` column let it push the whole shell to 527px inside a 414px viewport and clip every card. |
| `100dvh`, not `100vh` | A phone browser shrinks the viewport as its address bar appears; `vh` would put the bottom of the pane off-screen. |
| Chart margins follow the **measured** width | A 290px y-axis margin is right on a 1200px panel and leaves a phone with no plot; the builder reads `clientWidth` at mount. |
| The wordmark hides below 620px | Five blocks need the width more than a title does, and the drawer and the browser tab both still name the page. |
| The pane is not `aria-live` | It is replaced wholesale on a patient switch, so a live region would read the whole record aloud on every click. |

## The patient list is a working set, not a roster

The list on the left is the patients this reader is looking at. It grows and shrinks: a search
box above it adds, and a `×` on each row removes.

Because the store is keyed by patient id, both operations are key operations. Adding a patient
is a write under its id; removing one is `drop_patient`, which deletes the entry and takes the
cached panels with it. There is no second structure to keep in step and nothing to invalidate.
Opening a patient that was dropped re-fetches, which is cheap and is the only way to be sure
the record shown is current.

| Decision | Why |
|---|---|
| The search results are an **overlay**, not a block in the column | Inserted in flow they pushed the list down the moment a letter was typed, so the list a reader was reaching for moved as they searched for it in the list. The field anchors, the results float, and the list stays where it was. |
| The overlay is **opaque**, not the translucent card surface | An overlay a reader can see the list through is one they will try to read the list through. |
| The overlay closes on **Escape, an outside click, and after either action** | A dropdown that only closes on Escape stays open while the reader works elsewhere on the page. |
| Arrow keys move, Enter opens | A floating list with no keyboard is a list a keyboard user cannot reach without tabbing through it. |
| A search that matched nothing **says so** | An empty box under a search field is the same picture as a search that never ran. |
| A row is **one line** | A dozen patients is a list to be *scanned*. A three-line entry turns twelve rows into thirty-six lines to read past. |
| The current patient's marker is **positioned, not laid out** | A mark that took up space would indent one name and leave the column ragged, giving the eye a second thing to track down a list whose whole job is scanning. |
| A row is **two** controls: the name opens, the `×` removes | Different intentions. Adding someone to compare against is not the same as switching to them. |
| The `×` is never hover-only | A control that appears on hover does not exist on a touch screen, and this one deletes something. |
| Removing the open patient moves the selection to the first remaining | Otherwise the page keeps showing a record the reader has just taken off the list. An empty list gets an empty state, not an error. |

### The list is one request; the search is a filter over it

`GET /dashboard/patients` returns every patient in the record in panel 1's own nine columns -
`stage_05__text_report_refine/00_patient_list.sql`, verified equal to panel 1 for every patient
by `tests/test__patient_list.py`. So the row on the left and the header of the open patient are
the same shape read twice, and the row for whoever is open is already in the list.

**That query sits above the option folders, not inside one.** It is not a panel and not about a
patient, so putting it in `D__synthesis_01/` would have had `build_reports.sh` fold a
cross-patient query into that patient's `report.md`, and `check_panels.sh` check it as a panel.
Both scripts glob *within* the folders. It runs in the DuckDB CLI like the panels - its paging
is `SET VARIABLE lim` rather than a bound parameter, because DuckDB allows a prepared parameter
only in the last statement and those lines are not last.

Before it existed the page made **seven** calls at startup to label the list, from seven
patient ids hardcoded in `domains/patient_roster.js` - the only thing the frontend knew that
it had not been told by an endpoint. It now makes one, and the ids are gone.

| Startup, measured in the browser | Before | After |
|---|---|---|
| label the list | 7 calls, one per patient | **1 call** |
| the open patient's strip | 1, fetched a second time for the list | 0 - already in the list response |
| the open patient's six other panels | 6 | 6 |
| **total** | **15** | **8** |

The search box filters the rows this list returned, and `patient_match.js` is named and
documented as a filter rather than a search. Matching is a case-insensitive substring over
**the surname and the record id** only: sex, age and the dates are deliberately excluded,
because `male` contains an `a`, an `e` and an `l` and a `6` sits inside `16` and `26`, so a
search over them returns the whole record for a single typed letter.

**A filter over this list cannot see a patient the dashboard does not hold.** `/search` answers
from the FHIR server, which knows more people than the seven in the sample database:
`/search?q=koepp` returns four candidates and only one of them - id `1` - is drawable;
`/dashboard/185455/patient` is a 404. Those are candidates in the record, not patients this
dashboard can draw, so wiring `/search` straight into the list would put a 404 behind a `+`.

### Search is the server; the record is the list

The box queries `GET /search?q=`, which answers from the **FHIR server**. The list is
`GET /dashboard/patients`, which answers from the **database**. They are different sources and
they hold different people, so the results carry a `+` rather than being links.

| | |
|---|---|
| **In the record** | the dashboard can draw this patient. Their row is openable. |
| **On the list** | they are on the left right now. A reader can undo it with the `×`. |
| **Neither** | a candidate. `+` calls `POST /load/{id}`, which takes 15-20 seconds. |

The two predicates are separate on purpose: a patient in the record but taken off the list
comes back instantly with no network, and only a genuine candidate pays for a load. The
patient is **added, not opened** - adding someone to compare against is not switching to them,
and a list that jumps to whatever was just added moves under the reader's hand.

**Four outcomes that must not collapse into one.** *Nothing searched yet* is not *nobody
matched*; *the search did not run* (`503`) is not a statement about the record at all; and
*this patient is not on the server* (`404` from load) is a finding about one candidate. An
earlier version rendered "nobody matched" whenever it had no rows, which put that sentence under
an empty field on every page load. The component now carries an explicit state - `idle`,
`short`, `searching`, `done`, `failed` - and `refresh` is only safe because `idle` closes.

The join, written down because it fails **silently**: a candidate's `id` matches the list row's
**`Source`**, never its **`Patient`**. `Patient` is the surname, so joining there compares a
name against an id - it matches nobody or the wrong person, and either way renders as a working
search. A candidate's `name` is `Given Family` and a list row's `Patient` is the family name
alone: same person, two shapes, each drawn by the component for its own shape.

**Known backend issue at the time of writing.** Two concurrent `POST /load` calls collide: both
temp paths in `ingest_service.add()` are keyed on `os.getpid()` alone, so the second request's
`_discard` deletes the first's file mid-flight. One add returns 500, the other 503, and neither
patient is added. Reported; a double-click on `+` or two tabs is enough to hit it.

## Shapes that follow from the data, not from taste

| Panel | Form | Because |
|---|---|---|
| patient | a rail of figures | Nine scalars have no shape to draw. A dial or a bar-per-figure is decoration over a number. |
| problems | custom-series timeline | **`type:'bar'` cannot span two dates.** See below. |
| problems | bars drawn from `Onset` and `Outcome`, never `Years` | `Years` counts year boundaries crossed and is approximate by up to a year. Sizing a bar with it turns a rounding into a length; it is printed beside the bar as text instead. |
| medications | one lane per drug; marker shape carries `Course` | `Gap (days)` is measured per drug, so it only reads inside a lane. Shape rather than hue separates first from re-order, and the legend names both. |
| key_measures | nine sparklines of two points, axis hidden | Two readings are not a series. Equal spacing, because the horizontal distance between them means nothing. |
| allergies | a list | Every field is a string; there is no number to place on a scale. |
| visits | **grouped** bars on a **time** axis, every visit ticked on the baseline | Grouped, because `Results + Reports` is not a number any endpoint returns and a stack would put an unserved total on top of every bar. On a time axis, because two visits on one day arrive in insertion order. Ticked, because a visit that recorded nothing would otherwise be invisible — including patient 1643's 1965 first-seen visit. |
| record_mix | three stacked series, one per class | A resource has exactly one class, so the stack never sums. It buys a real legend instead of three colours a reader has to decode. |

### The one chart form that was wrong

`type:'bar'` with `encode: {x: [0, 1]}` looks like a range bar, and it renders — so it reads as
a chart while being one. The bars anchor to the left edge of the grid and their length encodes
the onset alone: on a time axis the bar base is `valueAxisStart`, which is `dataToCoord(0)`,
which is 1970. It is a `custom` series with `renderItem` now, drawing each bar between two
`api.coord` points, which is the only form where the left end is the onset by construction.

## Contract findings

1. **`Latest` and `Previous` lose a trailing `.0` in the browser.** The panel prints patient
   1's body mass index as `Latest 30.0`; JSON does not preserve that, and `30.0` and `30` parse
   to the same JavaScript number, so the UI prints `30`. Cosmetic, only for exactly-whole
   values, and it never puts two different readings on one row — a `Change` sentence quoting a
   number is only written when the two readings differ.
2. **No endpoint serves a per-class total for `record_mix`.** The three classes are therefore
   never totalled and no single composition bar is drawn. The only total on the page is
   `Clinical events`, which invariant 1 fixes as the sum of the clinical rows. A wanted
   addition, not a workaround: summing in the browser is the thing this API exists to prevent.
3. Everything else held exactly as written: keys verbatim, dates as `YYYY-MM-DD` strings,
   numbers as JSON numbers or `null`, `200 []` for an empty panel, `404` for an unknown or
   non-numeric patient. All seven patients were checked against the contract before any UI was
   written.

## Where the numbers come from

`node scripts/validate_palette.js` (the `dataviz` skill) against the surfaces this page
actually uses, with the slots it actually uses:

| Mode | Slots | Result |
|---|---|---|
| dark, surface `#17171a` | `#3987e5` `#d95926` `#199e70` | all checks pass — worst adjacent CVD ΔE 9.4 |
| light, surface `#ffffff` | `#2a78d6` `#eb6834` `#1baf7a` | all checks pass; aqua at 2.82:1, relief required |

The light-mode aqua relief is met twice over: every bar of the one chart using all three slots
is direct-labelled with its count, and every panel has a table view.

## Code shape

`static/js/` follows `unit__design__07__code_structure_frontend`: `domains/` mirror the wire
one file per endpoint row, `store/ui_data_store.js` holds one frozen map keyed on the patient,
`service/` is the only place `fetch` is called, `util/` holds the pure transforms (one option
builder per chart form), and `component/` holds one module per panel. A chart option is a pure
function of domain rows and a palette, so all of them are unit-tested in Node with no DOM.
