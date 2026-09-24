"""Does each report's narrative say anything its own tables do not back?

The tables are generated from the .sql beside them; the narrative is written by hand, so it can
drift from what the report actually shows. This is the number guard the application applies to a
model's prose, turned on prose a person wrote - and for the same reason: a sentence is the one
part of a report nobody can check by re-running a query.

    python3 check_narratives.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# One- and two-digit numbers are ordinary prose ("five problems", "three resolved"). A decimal,
# or three digits or more, is a claim about the data and has to be traceable to a table.
# A decade is not a claim about a value: a table of individual years backs "the 1990s" without
# containing the string "1990", so `1990s` is excluded and `1990` is not.
CLAIM = re.compile(r"\d+(?:\.\d+)?(?!s)")
FLOOR = 3


def unbacked(report: Path) -> list[str]:
    text = report.read_text()
    if "---" not in text:
        return []
    head, tables = text.split("---", 1)
    # The title block carries the patient id, which is not a claim about the data.
    narrative = re.sub(r"^#.*$|^_.*$", "", head, flags=re.MULTILINE)
    claims = {n for n in CLAIM.findall(narrative) if "." in n or len(n) >= FLOOR}
    return sorted(n for n in claims if n not in tables)


def main() -> int:
    root = Path(__file__).parent
    reports = sorted(root.glob("*/report.md"))
    if not reports:
        print("  no reports found")
        return 1
    flagged = 0
    for report in reports:
        found = unbacked(report)
        if found:
            flagged += 1
            print(f"  {report.relative_to(root)}: check {', '.join(found)}")
        else:
            print(f"  {report.relative_to(root)}: every number in the narrative is backed by a table")
    return 0 if flagged == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
