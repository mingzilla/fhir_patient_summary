"""The search cache. A name lookup, held for the mirror's fifteen minutes.

Redis rather than a dict in this process, because a cache that dies with the process sends
every clinician back to the FHIR server for the same prefix after every redeploy.
"""

import json
import os

from redis.asyncio import Redis

SEARCH_TTL_SECONDS = 900

# Below this a prefix matches most of the roster, so the entry would hold one cached page
# of patients for a query nobody refined. The client already refuses to search under three
# characters; this is the server declining to *keep* it.
MIN_CACHED_QUERY_LENGTH = 3


class SearchCacheManager:
    """Candidate lists, keyed by the query that produced them.

    There is no change probe in front of this: a search has no stamp to compare, so **the
    TTL is the freshness bound here**. That is sound only because the value is a first page
    of name matches and not a clinical record - a name that changed within fifteen minutes
    is answered from the server on the next distinct query.
    """

    def __init__(self) -> None:
        self.redis = Redis.from_url(
            os.environ.get("REDIS_URL", "redis://localhost:6379"), decode_responses=True
        )

    @staticmethod
    def normalise(query: str) -> str:
        """Whitespace-collapsed and lowercased, so ` Smith ` and `smith` are one entry."""
        return " ".join(query.split()).lower()

    @classmethod
    def query_key(cls, query: str) -> str:
        return f"search:{cls.normalise(query)}"

    @classmethod
    def cacheable(cls, query: str) -> bool:
        return len(cls.normalise(query)) >= MIN_CACHED_QUERY_LENGTH

    async def get(self, query: str) -> list[dict] | None:
        if not self.cacheable(query):
            return None
        raw = await self.redis.get(self.query_key(query))
        return None if raw is None else json.loads(raw)

    async def put(self, query: str, candidates: list[dict]) -> None:
        if not self.cacheable(query):
            return
        await self.redis.setex(self.query_key(query), SEARCH_TTL_SECONDS, json.dumps(candidates))


search_cache_manager = SearchCacheManager()
