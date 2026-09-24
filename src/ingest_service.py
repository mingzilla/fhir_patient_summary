#!/usr/bin/env python3
"""Fetch FHIR records and load them into a DuckDB database.

The DuckDB column names mirror the FHIR elements they come from, so the schema
(fhir_sample.sql) can be read as a map of the API.

A middleware service in the sense of `002__design_06`: it wraps the FHIR API and the database
it fills, and it mirrors no table the app owns. Two ways in - a whole sample, or one patient
added to a record that already exists - and one way out: the database is built beside its
destination and renamed over it, so a reader never opens a half-built file, and a run that
fails leaves the database that was already there untouched.

Usage:  python3 -m src.ingest_service [database]
"""
import json
import os
import sys
import time
import urllib.request
from urllib.parse import urlsplit
from pathlib import Path
from urllib.error import URLError
from uuid import uuid4

import duckdb

# Under compose this names the `fhir` service. Inside a container `localhost` is that
# container, so the default is right only for a run bare on the host.
BASE = os.environ.get("FHIR_BASE_URL", "http://localhost:8080/hapi-fhir-jpaserver/fhir")
PIDS = [1, 181, 821, 1390, 1643, 87788, 12069]
TYPES = ["Condition", "Observation", "MedicationRequest", "AllergyIntolerance", "Encounter",
         "Procedure", "Immunization", "DiagnosticReport", "Claim", "ExplanationOfBenefit",
         "CarePlan", "CareTeam", "Goal", "Device", "ServiceRequest", "DocumentReference"]

# The schema stays with the data it describes, beside the database and the verified panels,
# rather than moving in here with the code that runs it.
SCHEMA = Path(__file__).resolve().parents[1] / "db_data/fhir_sample.sql"


def get(url):
    for i in range(8):
        try:
            with urllib.request.urlopen(url, timeout=180) as r:
                return json.load(r)
        except Exception:
            if i == 7:
                raise
            time.sleep(min(2 ** i, 20))


def rebase(url):
    """Re-point a link the server wrote at the server we are actually talking to.

    A server writes its pagination links from its own configured address, not from the
    request's Host header, so they are not ours to trust. Our HAPI answers a request to
    `http://fhir:8080/...` with links to `http://localhost:8080/...`, and inside the app
    container `localhost:8080` is the app - so page two is a connection refused, and only for
    a patient with more than one page of something. Bare on the host it works, because there
    `localhost:8080` *is* the server, which is why this only shows up under compose.
    """
    base = BASE.rstrip("/")
    parsed = urlsplit(url)
    base_path = urlsplit(base).path
    path = parsed.path
    if base_path and base_path != "/" and path.startswith(base_path):
        path = path[len(base_path):]
    path = path.rstrip("/")
    if path and not path.startswith("/"):
        path = f"/{path}"
    return f"{base}{path}" + (f"?{parsed.query}" if parsed.query else "")


def next_page(bundle):
    found = next((l["url"] for l in bundle.get("link", []) if l.get("relation") == "next"), None)
    return None if found is None else rebase(found)


def fetch_all(path):
    url, out, pages = f"{BASE}/{path}", [], 0
    while url and pages < 80:
        d = get(url)
        out += [e["resource"] for e in d.get("entry", [])]
        url, pages = next_page(d), pages + 1
    return out


def walk(o, *path):
    """Walk a nested dict/list by keys; an int key indexes a list."""
    for k in path:
        if o is None:
            return None
        if isinstance(k, int):
            if not isinstance(o, list) or len(o) <= k:
                return None
            o = o[k]
        elif isinstance(o, dict):
            o = o.get(k)
        else:
            return None
    return None if isinstance(o, (dict, list)) else o


def descend(o, path):
    """Walk path from o. An int step indexes a list. Tests the node, never the key."""
    cur = o
    for k in path:
        if cur is None:
            return None
        if isinstance(k, int):
            cur = cur[k] if isinstance(cur, list) and len(cur) > k else None
        elif isinstance(cur, dict):
            cur = cur.get(k)
        else:
            return None
    return cur


def cc(o, *path):
    """Flatten a CodeableConcept at path to (code, display, system)."""
    node = descend(o, path)
    if not isinstance(node, dict):
        return None, None, None
    coding = (node.get("coding") or [{}])[0]
    return coding.get("code"), coding.get("display") or node.get("text"), coding.get("system")


def qty(o, *path):
    """Flatten a Quantity at path to (value, unit, code)."""
    node = descend(o, path)
    if not isinstance(node, dict):
        return None, None, None
    return node.get("value"), node.get("unit") or node.get("code"), node.get("code")


