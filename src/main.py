"""The dashboard API. Seven panel routes, one search route, and the health check.

Each panel route returns the rows of one panel, exactly as that panel prints them, so the
frontend can be built against the contract in `data_analysis/stage_06__dashboard/` without
waiting on this code.

Search is the one route that is not a panel. It answers from the FHIR server and not from the
database, because the database holds only the patients already loaded into it. That splits one
question in two, and the wire keeps them apart: `[]` means nobody matched, and a search that
did not run is a 503. An empty list never has to mean both, which is what lets the client tell
"no such patient" from "the server did not answer".

The panels answer different questions and their rows have different shapes - `patient` is a
single scalar strip, `key_measures` carries a `Change` sentence no chart can plot,
`record_mix` is a twelve-row table - so the client decides how each one is drawn.

A panel with no rows is `200 []` and not a 404. `Allergies (0)` is a finding.

The dashboard UI is `static/`, mounted at the root of this same app so one process serves the
page and the JSON it reads. The mount is registered after the routes above, so `/dashboard/...`
and `/healthz` keep their own paths and everything else falls through to the shell.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool

from src.dashboard_service import _DATABASE, PatientNotFound, dashboard_service
from src.ingest_service import IngestUnavailableError, PatientAbsentError, ingest_service
from src.search_service import SearchUnavailableError, search_service

logger = logging.getLogger(__name__)

_STATIC_DIR = Path(__file__).resolve().parents[1] / "static"


class RevalidatingStaticFiles(StaticFiles):
    """Static files the browser has to ask about before it reuses them.

    Without a `Cache-Control` header a browser is free to reuse a cached asset **without
    asking**, on a heuristic freshness lifetime derived from the file's age. That is how a page
    ends up running yesterday's JavaScript beside today's HTML: the reader sees the new page
    behaving the old way, and nothing on screen says which half is stale. It happened here - a
    patient added to the record showed a tick and no row, which is what the code did back when
    the ids were hardcoded, and a reload did not clear it.

    `no-cache` does not mean "do not cache". It means "ask first", and the answer is still a
    cheap `304` while the file is unchanged.
    """

    def file_response(self, *args, **kwargs):
        response = super().file_response(*args, **kwargs)
        response.headers["cache-control"] = "no-cache"
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Build the database if there is not one.

    Every panel opens it read-only, so an absent file is a 500 on every route and the page is
    blank with no way to tell why. One ingest at startup turns that into a dashboard, and the
    fetch is the same one `POST /load/{id}` runs - the whole sample rather than one patient.
    """
    how = await run_in_threadpool(ingest_service.ensure, str(_DATABASE))
    logger.warning("database %s: %s", _DATABASE, how)
    yield


app = FastAPI(title="fhir patient summary dashboard", lifespan=lifespan)


@app.exception_handler(PatientNotFound)
def _patient_not_found(request: Request, error: PatientNotFound) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": str(error)})


@app.exception_handler(SearchUnavailableError)
def _search_unavailable(request: Request, error: SearchUnavailableError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": "search is unavailable"})


@app.exception_handler(PatientAbsentError)
def _patient_absent(request: Request, error: PatientAbsentError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": str(error)})


@app.exception_handler(IngestUnavailableError)
def _ingest_unavailable(request: Request, error: IngestUnavailableError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": "the FHIR server is unavailable"})


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}


@app.get("/dashboard/patients")
def patients(
    limit: int = Query(default=0, ge=0),
    offset: int = Query(default=0, ge=0),
) -> list[dict]:
    """The list, in the same row shape as `/dashboard/{id}/patient`.

    `limit=0` is no limit - the whole record. A negative limit or offset is a 422 rather than
    a silently clamped query: the caller asked for something that has no meaning, and the two
    likely readings of `limit=-1` are "everything" and "nothing".
    """
    return dashboard_service.patients(limit=limit, offset=offset)


@app.get("/dashboard/{patient_id}/patient")
def patient(patient_id: str) -> list[dict]:
    return dashboard_service.patient(patient_id)


@app.get("/dashboard/{patient_id}/problems")
def problems(patient_id: str) -> list[dict]:
    return dashboard_service.problems(patient_id)


@app.get("/dashboard/{patient_id}/medications")
def medications(patient_id: str) -> list[dict]:
    return dashboard_service.medications(patient_id)


@app.get("/dashboard/{patient_id}/key_measures")
def key_measures(patient_id: str) -> list[dict]:
    return dashboard_service.key_measures(patient_id)


@app.get("/dashboard/{patient_id}/allergies")
def allergies(patient_id: str) -> list[dict]:
    return dashboard_service.allergies(patient_id)


@app.get("/dashboard/{patient_id}/visits")
def visits(patient_id: str) -> list[dict]:
    return dashboard_service.visits(patient_id)


@app.get("/dashboard/{patient_id}/record_mix")
def record_mix(patient_id: str) -> list[dict]:
    return dashboard_service.record_mix(patient_id)


@app.get("/search")
async def search(q: str = "") -> list[dict]:
    return await search_service.search(q.strip())


@app.post("/load/{patient_id}")
async def load(patient_id: str) -> dict:
    """Add one patient to the record. The client appends them to the list when this returns."""
    return await run_in_threadpool(ingest_service.add, patient_id, str(_DATABASE))


@app.delete("/load/{patient_id}")
async def unload(patient_id: str) -> dict:
    """Take one patient out, leaving the others as they were. The client drops their row."""
    return await run_in_threadpool(ingest_service.remove, patient_id, str(_DATABASE))


app.mount("/", RevalidatingStaticFiles(directory=_STATIC_DIR, html=True), name="dashboard_ui")
