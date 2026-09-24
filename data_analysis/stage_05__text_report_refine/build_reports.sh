#!/bin/sh
# Assemble each option's panels into one markdown report.
#
# A report folder holds: one .sql per panel, its .txt output, and narrative.md. The tables are
# generated from the SQL; the narrative is written by hand from those tables. To add a patient,
# copy a folder, change the one `SET VARIABLE pid` line in each panel, and rewrite narrative.md -
# nothing here needs editing.
#
# Usage:  sh build_reports.sh
cd "$(dirname "$0")" || exit 1
DB="$(cd ../.. && pwd)/db_data/fhir_sample.duckdb"

if [ ! -f "$DB" ] || [ ! -s "$DB" ]; then
  echo "no usable database at $DB" >&2
  exit 2
fi

heading() {
  case "$(basename "$1")" in
    01_patient.sql)          echo "Patient" ;;
    02_visits.sql)           echo "Visits" ;;
    03_visit_details.sql)    echo "What happened at each visit" ;;
    04_measures.sql)         echo "Measurements" ;;
    02_problems.sql)         echo "Problems" ;;
    03_medications.sql)      echo "Prescriptions" ;;
    02_record_mix.sql)       echo "What the record is made of" ;;
    03_activity_by_year.sql) echo "Activity by year" ;;
    04_key_measures.sql)     echo "Measurements that matter" ;;
    05_allergies.sql)        echo "Allergies" ;;
    06_visits.sql)           echo "Visits" ;;
    07_record_mix.sql)       echo "What the record is made of" ;;
    *)                       echo "$(basename "$1" .sql)" ;;
  esac
}

# Which patient a folder is about, read from its own panels rather than passed in.
patient_of() {
  grep -h -m1 'SET VARIABLE pid' "$1"/*.sql | head -1 | sed 's/.*= *//; s/;//'
}

notes() {
  cat <<'NOTES'

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
NOTES
}

build() {
  option="$1"; title="$2"
  [ -f "$option/narrative.md" ] || { echo "  $option: no narrative.md" >&2; return 1; }

  for sql in "$option"/*.sql; do
    [ -f "$sql" ] || continue
    duckdb "$DB" < "$sql" > "${sql%.sql}.txt" 2>&1
  done

  {
    printf '# %s\n\n' "$title"
    printf '_Report for patient %s, generated from `fhir_sample.duckdb`._\n\n' "$(patient_of "$option")"
    cat "$option/narrative.md"
    printf '\n---\n\n'
    for sql in "$option"/*.sql; do
      [ -f "$sql" ] || continue
      printf '## %s\n\n' "$(heading "$sql")"
      cat "${sql%.sql}.txt"
      printf '\n'
    done
    notes
  } > "$option/report.md"
  printf '  %-30s %s lines\n' "$option/report.md" "$(wc -l < "$option/report.md")"
}

build A__visit_led "Visit-led report"
build B__problem_led "Problem-led report"
build C__record_at_a_glance "Record-at-a-glance report"
build D__synthesis "Synthesised report"
build D__synthesis_02 "Synthesised report — second patient"
build D__synthesis_03 "Synthesised report — third patient"
build D__synthesis_04 "Synthesised report — fourth patient"