def bare(x):
    """Patient/1643 -> 1643, so the tables join on a plain id."""
    return x.split("/")[-1] if isinstance(x, str) and "/" in x else x


def ref(o, *path):
    return bare(descend(o, list(path) + ["reference"]))


def pid(r):
    return bare(descend(r, ["subject", "reference"])) or bare(descend(r, ["patient", "reference"]))


# ---- Staging
#
# fhir_sample.sql stays the schema and is run as it stands - the tables, their column order,
# their types and the two views are the file's, not a second copy of it. It reads one
# source_<table> per table, and everything below exists to hand it those: the rows fetched,
# as text, under the types the schema expects.

STAGED = {}  # table -> its columns, in the order fhir_sample.sql selects them


def _ident(name):
    return '"' + name.replace('"', '""') + '"'


# How the reader this replaces would have typed a text column, as SQL. It has to be answered
# because a column fhir_sample.sql does not CAST keeps whatever type it is staged with, and
# two of the answers are load-bearing: a timestamp carrying a UTC offset has to arrive as
# TIMESTAMPTZ, since CAST(timestamptz AS TIMESTAMP) converts into the session timezone while
# the same cast from text only drops the offset and moves the value by it; and an id that
# reads as an integer has to arrive as one, or it lands VARCHAR where it used to be BIGINT.
#
# The rungs are the reader's own rules, shape tests included - '007' is not an integer to it,
# nor '+7', nor a 20-digit number. Checked column by column against sniff_csv over the row
# text this schema was originally built from: 183 columns, no disagreement.
RUNGS = [
    ("BOOLEAN",     r"lower(trim({c})) IN ('true', 'false')"),
    ("BIGINT",      r"TRY_CAST(trim({c}) AS BIGINT) IS NOT NULL"
                    r" AND regexp_matches(trim({c}), '^-?(0|[1-9][0-9]*)$')"),
    ("DOUBLE",      r"TRY_CAST(trim({c}) AS DOUBLE) IS NOT NULL"
                    r" AND regexp_matches(trim({c}), '^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?$')"),
    ("TIMESTAMPTZ", r"TRY_CAST({c} AS TIMESTAMPTZ) IS NOT NULL"
                    r" AND regexp_matches(trim({c}), '(Z|[+-][0-9]{2}:?[0-9]{2})$')"),
    ("TIMESTAMP",   r"TRY_CAST({c} AS TIMESTAMP) IS NOT NULL AND regexp_matches({c}, 'T[0-9]{2}:')"),
    ("DATE",        r"TRY_CAST({c} AS DATE) IS NOT NULL AND NOT regexp_matches({c}, ':')"),
]


def staged_type(col):
    """A CASE giving the type to stage `col` with: the first rung every value satisfies.

    A code column is VARCHAR whatever the values say. It is a code, not a number: the seven
    patients this schema was inferred from all carry all-digit SNOMED codes, so the ladder
    called `condition.code` a BIGINT - and then a patient whose code reads `34552-0` could not
    be added at all, because the merge casts the fetched row into the type the first patient
    happened to imply. `diagnostic_report.code` and `observation.code` escaped only because
    LOINC forced a string. The type belongs to the element, not to whoever was loaded first.
    """
    if col == "code" or col.endswith("_code"):
        return "'VARCHAR'"
    c = _ident(col)
    whens = [
        "WHEN count(*) FILTER ({c} IS NOT NULL AND NOT ({pred})) = 0"
        " AND count(*) FILTER ({c} IS NOT NULL) > 0 THEN '{t}'"
        .replace("{c}", c).replace("{pred}", pred.replace("{c}", c)).replace("{t}", t)
        for t, pred in RUNGS
    ]
    return "CASE " + " ".join(whens) + " ELSE 'VARCHAR' END"


def stage(con, name, cols, rows):
    """Hold one table's rows as text under stage_<name>; return the row count.

    Text, because the schema's TRY_CASTs expect what the reader used to hand them. An empty
    value is bound as NULL rather than '': the tables this replaces came through a CSV writer
    that could not tell an empty string from a missing value, so both became NULL.
    """
    STAGED[name] = cols
    table = _ident("stage_" + name)
    con.execute(f"CREATE OR REPLACE TABLE {table} ({', '.join(f'{_ident(c)} VARCHAR' for c in cols)})")
    if rows:
        con.executemany(f"INSERT INTO {table} VALUES ({', '.join('?' * len(cols))})",
                        [tuple(None if v is None or v == "" else str(v) for v in row) for row in rows])
    return len(rows)


