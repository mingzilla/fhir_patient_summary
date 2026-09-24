# 02 — Search, backend

**Decision.** Search is lifted from `_previous/src__old/services/fhir_service.py`, as the search
half only.

| Piece | Where | What |
|---|---|---|
| The FHIR question | `src/search_service.py` | one name query, first page, cached |
| The cache | `src/search_cache_manager.py` | 15 minutes, keyed by the query |
| The route | `src/main.py` | `GET /search?q=` |
| **Not carried** | — | `fetch_record` and its pagination walk: nothing in this build reads a whole record |

**Why the cache is its own file.** Callers only ever say *get this query* and *keep this answer*;
the key normalisation, the three-character floor and the TTL are invariants they never read. That
is `rule__python__api_service_split.md`'s test for a `<thing>_manager.py`, and why `SearchCacheDao`
was already its own file.

## Deviation — the cache is best-effort

| | |
|---|---|
| **Old behaviour** | both cache calls sat outside the guard, so a Redis outage answered a search with a bare `500` - neither the candidates nor the named `503` that `SearchUnavailableError` exists to produce |
| **How that was found** | measured, not reasoned: the compose stack was down, Redis was refused, and the endpoint returned `500` for a real query and its repeat |
| **Now** | a Redis failure is a cache miss. The search goes to the server, and the miss is logged: `search cache unreachable: 'smi' answered from the server` |
| **Why `put` is guarded too** | an answer already in hand must not be discarded because the cache would not take it |

**The cost.** A dead cache is quieter than a dead server: the response is identical either way, so
the log is the only signal.

## What search is not

| | |
|---|---|
| **Not the database** | the database holds only the patients already loaded, and search has to be able to name one who is not - that is what makes them addable |
| **Not the roster** | candidates come from FHIR, the list on the left comes from the database, and the client joins them by `id` - never by name |
| **Never an empty list for a failure** | `[]` is *nobody matched*; `503` is *the search did not run*. HAPI answers a malformed search with `200` and an `OperationOutcome`, which read as a Bundle looks identical to nobody matching |

## What came after

| Endpoint | State |
|---|---|
| `GET /dashboard/patients` | the roster, derived from `patient` and `patient_name` - no new store |
| `POST /load/{id}` | the `[+]`: one patient fetched, the database rebuilt around them, renamed over |
| `DELETE /load/{id}` | the mirror: rebuilt without them |
| `GET /search?q=` | unchanged from the decision above |

Search and add are the two that fetch. Everything else reads the database.

## Staleness — decided, for a testing build: nothing refreshes

| | |
|---|---|
| **A loaded patient** | a snapshot of the moment they were fetched. Adding another carries them forward unchanged |
| **Re-adding** | answers `ready` without asking the server, so no path picks up a change |
| **The consequence** | the database can hold rows older than the server's and render perfectly |
| **Accepted because** | it is a fixture, not a live view |
| **The only refresh** | a full rebuild, which refetches every patient in `PIDS` |
| **Why not per-patient** | a real build, not a flag: four child tables carry no `patient_id` and must be reached through their parents |
