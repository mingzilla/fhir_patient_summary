"""Panel 0 against panel 1: the list must agree with the strip, row for row.

These read the sample database, so they skip when it is not built rather than fail. The
invariant they hold is the one that makes the list safe to serve at all - a list row that
disagreed with the strip would put two different ages for one patient on one page.
"""

import pytest

from src.dashboard_service import _DATABASE, dashboard_service

pytestmark = pytest.mark.skipif(
    not _DATABASE.exists(), reason=f"the sample database is not built at {_DATABASE}")


@pytest.fixture(scope="module")
def listed():
    return dashboard_service.patients(limit=0)


# What the sample database is built with. Not a total: the record grows when a reader adds a
# patient, and a test that pinned the count would fail on the feature working. This asserts
# the seven are still there, so a *lost* patient fails while an added one does not.
BUILT_WITH = {"1", "181", "821", "1390", "1643", "12069", "87788"}


class TestTheListAgreesWithTheStrip:

    def test_the_record_still_holds_every_patient_it_was_built_with(self, listed):
        assert BUILT_WITH.issubset({row["Source"] for row in listed})

    def test_the_list_is_in_id_order(self, listed):
        # New patients are appended, and the route orders by id, so a list that came back in
        # insertion order would mean the ORDER BY had gone.
        assert [row["Source"] for row in listed] == sorted(
            (row["Source"] for row in listed), key=int)

    def test_every_column_the_strip_prints_agrees_with_it(self, listed):
        # The list carries one column the strip does not - the given name - so this compares on
        # the strip's columns rather than on the whole row. Every one of those must still agree:
        # a list row and the header of the open patient are two answers to one question, and two
        # different ages for one patient on one page is the failure this holds off.
        for row in listed:
            strip = dashboard_service.patient(row["Source"])[0]
            assert {column: row[column] for column in strip} == strip, row["Source"]

    def test_the_row_carries_the_strips_columns_and_the_given_name(self, listed):
        assert list(listed[0]) == ["Patient", "Given", "Sex", "Age", "Born", "Died",
                                   "First seen", "As of", "Clinical events", "Source"]

    def test_every_patient_has_a_given_name(self, listed):
        # `patient.name_given` is null for every row - the loader never fills it - so the list
        # reads `patient_name` instead. This is the check that the join found them.
        for row in listed:
            assert row["Given"], f'{row["Patient"]} ({row["Source"]}) has no given name'

    def test_a_patient_with_two_names_appears_once(self, listed):
        # Id 197832 carries an `official` name and a `maiden` one. Without preferring
        # `official`, the join would return her twice and the list would show her twice.
        sources = [row["Source"] for row in listed]
        assert len(sources) == len(set(sources))

    def test_a_living_patient_says_living_and_a_dead_one_says_a_date(self, listed):
        # `Died` is a string either way, which is what stops a null check from being the
        # thing that tells them apart.
        for row in listed:
            assert row["Died"] == "living" or row["Died"][:2] == "20"


class TestLimitAndOffset:

    def test_limit_zero_is_no_limit(self, listed):
        assert len(listed) == len(dashboard_service.patients(limit=0, offset=0))

    def test_a_limit_takes_that_many_from_the_front(self):
        assert len(dashboard_service.patients(limit=3)) == 3

    def test_an_offset_skips_without_repeating_or_dropping(self, listed):
        # Walking the record in pages must visit every patient exactly once. This is the
        # property pagination exists for and the one an off-by-one breaks.
        walked = []
        for offset in range(0, len(listed), 2):
            walked.extend(row["Source"] for row in dashboard_service.patients(limit=2, offset=offset))

        assert walked == [row["Source"] for row in listed]

    def test_an_offset_past_the_end_is_no_rows_rather_than_an_error(self):
        assert dashboard_service.patients(limit=2, offset=999) == []