def staged_types(con, name):
    """The type to stage each column of one table with, as DuckDB names them.

    The ladder is an aggregate over the column, so this is one row of type names - not a
    column expression: as a column it would make the staging relation a single row holding
    the names.
    """
    cols = STAGED[name]
    select = ", ".join(f"{staged_type(c)} AS {_ident(c)}" for c in cols)
    return con.execute(f"SELECT {select} FROM {_ident('stage_' + name)}").fetchone()


def bind_sources(con):
    """Pin each staged table to the type it holds, under the name the schema reads it by."""
    for name, cols in STAGED.items():
        casts = ",\n            ".join(
            f"TRY_CAST({_ident(c)} AS {t}) AS {_ident(c)}"
            for c, t in zip(cols, staged_types(con, name)))
        con.execute(f"CREATE OR REPLACE VIEW {_ident('source_' + name)} AS"
                    f"\n        SELECT {casts}\n        FROM {_ident('stage_' + name)}")


def apply_schema(con, schema_path):
    bind_sources(con)
    with open(schema_path) as f:
        con.execute(f.read())
    for name in STAGED:
        con.execute(f"DROP VIEW {_ident('source_' + name)}")
        con.execute(f"DROP TABLE {_ident('stage_' + name)}")


def main(db_path, patient_ids=PIDS):
    by_type = {"Patient": fetch_all("Patient?_id=" + ",".join(map(str, patient_ids)) + "&_count=50")}
    for t in TYPES:
        rows = []
        for p in patient_ids:
            rows += fetch_all(f"{t}?patient={p}&_count=100")
        if rows:
            by_type[t] = rows

    counts = {}
    # Unique per call, not per process: the endpoint runs in a threadpool, so two adds in one
    # server process share a pid - and a `_discard` of the second would delete the first's
    # half-built file underneath it.
    building = f"{db_path}.building-{uuid4().hex}"
    con = duckdb.connect(building)
    try:
        # ---- Patient, plus its two 1:* embedded lists
        cols = ["id", "gender", "birth_date", "deceased_boolean", "deceased_datetime", "marital_status",
                "name_family", "name_given", "address_city", "address_state", "address_postal_code"]
        counts["patient"] = stage(con, "patient", cols, [[
            r.get("id"), r.get("gender"), r.get("birthDate"), r.get("deceasedBoolean"),
            r.get("deceasedDateTime"), walk(r, "maritalStatus", "coding", 0, "code"),
            walk(r, "name", 0, "family"), " ".join(walk(r, "name", 0, "given") or []) or None,
            walk(r, "address", 0, "city"), walk(r, "address", 0, "state"),
            walk(r, "address", 0, "postalCode")] for r in by_type.get("Patient", [])])

        rows = [(r["id"], n.get("use"), n.get("family"), " ".join(n.get("given") or []),
                 " ".join(n.get("prefix") or []))
                for r in by_type.get("Patient", []) for n in (r.get("name") or [])]
        counts["patient_name"] = stage(con, "patient_name",
                                       ["patient_id", "use", "family", "given", "prefix"], rows)

        rows = [(r["id"], i.get("system"), i.get("value"), walk(i, "type", "coding", 0, "code"))
                for r in by_type.get("Patient", []) for i in (r.get("identifier") or [])]
        counts["patient_identifier"] = stage(con, "patient_identifier",
                                             ["patient_id", "system", "value", "type_code"], rows)

        # ---- Encounter
        counts["encounter"] = stage(con, "encounter",
            ["id", "patient_id", "status", "class_code", "type_code", "type_display",
             "period_start", "period_end", "service_provider"],
            [[r.get("id"), pid(r), r.get("status"), walk(r, "class", "code"),
              cc(r, "type", 0)[0], cc(r, "type", 0)[1], walk(r, "period", "start"),
              walk(r, "period", "end"), ref(r, "serviceProvider")]
             for r in by_type.get("Encounter", [])])

        # ---- Condition
        counts["condition"] = stage(con, "condition",
            ["id", "patient_id", "encounter_id", "clinical_status", "verification_status",
             "category", "code", "code_display", "code_system", "onset_datetime", "recorded_date",
             "abatement_datetime"],
            [[r.get("id"), pid(r), ref(r, "encounter"),
              walk(r, "clinicalStatus", "coding", 0, "code"),
              walk(r, "verificationStatus", "coding", 0, "code"),
              walk(r, "category", 0, "coding", 0, "code"),
              cc(r, "code")[0], cc(r, "code")[1], cc(r, "code")[2],
              r.get("onsetDateTime"), r.get("recordedDate"), r.get("abatementDateTime")]
             for r in by_type.get("Condition", [])])

        # ---- Observation, with the value[x] type spelled out, plus its two 1:* embedded lists
        def value_type(r):
            keys = [k for k in r if k.startswith("value")]
            return keys[0][5:] if keys else None

        counts["observation"] = stage(con, "observation",
            ["id", "patient_id", "encounter_id", "status", "category", "code", "code_display",
             "code_system", "effective_datetime", "value_type", "value_quantity_value",
             "value_quantity_unit", "value_quantity_code", "value_codeable_text", "value_string",
             "data_absent_reason", "component_count"],
            [[r.get("id"), pid(r), ref(r, "encounter"), r.get("status"),
              walk(r, "category", 0, "coding", 0, "code"),
              cc(r, "code")[0], cc(r, "code")[1], cc(r, "code")[2],
              r.get("effectiveDateTime"), value_type(r),
              qty(r, "valueQuantity")[0], qty(r, "valueQuantity")[1], qty(r, "valueQuantity")[2],
              cc(r, "valueCodeableConcept")[1], r.get("valueString"),
              walk(r, "dataAbsentReason", "coding", 0, "code"), len(r.get("component") or [])]
             for r in by_type.get("Observation", [])])

        rows = [(r["id"], i, cc(c, "code")[0], cc(c, "code")[1],
                 qty(c, "valueQuantity")[0], qty(c, "valueQuantity")[1], cc(c, "valueCodeableConcept")[1])
                for r in by_type.get("Observation", []) for i, c in enumerate(r.get("component") or [])]
        counts["observation_component"] = stage(con, "observation_component",
            ["observation_id", "ordinal", "code", "code_display", "value_quantity_value",
             "value_quantity_unit", "value_codeable_text"], rows)

        rows = [(r["id"], i, qty(rr, "low")[0], qty(rr, "low")[1], qty(rr, "high")[0], qty(rr, "high")[1],
                 walk(rr, "type", "coding", 0, "code"), cc(rr, "type")[1], rr.get("text"))
                for r in by_type.get("Observation", []) for i, rr in enumerate(r.get("referenceRange") or [])]
        counts["observation_reference_range"] = stage(con, "observation_reference_range",
            ["observation_id", "ordinal", "low_value", "low_unit", "high_value", "high_unit",
             "type_code", "type_display", "text"], rows)

        # ---- MedicationRequest, with its dosage as flat columns
        def dose(r):
            d = (r.get("dosageInstruction") or [{}])[0]
            dr = (d.get("doseAndRate") or [{}])[0]
            rep = walk(d, "timing", "repeat") or {}
            return (d.get("text"), qty(dr, "doseQuantity")[0], qty(dr, "doseQuantity")[1],
                    rep.get("frequency"), rep.get("period"), rep.get("periodUnit"),
                    cc(dr, "route")[0])

        counts["medication_request"] = stage(con, "medication_request",
            ["id", "patient_id", "encounter_id", "status", "intent", "priority", "authored_on",
             "medication_type", "medication_code", "medication_text", "dosage_count", "dosage_text",
             "dose_value", "dose_unit", "frequency", "period", "period_unit", "route_code"],
            [[r.get("id"), pid(r), ref(r, "encounter"), r.get("status"), r.get("intent"),
              r.get("priority"), r.get("authoredOn"),
              "CodeableConcept" if r.get("medicationCodeableConcept") else
              ("Reference" if r.get("medicationReference") else None),
              cc(r, "medicationCodeableConcept")[0], cc(r, "medicationCodeableConcept")[1],
              len(r.get("dosageInstruction") or [])] + list(dose(r))
             for r in by_type.get("MedicationRequest", [])])

        # ---- AllergyIntolerance, with reaction as a child table
        counts["allergy_intolerance"] = stage(con, "allergy_intolerance",
            ["id", "patient_id", "clinical_status", "verification_status", "criticality", "type",
             "category", "code", "code_display", "code_system", "recorded_date", "reaction_count"],
            [[r.get("id"), pid(r), walk(r, "clinicalStatus", "coding", 0, "code"),
              walk(r, "verificationStatus", "coding", 0, "code"), r.get("criticality"), r.get("type"),
              walk(r, "category", 0), cc(r, "code")[0], cc(r, "code")[1], cc(r, "code")[2],
              r.get("recordedDate"), len(r.get("reaction") or [])]
             for r in by_type.get("AllergyIntolerance", [])])

        rows = [(r["id"], i, cc(m, "coding", 0)[0] or cc(m)[0], cc(m)[1], rx.get("severity"),
                 rx.get("onset"), rx.get("description"))
                for r in by_type.get("AllergyIntolerance", [])
                for i, rx in enumerate(r.get("reaction") or [])
                for m in (rx.get("manifestation") or [{}])]
        counts["allergy_reaction"] = stage(con, "allergy_reaction",
            ["allergy_id", "ordinal", "manifestation_code", "manifestation_display", "severity",
             "onset", "description"], rows)

        # ---- Procedure
        counts["procedure"] = stage(con, "procedure",
            ["id", "patient_id", "encounter_id", "status", "code", "code_display", "code_system",
             "performed_datetime", "performed_start", "performed_end"],
            [[r.get("id"), pid(r), ref(r, "encounter"), r.get("status"),
              cc(r, "code")[0], cc(r, "code")[1], cc(r, "code")[2], r.get("performedDateTime"),
              walk(r, "performedPeriod", "start"), walk(r, "performedPeriod", "end")]
             for r in by_type.get("Procedure", [])])

        # ---- Immunization
        counts["immunization"] = stage(con, "immunization",
            ["id", "patient_id", "encounter_id", "status", "vaccine_code", "vaccine_display",
             "occurrence_datetime", "lot_number", "site_code", "route_code", "dose_value", "dose_unit"],
            [[r.get("id"), pid(r), ref(r, "encounter"), r.get("status"),
              cc(r, "vaccineCode")[0], cc(r, "vaccineCode")[1], r.get("occurrenceDateTime"),
              r.get("lotNumber"), walk(r, "site", "coding", 0, "code"),
              walk(r, "route", "coding", 0, "code"), qty(r, "doseQuantity")[0], qty(r, "doseQuantity")[1]]
             for r in by_type.get("Immunization", [])])

        # ---- DiagnosticReport, plus the link table to Observation
        counts["diagnostic_report"] = stage(con, "diagnostic_report",
            ["id", "patient_id", "encounter_id", "status", "category", "code", "code_display",
             "effective_datetime", "issued", "conclusion", "result_count"],
            [[r.get("id"), pid(r), ref(r, "encounter"), r.get("status"),
              walk(r, "category", 0, "coding", 0, "code"),
              cc(r, "code")[0], cc(r, "code")[1], r.get("effectiveDateTime"), r.get("issued"),
              r.get("conclusion"), len(r.get("result") or [])]
             for r in by_type.get("DiagnosticReport", [])])

        rows = [(r["id"], i, bare(x.get("reference")))
                for r in by_type.get("DiagnosticReport", []) for i, x in enumerate(r.get("result") or [])]
        counts["diagnostic_report_result"] = stage(con, "diagnostic_report_result",
                                                   ["report_id", "ordinal", "observation_id"], rows)

        # ---- Billing, which $everything also returns
        counts["claim"] = stage(con, "claim",
            ["id", "patient_id", "status", "use", "created", "priority", "total_value",
             "total_currency", "billable_start", "billable_end"],
            [[r.get("id"), pid(r), r.get("status"), r.get("use"), r.get("created"), walk(r, "priority", "coding", 0, "code"),
              qty(r, "total")[0], qty(r, "total")[2], walk(r, "billablePeriod", "start"),
              walk(r, "billablePeriod", "end")] for r in by_type.get("Claim", [])])

        counts["explanation_of_benefit"] = stage(con, "explanation_of_benefit",
            ["id", "patient_id", "status", "use", "created", "outcome", "total_value", "total_currency"],
            [[r.get("id"), pid(r), r.get("status"), r.get("use"), r.get("created"), r.get("outcome"),
              qty(r, "total")[0], qty(r, "total")[2]]
             for r in by_type.get("ExplanationOfBenefit", [])])

        # ---- Care
        counts["care_plan"] = stage(con, "care_plan",
            ["id", "patient_id", "status", "intent", "title", "category", "period_start", "period_end"],
            [[r.get("id"), pid(r), r.get("status"), r.get("intent"), r.get("title"),
              walk(r, "category", 0, "coding", 0, "code"), walk(r, "period", "start"),
              walk(r, "period", "end")] for r in by_type.get("CarePlan", [])])

        counts["goal"] = stage(con, "goal",
            ["id", "patient_id", "lifecycle_status", "achievement_status", "description", "start_date",
             "target_count"],
            [[r.get("id"), pid(r), r.get("lifecycleStatus"),
              walk(r, "achievementStatus", "coding", 0, "code"), cc(r, "description")[1],
              r.get("startDate"), len(r.get("target") or [])]
             for r in by_type.get("Goal", [])])

        counts["_load_manifest"] = stage(con, "_load_manifest", ["table_name", "row_count", "source_types"],
                                         [[k, v, k] for k, v in counts.items()])

        apply_schema(con, SCHEMA)
        con.execute("CHECKPOINT")
    except BaseException:
        try:
            con.close()
        finally:
            for path in (building, building + ".wal"):
                if os.path.exists(path):
                    os.remove(path)
        raise
    con.close()

    # A write-ahead log beside the file holds rows the checkpoint did not fold in. Renaming
    # the database alone would drop them and look like a database that is merely short.
    if os.path.exists(building + ".wal"):
        raise SystemExit(f"{building} left a write-ahead log; not publishing it")
    os.replace(building, db_path)

    for k, v in counts.items():
        print(f"  {k:32s} {v:6d}")
    print(f"\n{db_path}")


