"""Patient search: a name query against the FHIR server, answered from the cache when warm.

Only the search half of the old client is here. `fetch_record` - one search per type, with
the pagination walk - is not, because nothing in this build reads a whole record yet.

The base URL comes from `FHIR_BASE_URL`, which under compose names the service `fhir`. The
default is for running bare on the host, where the server really is on localhost; inside a
container localhost is the app itself.
"""

import asyncio
import logging
import os

import aiohttp
from redis.exceptions import RedisError

from src.search_cache_manager import search_cache_manager

logger = logging.getLogger(__name__)

RETRY_ATTEMPTS = 4
RETRY_BASE_DELAY = 0.5
REQUEST_TIMEOUT = 60.0
SEARCH_LIMIT = 20

# The client refuses to search under three characters, so this is the server declining to
# ask a question the cache will not keep the answer to.
SEARCH_MINIMUM = 3


class SearchUnavailableError(RuntimeError):
    """The search could not be answered. Not the same as "nobody matched".

    An empty candidate list means *nobody matched*, and the whole point of search here is
    narrowing - so empty-to-mean-the-server-did-not-answer would be a lie the reader cannot
    detect, and the one answer this must never invent. The route answers this one 503 and
    lets the empty array keep its single meaning.
    """


class SearchService:

    def __init__(self) -> None:
        self.base_url = os.environ.get(
            "FHIR_BASE_URL", "http://localhost:8080/hapi-fhir-jpaserver/fhir"
        )
        self.search_cache = search_cache_manager

    async def search(self, query: str) -> list[dict]:
        """Candidates for a name query. First page only, and `next` is never followed.

        A search answers the current query or says "narrow it" - following links would page
        a roster, not a name. That is also what makes it cacheable: the stored value is one
        page for one query, never a page of a larger walk.
        """
        if len(query) < SEARCH_MINIMUM:
            return []
        cached = await self._cached(query)
        if cached is not None:
            return cached

        try:
            async with self._session() as session:
                bundle = await self._get_json(
                    session, self.url("Patient"), params={"name": query, "_count": SEARCH_LIMIT}
                )
            bundle = self.require_bundle(bundle, f"search for {query!r}")
            candidates = [self.to_candidate(e["resource"]) for e in bundle.get("entry", [])]
        except (aiohttp.ClientError, TimeoutError, ValueError) as exc:
            raise SearchUnavailableError(query) from exc
        await self._remember(query, candidates)
        return candidates

    async def _cached(self, query: str) -> list[dict] | None:
        """A cache that is down is a cache miss, not a search that failed."""
        try:
            return await self.search_cache.get(query)
        except RedisError:
            logger.warning("search cache unreachable: %r answered from the server", query)
            return None

    async def _remember(self, query: str, candidates: list[dict]) -> None:
        """The answer is already in hand, so a cache that will not take it costs nothing."""
        try:
            await self.search_cache.put(query, candidates)
        except RedisError:
            logger.warning("search cache unreachable: %r not kept", query)

    @staticmethod
    def url_of(base_url: str, path: str) -> str:
        return f"{base_url.rstrip('/')}/{path.lstrip('/')}"

    def url(self, path: str) -> str:
        return self.url_of(self.base_url, path)

    def _session(self) -> aiohttp.ClientSession:
        return aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT))

    async def _get_json(self, session: aiohttp.ClientSession, url: str, params: dict | None = None) -> dict:
        """Retry on 5xx and on a transport failure, never on a 4xx.

        A retry that only covered a dropped connection would not cover the failure that
        actually happens: HAPI answered a request with HTTP 500 twice and then succeeded on
        six consecutive attempts. A 4xx is our request being wrong, and repeating it changes
        nothing.
        """
        delay = RETRY_BASE_DELAY
        failure: Exception = RuntimeError(f"no attempt made for {url}")
        for attempt in range(RETRY_ATTEMPTS):
            try:
                async with session.get(url, params=params) as response:
                    if response.status < 500:
                        response.raise_for_status()
                        return await response.json(content_type=None)
                    failure = aiohttp.ClientResponseError(
                        response.request_info,
                        response.history,
                        status=response.status,
                        message=f"HTTP {response.status} for {response.url}",
                    )
            except aiohttp.ClientConnectionError as exc:
                failure = exc
            if attempt + 1 < RETRY_ATTEMPTS:
                await asyncio.sleep(delay)
                delay *= 2
        raise failure

    @staticmethod
    def require_bundle(reply: dict, context: str) -> dict:
        """A search reply that is not a Bundle is a failure, not an empty result.

        HAPI answers an invalid search with **HTTP 200 and an OperationOutcome**, not a 4xx,
        so a status check cannot see it. Every caller reads a Bundle by its shape -
        `.get("entry", [])` - which turns an OperationOutcome into a confident "nobody
        matched", the one answer this must never invent. Raising is the safe direction: the
        reader gets a 503 that says the search did not run, rather than an empty list that
        says nobody by that name exists.
        """
        if reply.get("resourceType") != "Bundle":
            raise ValueError(f"{context}: expected a Bundle, got {reply.get('resourceType')!r}")
        return reply

    @staticmethod
    def to_candidate(patient: dict) -> dict:
        """One search row.

        `or []` and `or ""`, not the default argument: `.get("family", "")` only defaults
        when the key is **absent**, and FHIR writes explicit nulls freely. A patient with
        `"family": null` raises `TypeError` out of `join` and takes the whole search down
        with a 500. No patient in this sample carries one - all 629 were checked - so it is
        a latent defect rather than a live one, and it stays latent only until a record has
        a null name field.
        """
        names = patient.get("name") or [{}]
        name = names[0] or {}
        return {
            "id": patient.get("id", ""),
            "name": " ".join([*(name.get("given") or []), name.get("family") or ""]).strip(),
            "birth_date": patient.get("birthDate"),
            "gender": patient.get("gender"),
        }


search_service = SearchService()
