"""The pure cores: one search row, the Bundle guard, and what the cache will keep."""

import pytest

from src.search_cache_manager import SearchCacheManager
from src.search_service import SearchService


class TestToCandidate:

    def test_names_the_patient_the_way_the_list_shows_them(self):
        patient = {
            "id": "1643",
            "name": [{"given": ["Aldo", "J"], "family": "Pulido"}],
            "birthDate": "1965-12-01",
            "gender": "male",
        }

        assert SearchService.to_candidate(patient) == {
            "id": "1643",
            "name": "Aldo J Pulido",
            "birth_date": "1965-12-01",
            "gender": "male",
        }

    def test_survives_an_explicit_null_family_name(self):
        """`.get("family", "")` defaults only when the key is absent, and FHIR writes nulls."""
        patient = {"id": "7", "name": [{"given": ["Ada"], "family": None}]}

        assert SearchService.to_candidate(patient)["name"] == "Ada"

    @pytest.mark.parametrize("patient", [{"id": "7"}, {"id": "7", "name": []}, {"id": "7", "name": [None]}])
    def test_survives_having_no_name_at_all(self, patient):
        assert SearchService.to_candidate(patient)["name"] == ""

    def test_leaves_a_missing_birth_date_as_null_rather_than_a_string(self):
        assert SearchService.to_candidate({"id": "7"})["birth_date"] is None


class TestRequireBundle:

    def test_passes_a_bundle_through(self):
        bundle = {"resourceType": "Bundle", "entry": []}

        assert SearchService.require_bundle(bundle, "a search") is bundle

    def test_refuses_an_operation_outcome_however_it_arrived(self):
        """HAPI answers an invalid search with HTTP 200 and this, so the status said fine."""
        with pytest.raises(ValueError):
            SearchService.require_bundle({"resourceType": "OperationOutcome"}, "a search")


class TestUrlOf:

    @pytest.mark.parametrize(
        "base,path",
        [
            ("http://fhir:8080/fhir", "/Patient"),
            ("http://fhir:8080/fhir/", "/Patient"),
            ("http://fhir:8080/fhir", "Patient"),
        ],
    )
    def test_joins_without_doubling_or_dropping_the_slash(self, base, path):
        assert SearchService.url_of(base, path) == "http://fhir:8080/fhir/Patient"


class TestSearchCacheKey:

    @pytest.mark.parametrize("query", ["Smith", " smith ", "SMITH", "smi  th"])
    def test_one_key_per_question_a_person_means(self, query):
        expected = "search:smi th" if query == "smi  th" else "search:smith"

        assert SearchCacheManager.query_key(query) == expected

    @pytest.mark.parametrize("query", ["", "s", "sm", "  s  "])
    def test_declines_to_keep_a_query_nobody_refined(self, query):
        assert not SearchCacheManager.cacheable(query)

    @pytest.mark.parametrize("query", ["smi", "smith"])
    def test_keeps_a_query_long_enough_to_narrow(self, query):
        assert SearchCacheManager.cacheable(query)