# ---- Adding one patient to a record that already exists


def _discard(*paths):
    for path in paths:
        for suffix in ("", ".wal"):
            if os.path.exists(path + suffix):
                os.remove(path + suffix)


def _publish(building, db_path):
    """A write-ahead log beside the file holds rows the checkpoint did not fold in."""
    if os.path.exists(building + ".wal"):
        raise SystemExit(f"{building} left a write-ahead log; not publishing it")
    os.replace(building, db_path)


def _tables_of(con, database=None):
    """The tables in one database on this connection - the attached one, or its own."""
    where = "database_name = ?" if database else "database_name NOT IN ('system', 'temp')"
    return [r[0] for r in con.execute(
        f"SELECT table_name FROM duckdb_tables() WHERE {where}"
        " AND schema_name = 'main' AND NOT internal ORDER BY table_name",
        [database] if database else []).fetchall()]


def _has_patient(db_path, patient_id):
    with duckdb.connect(str(db_path), read_only=True) as con:
        return bool(con.execute("SELECT 1 FROM patient WHERE id = ?", [int(patient_id)]).fetchall())


def _rewrite_manifest(con, tables):
    """Row counts per table, recomputed. Carried forward it would describe the old record."""
    selects = " UNION ALL ".join(
        f"SELECT '{t}' AS table_name, CAST(count(*) AS INTEGER) AS row_count, '{t}' AS source_types"
        f" FROM {_ident(t)}" for t in tables if t != "_load_manifest")
    con.execute(f"CREATE OR REPLACE TABLE {_ident('_load_manifest')} AS {selects}")


