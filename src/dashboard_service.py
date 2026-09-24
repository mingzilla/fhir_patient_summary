"""One method per panel, each returning the rows of one verified SQL.

The panels are served from `src/sql/`. They were read out of the analysis tree until the folder
they lived in was renumbered twice and broke the running app both times: the runtime should not
reach into `data_analysis/`, which is named for the process that produced it. The analysis copies
are still the ones the reports were verified against, so the two are compared by
`tests/test__panel_sql.py` rather than trusted to stay equal.

The rows are returned exactly as the panel prints them, because the dashboard is a mirror of
`report.md` and the frontend is built against that shape.

The panels filter on `patient_id`, so a patient absent from the database returns zero rows
rather than an error - and zero rows is also what a patient with no allergies returns. Those
are different findings, and only the roster can tell them apart, so an id absent from
`patient` is refused before the panel runs.

Every panel opens the database read-only. DuckDB takes a single writer, and
`fhir_sample_load.py` rebuilds that same file, so a read-write connection here would contend
with the loader.
"""

import datetime
import os
from decimal import Decimal
from enum import Enum
from pathlib import Path

import duckdb

from src.panel_script import PanelScript

_REPO_ROOT = Path(__file__).resolve().parents[1]
# Under compose the database is built by the `loader` service into a volume, which is not
# where a bare-host run keeps it. The panels themselves are read from the image, beside the
# code, so only the build artifact moves.
_DATABASE = Path(os.environ.get(
    "FHIR_SAMPLE_DB", _REPO_ROOT / "db_data/fhir_sample.duckdb"))
_PANEL_DIR = _REPO_ROOT / "src/sql"

# The loader casts `patient_id` to BIGINT, so these are the only path segments that can name
# a patient. A segment with anything else in it names nobody, which is the same condition as
# naming somebody who is not in the roster - both are "no such patient", not "no rows".
_DIGITS = frozenset("0123456789")


class Panel(Enum):
    # The list is not one of the seven and is not asked per patient. It is in this enum so
    # that it is read and converted by the same path, against the same verified directory.
    LIST = "LIST"
    PATIENT = "PATIENT"
    PROBLEMS = "PROBLEMS"
    MEDICATIONS = "MEDICATIONS"
    KEY_MEASURES = "KEY_MEASURES"
    ALLERGIES = "ALLERGIES"
    VISITS = "VISITS"
    RECORD_MIX = "RECORD_MIX"


class PatientNotFound(Exception):

    def __init__(self, patient_id: str):
        super().__init__(f"no patient {patient_id!r} in this record")


class DashboardService:

    def patients(self, limit: int = 0, offset: int = 0) -> list[dict]:
        """Every patient in the record, in panel 1's row shape.

        `limit=0` means no limit, which is the wire's convention rather than SQL's: the script
        turns it into NULL with `nullif`, and `LIMIT NULL` is DuckDB's way of saying the same
        thing. The translation stays in the query so that running the script by hand - where
        the literals it ships with are the defaults - means the same as calling this with no
        arguments.

        The values are substituted into the script's own `SET VARIABLE` lines rather than bound
        as parameters. A prepared parameter is allowed only in the last statement, and these
        lines are not the last - which is why a panel binds its `pid` in a separate execute and
        why this one, with two inputs, does not bind at all.

        This is the only method that does not name a patient, so it is the only one that can
        answer 200 with an empty array for a reason other than "this patient has no rows":
        an empty record.
        """
        with duckdb.connect(str(_DATABASE), read_only=True) as connection:
            statement = PanelScript.to_statement_with_variables(
                self._panel_rows__script_text(Panel.LIST),
                {"lim": limit, "off": offset},
            )
            return self._panel_rows__rows_of(connection, statement, [])

    def patient(self, patient_id: str) -> list[dict]:
        return self._panel_rows(Panel.PATIENT, patient_id)

    def problems(self, patient_id: str) -> list[dict]:
        return self._panel_rows(Panel.PROBLEMS, patient_id)

    def medications(self, patient_id: str) -> list[dict]:
        return self._panel_rows(Panel.MEDICATIONS, patient_id)

    def key_measures(self, patient_id: str) -> list[dict]:
        return self._panel_rows(Panel.KEY_MEASURES, patient_id)

    def allergies(self, patient_id: str) -> list[dict]:
        return self._panel_rows(Panel.ALLERGIES, patient_id)

    def visits(self, patient_id: str) -> list[dict]:
        return self._panel_rows(Panel.VISITS, patient_id)

    def record_mix(self, patient_id: str) -> list[dict]:
        return self._panel_rows(Panel.RECORD_MIX, patient_id)

    def _panel_rows(self, panel: Panel, patient_id: str) -> list[dict]:
        parsed = self.parse_patient_id(patient_id)
        if parsed is None:
            raise PatientNotFound(patient_id)
        with duckdb.connect(str(_DATABASE), read_only=True) as connection:
            self._panel_rows__require_patient(connection, parsed, patient_id)
            query = PanelScript.to_query(self._panel_rows__script_text(panel), parsed)
            return self._panel_rows__rows_from(connection, query)

    @staticmethod
    def parse_patient_id(raw: str) -> int | None:
        text = raw.strip()
        if not text or not set(text).issubset(_DIGITS):
            return None
        return int(text)

    @staticmethod
    def normalise_value(value):
        """Match what the DuckDB CLI writes in `.mode json`.

        Dates and times go out as strings there rather than as numbers, and a decimal keeps
        its trailing zeros - `23.50`, not `23.5`. The equality this dashboard claims against
        the panels is the equality of this function.
        """
        if isinstance(value, (datetime.date, datetime.time, Decimal)):
            return str(value)
        return value

    @staticmethod
    def _panel_rows__script_text(panel: Panel) -> str:
        matches = sorted(_PANEL_DIR.glob(f"*_{panel.value.lower()}.sql"))
        if len(matches) != 1:
            raise ValueError(f"{panel.value.lower()} names {len(matches)} panel scripts")
        return matches[0].read_text()

    @staticmethod
    def _panel_rows__require_patient(connection, parsed_id: int, raw_id: str) -> None:
        found = connection.execute("SELECT 1 FROM patient WHERE id = ?", [parsed_id]).fetchall()
        if not found:
            raise PatientNotFound(raw_id)

    @staticmethod
    def _panel_rows__rows_from(connection, query) -> list[dict]:
        connection.execute(query.binding, query.parameters)
        return DashboardService._panel_rows__rows_of(connection, query.statement, [])

    @staticmethod
    def _panel_rows__rows_of(connection, statement: str, parameters: list) -> list[dict]:
        cursor = connection.execute(statement, parameters) if parameters \
            else connection.execute(statement)
        columns = [column[0] for column in cursor.description]
        return [{name: DashboardService.normalise_value(value) for name, value in zip(columns, row)}
                for row in cursor.fetchall()]


dashboard_service = DashboardService()
