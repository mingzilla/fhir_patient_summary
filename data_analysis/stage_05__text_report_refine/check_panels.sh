#!/bin/sh
# Verify every panel: runs three times, all agreeing with each other and with the saved .txt.
#
# The database path is resolved here rather than passed in, because getting it wrong does not
# fail loudly - DuckDB creates an empty database at whatever path it is given, every query then
# errors with "table not found", and the errors differ enough between runs to report every panel
# as unstable. That is a false alarm that looks exactly like a real ordering bug, so the path is
# not a caller's problem.
cd "$(dirname "$0")" || exit 1
DB="$(cd ../.. && pwd)/db_data/fhir_sample.duckdb"

if [ ! -f "$DB" ]; then
  echo "no database at $DB" >&2
  exit 2
fi
if [ ! -s "$DB" ]; then
  echo "database at $DB is empty" >&2
  exit 2
fi

status=0
for sql in */[0-9]*.sql; do
  [ -f "$sql" ] || continue
  a=$(duckdb "$DB" < "$sql" 2>&1)
  b=$(duckdb "$DB" < "$sql" 2>&1)
  c=$(duckdb "$DB" < "$sql" 2>&1)
  case "$a" in *Error*|*error*|*Binder*|*Invalid*) echo "  ERROR      $sql"; status=1; continue ;; esac
  if [ ! -f "${sql%.sql}.txt" ]; then
    printf '  NO BASE    %s\n' "$sql"
    status=1
    continue
  fi
  saved=$(cat "${sql%.sql}.txt")
  if [ "$a" = "$b" ] && [ "$b" = "$c" ] && [ "$c" = "$saved" ]; then
    printf '  stable     %s\n' "$sql"
  else
    printf '  UNSTABLE   %s\n' "$sql"
    status=1
  fi
done
exit $status