class PatientAbsentError(LookupError):
    """The server has no such patient, so there is nothing to add.

    Not the same as a fetch that failed: an empty search is a Bundle with no entries, which
    read as a record would build a database holding nobody and report the add as done.
    """


class IngestUnavailableError(RuntimeError):
    """The record could not be added to - the FHIR server did not answer."""


def add(db_path, patient_id):
    """Fetch one patient and add them to the record, or start a record with them.

    The record is rebuilt and renamed rather than appended to. DuckDB takes one writer and
    every panel opens this file read-only on each request, so an INSERT into the live file
    would contend with the readers. What is already there is carried forward out of the old
    file and only the new patient is fetched, which is what keeps an add at one patient's
    cost however many the record holds.

    A patient already in the record is left alone: the second add is a no-op rather than a
    duplicate, because the list the reader clicked from is the same list this writes to.
    """
    if os.path.exists(db_path) and _has_patient(db_path, patient_id):
        return {"patient_id": str(patient_id), "state": "ready"}

    added = f"{db_path}.added-{uuid4().hex}"
    try:
        main(added, [patient_id])
    except URLError as exc:
        _discard(added)
        raise IngestUnavailableError(patient_id) from exc
    except BaseException:
        _discard(added)
        raise

    with duckdb.connect(added, read_only=True) as con:
        if not con.execute("SELECT 1 FROM patient WHERE id = ?", [int(patient_id)]).fetchall():
            _discard(added)
            raise PatientAbsentError(f"no patient {patient_id!r} on the server")

    if not os.path.exists(db_path):
        os.replace(added, db_path)
        return {"patient_id": str(patient_id), "state": "ready"}

    # Unique per call, not per process: the endpoint runs in a threadpool, so two adds in one
    # server process share a pid - and a `_discard` of the second would delete the first's
    # half-built file underneath it.
    building = f"{db_path}.building-{uuid4().hex}"
    _discard(building)
    con = duckdb.connect(building)
    try:
        con.execute(f"ATTACH '{db_path}' AS before (READ_ONLY)")
        con.execute(f"ATTACH '{added}' AS fetched (READ_ONLY)")
        tables = _tables_of(con, "before")
        # The schema's views are as much a part of it as the tables, and nothing else would
        # rebuild them here: a record that lost them after an add would still answer every
        # panel, which is why it has to be checked rather than assumed.
        views = [r[0] for r in con.execute(
            "SELECT sql FROM duckdb_views() WHERE database_name = 'before'"
            " AND schema_name = 'main' AND NOT internal ORDER BY view_name").fetchall()]
        for table in tables:
            if table == "_load_manifest":
                continue
            con.execute(f"CREATE OR REPLACE TABLE {_ident(table)} AS SELECT * FROM before.{_ident(table)}")
            con.execute(f"INSERT INTO {_ident(table)} BY NAME SELECT * FROM fetched.{_ident(table)}")
        con.execute("DETACH before")
        con.execute("DETACH fetched")
        for definition in views:
            con.execute(definition)
        _rewrite_manifest(con, tables)
        con.execute("CHECKPOINT")
    except BaseException:
        try:
            con.close()
        finally:
            _discard(building, added)
        raise
    con.close()
    _discard(added)

    _publish(building, db_path)
    return {"patient_id": str(patient_id), "state": "ready"}


