"""The pure cores: parsing an id, normalising a value, turning a panel into a statement."""

import datetime
from decimal import Decimal

import pytest

from src.dashboard_service import DashboardService
from src.panel_script import PanelScript

SCRIPT = """\
-- a leading comment block
.mode markdown
SET VARIABLE pid = 1643;
SELECT a FROM t WHERE patient_id = getvariable('pid');

-- a footer, printed only when the table above is empty
.mode list
.headers off
SELECT 'nothing here' WHERE NOT EXISTS (SELECT 1 FROM t);
"""


class TestParsePatientId:

    def test_parses_a_numeric_string(self):
        assert DashboardService.parse_patient_id("12069") == 12069

    @pytest.mark.parametrize("raw", ["", "abc", "12.5", "-1", "1; DROP TABLE patient"])
    def test_refuses_anything_that_is_not_a_run_of_digits(self, raw):
        assert DashboardService.parse_patient_id(raw) is None


class TestNormaliseValue:

    def test_writes_a_date_as_the_cli_writes_it(self):
        assert DashboardService.normalise_value(datetime.date(1934, 10, 17)) == "1934-10-17"

    def test_writes_a_datetime_as_the_cli_writes_it(self):
        value = datetime.datetime(2005, 5, 23, 20, 8, 38)

        assert DashboardService.normalise_value(value) == "2005-05-23 20:08:38"

    def test_keeps_a_decimals_trailing_zero(self):
        assert DashboardService.normalise_value(Decimal("23.50")) == "23.50"

    @pytest.mark.parametrize("value", [1, 23.54, "active", True, None])
    def test_passes_what_json_already_holds_through_unchanged(self, value):
        assert DashboardService.normalise_value(value) == value


class TestToQuery:

    def test_binds_the_pid_instead_of_writing_it_into_the_statement(self):
        query = PanelScript.to_query(SCRIPT, 12069)

        assert query.parameters == [12069]
        assert "getvariable('pid')" in query.statement

    def test_drops_the_meta_commands(self):
        assert ".mode" not in PanelScript.to_query(SCRIPT, 1643).statement

    def test_drops_the_footer_block(self):
        query = PanelScript.to_query(SCRIPT, 1643)

        assert "nothing here" not in query.statement
        assert query.statement.count("SELECT") == 1

    def test_keeps_the_leading_comment_with_its_statement(self):
        assert PanelScript.to_query(SCRIPT, 1643).statement.startswith("-- a leading comment")

    def test_refuses_a_script_with_no_pid_line(self):
        with pytest.raises(ValueError):
            PanelScript.to_query("SELECT 1;", 1643)


LIST_SCRIPT = """\
-- the list, which names no patient
.mode markdown
SET VARIABLE lim = 0;
SET VARIABLE off = 0;
SELECT a FROM t LIMIT nullif(getvariable('lim'), 0) OFFSET getvariable('off');
"""


class TestToStatementWithVariables:
    """The list names no patient, so its inputs go in as literals rather than as parameters.

    A prepared parameter is allowed only in the last statement, and a `SET VARIABLE` line is
    not the last - which is why a panel binds its `pid` in a separate call and this does not
    bind at all.
    """

    def test_keeps_the_statement_and_drops_the_meta_commands(self):
        statement = PanelScript.to_statement_with_variables(
            LIST_SCRIPT, {"lim": 0, "off": 0})

        assert ".mode" not in statement
        assert "getvariable('lim')" in statement

    def test_keeps_the_leading_comment_with_its_statement(self):
        statement = PanelScript.to_statement_with_variables(LIST_SCRIPT, {"lim": 5, "off": 2})

        assert statement.startswith("-- the list")

    def test_substitutes_what_the_caller_asked_for(self):
        statement = PanelScript.to_statement_with_variables(LIST_SCRIPT, {"lim": 5, "off": 20})

        assert "SET VARIABLE lim = 5;" in statement
        assert "SET VARIABLE off = 20;" in statement
        assert "SET VARIABLE lim = 0;" not in statement

    def test_the_shipped_literals_are_the_defaults(self):
        # The file runs by hand in the DuckDB CLI with what it ships with, so those literals
        # have to mean the same as calling the route with no arguments.
        assert "SET VARIABLE lim = 0;" in LIST_SCRIPT

    def test_refuses_a_value_for_a_variable_the_script_does_not_have(self):
        # Otherwise a caller's typo is silently ignored and the query runs with a default.
        with pytest.raises(ValueError):
            PanelScript.to_statement_with_variables(LIST_SCRIPT, {"lim": 1, "offset": 2})

    def test_refuses_to_leave_a_variable_without_a_value(self):
        with pytest.raises(ValueError):
            PanelScript.to_statement_with_variables(LIST_SCRIPT, {"lim": 1})

    @pytest.mark.parametrize("value", ["1; DROP TABLE patient", 1.5, True, None, "5"])
    def test_refuses_anything_that_is_not_an_integer(self, value):
        # The only way a caller's value reaches a statement that is not parameterised, so it
        # is the only place an injection could get in.
        with pytest.raises(ValueError):
            PanelScript.to_statement_with_variables(LIST_SCRIPT, {"lim": value, "off": 0})
