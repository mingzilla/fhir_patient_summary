#!/usr/bin/env python3
"""Build the database from the FHIR server. The code is `src/ingest_service.py`.

Kept at this path because the build is run from here - `start.sh`, the compose `loader`
service and the notes in `fhir_sample.sql` all name it - and because the schema this builds
against, `fhir_sample.sql`, sits next to it. The service is importable too, which is how the
`POST /load/{patient_id}` endpoint drives the same code.

Usage:  python3 fhir_sample_load.py [database]
        python3 fhir_sample_load.py --seed <database> <init.sql>
        python3 fhir_sample_load.py --dump <database> <out.sql>
"""
import sys
from pathlib import Path

# Found by looking for `src/`, not by counting directories up: this file has moved once
# already, and a fixed number of `dirname`s silently pointed past the repo root when it did.
_HERE = Path(__file__).resolve()
for _parent in _HERE.parents:
    if (_parent / "src" / "ingest_service.py").is_file():
        sys.path.insert(0, str(_parent))
        break
else:
    raise SystemExit(f"cannot find the repo root above {_HERE}")

from src.ingest_service import run  # noqa: E402  (after the path is set)

if __name__ == "__main__":
    run(sys.argv[1:])