# ---- The seed a deployment starts from


def _literal(value, data_type):
    """A literal that reads back as its own type. `'1954-10-02'` in a DATE column is a
    VARCHAR, and a seed that quietly retyped every date would rebuild a database that answers
    every panel and holds the wrong types."""
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, float):
        # Not a bare literal: DuckDB reads `0.9390980444579311` as a DECIMAL and converts,
        # which lands one ulp away for 6 of this record's 879 measurements. The string cast
        # is exact - checked against every one of them.
        return f"CAST('{value!r}' AS DOUBLE)"
    if isinstance(value, int):
        return str(value)
    quoted = "'" + str(value).replace("'", "''") + "'"
    for prefix in ("TIMESTAMP", "DATE", "TIME"):
        if data_type.startswith(prefix):
            return f"{prefix} {quoted}"
    return quoted


def dump_sql(db_path, out_path):
    """Write the record out as SQL that rebuilds it, for a deployment with no FHIR server yet.

    Generated from the database this service built, never hand-written. A hand-kept copy of
    the same rows is a second source of truth for them, and the two drift without saying so -
    which is the failure that made the loader build the database itself in the first place.
    Re-run it after any fetch that changes the record.
    """
    with duckdb.connect(str(db_path), read_only=True) as con:
        tables = _tables_of(con)
        lines = [
            "-- Generated by: python3 -m src.ingest_service --dump",
            "-- Do not edit. It is a copy of the database the loader built, and an edit here is",
            "-- a row that no longer matches the FHIR record it came from.",
            "",
        ]
        for table in tables:
            columns = con.execute(
                "SELECT column_name, data_type FROM duckdb_columns()"
                " WHERE table_name = ? AND schema_name = 'main' AND NOT internal"
                " ORDER BY column_index", [table]).fetchall()
            lines.append(f"CREATE TABLE {_ident(table)} ("
                         + ", ".join(f"{_ident(c)} {t}" for c, t in columns) + ");")
            for row in con.execute(f"SELECT * FROM {_ident(table)}").fetchall():
                values = ", ".join(_literal(v, t) for v, (_, t) in zip(row, columns))
                lines.append(f"INSERT INTO {_ident(table)} VALUES ({values});")
            lines.append("")
        for definition in con.execute(
                "SELECT sql FROM duckdb_views() WHERE schema_name = 'main' AND NOT internal"
                " ORDER BY view_name").fetchall():
            lines.append(definition[0] + ";")
            lines.append("")
    Path(out_path).write_text("\n".join(lines) + "\n")
    return Path(out_path)


# The four tables that hold a patient's rows without naming the patient. They reach one
# through a parent, so removing a patient means excluding their rows through that parent -
# and the parent's own rows have to be read before they are gone.
_CHILDREN = {
    "observation_component": ("observation", "observation_id"),
    "observation_reference_range": ("observation", "observation_id"),
    "allergy_reaction": ("allergy_intolerance", "allergy_id"),
    "diagnostic_report_result": ("diagnostic_report", "report_id"),
}


def _keeps_everything_but(table, columns, patient_id):
    """The predicate holding every row of `table` except the patient's."""
    pid = int(patient_id)
    if "patient_id" in columns:
        return f"patient_id <> {pid}"
    if table == "patient":
        return f"id <> {pid}"
    if table in _CHILDREN:
        parent, foreign_key = _CHILDREN[table]
        # Both sides as text: the key and the foreign key are cast independently, and the
        # empty tables (`allergy_reaction`, `observation_reference_range`) inferred VARCHAR
        # where their parents inferred BIGINT.
        return (f"CAST({_ident(foreign_key)} AS VARCHAR) NOT IN"
                f" (SELECT CAST(id AS VARCHAR) FROM before.{_ident(parent)} WHERE patient_id = {pid})")
    # Nothing links this table to a patient, so nothing in it is the patient's to lose.
    return "TRUE"


def remove(db_path, patient_id):
    """Take one patient out of the record and leave the rest as it was.

    Rebuilt and renamed, like an add and for the same reason. Copying is also what makes the
    removal complete: a delete would have to find the patient's rows in four child tables that
    never name them, and a table someone adds later would be missed in silence.
    """
    if not os.path.exists(db_path) or not _has_patient(db_path, patient_id):
        raise PatientAbsentError(f"no patient {patient_id!r} in this record")

    building = f"{db_path}.building-{uuid4().hex}"
    _discard(building)
    con = duckdb.connect(building)
    try:
        con.execute(f"ATTACH '{db_path}' AS before (READ_ONLY)")
        tables = _tables_of(con, "before")
        columns = {table: [r[0] for r in con.execute(
            "SELECT column_name FROM duckdb_columns() WHERE database_name = 'before'"
            " AND schema_name = 'main' AND table_name = ? ORDER BY column_index", [table]).fetchall()]
            for table in tables}
        views = [r[0] for r in con.execute(
            "SELECT sql FROM duckdb_views() WHERE database_name = 'before'"
            " AND schema_name = 'main' AND NOT internal ORDER BY view_name").fetchall()]
        for table in tables:
            if table == "_load_manifest":
                continue
            keep = _keeps_everything_but(table, columns[table], patient_id)
            con.execute(f"CREATE OR REPLACE TABLE {_ident(table)} AS"
                        f" SELECT * FROM before.{_ident(table)} WHERE {keep}")
        con.execute("DETACH before")
        for definition in views:
            con.execute(definition)
        _rewrite_manifest(con, tables)
        con.execute("CHECKPOINT")
    except BaseException:
        try:
            con.close()
        finally:
            _discard(building)
        raise
    con.close()

    _publish(building, db_path)
    return {"patient_id": str(patient_id), "state": "absent"}


SEED = Path(__file__).resolve().parents[1] / "db_data/init.sql"


class EnsureResult:
    ALREADY_THERE = "already there"
    SEEDED = "built from the seed"


class IngestService:
    """The way into the record. Fetching and writing are one act, so they are one service."""

    def add(self, patient_id: str, db_path: str) -> dict:
        return add(db_path, patient_id)

    def remove(self, patient_id: str, db_path: str) -> dict:
        return remove(db_path, patient_id)

    def ensure(self, db_path: str) -> str:
        """Make sure there is a database to serve, and say how it was made.

        From the seed and not from the FHIR server. Having a database from the first second is
        the whole reason the seed exists, and an init that fetched would instead make the page
        unavailable whenever the server was slow or absent - trading a certainty for a
        dependency. Fetching is what the loader and `POST /load/{id}` are for.
        """
        if Path(db_path).exists():
            return EnsureResult.ALREADY_THERE
        seed_from_file(db_path, str(SEED))
        return EnsureResult.SEEDED

    def build(self, db_path: str, patient_ids=None) -> None:
        main(db_path, patient_ids or PIDS)

    def seed(self, db_path: str, out_path: str):
        return dump_sql(db_path, out_path)


ingest_service = IngestService()


def seed_from_file(db_path, seed_path):
    """Give a deployment a record to serve without a FHIR server to fetch one from.

    Only when there is nothing there. An existing record is left alone, whatever it holds -
    a seed that overwrote a fetched record would be the stale-database failure again, with
    the sign flipped.
    """
    if os.path.exists(db_path):
        return False
    with duckdb.connect(db_path) as con:
        con.execute(Path(seed_path).read_text())
    return True


def run(argv):
    """The command line, in one place.

    `db_data/fhir_sample_load.py` calls this too, rather than forwarding an argument of its
    own: it used to pass `argv[1]` straight to `main()` as a database path, so a flag reached
    it as a filename and it built the whole sample into a file called `--seed`. One dispatch
    means a flag added here works from both, and neither can drift from the other.
    """
    if argv and argv[0].startswith("-"):
        if argv[0] == "--seed" and len(argv) >= 3:
            built = seed_from_file(argv[1], argv[2])
            print("seeded" if built else "already has a record; left alone")
        elif argv[0] == "--dump" and len(argv) >= 3:
            print(dump_sql(argv[1], argv[2]))
        else:
            raise SystemExit(
                f"unknown option {argv[0]!r}\n"
                "usage: fhir_sample_load.py [database]"
                " | --seed <database> <init.sql> | --dump <database> <out.sql>")
    else:
        main(argv[0] if argv else "fhir_sample.duckdb")


if __name__ == "__main__":
    run(sys.argv[1:])
