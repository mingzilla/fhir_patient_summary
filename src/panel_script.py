"""Turn a verified panel CLI script into a query the dashboard can serve.

The seven panels in `src/sql/` are the
verified artefact this dashboard rests on, so they are read at request time and converted
here. Copying their SQL into Python would leave the served query and the verified query as
two different queries, and the one on the dashboard would be the one nobody verified.

A panel is written for the DuckDB CLI, so three CLI-only things must not survive conversion:

- The `.mode` and `.headers` meta-commands. They are meaningless to the Python client, and
  dropping them is what makes the result a JSON array rather than a rendered table.
- The trailing footer block. `03_medications.sql` uses one to print a sentence when no
  medication repeats, which makes that panel emit two result blocks for some patients and
  one for others: patient 1643 parses, patient 12069 raises `Extra data`. The sentence is
  derivable from the `Course` column the panel already returns, so the client derives it.
- The literal in `SET VARIABLE pid = <n>`, which becomes a bound parameter. That line is the
  only patient-specific thing in a panel, and it is what lets one script serve every patient.

A panel is also preceded by a block of `--` comments, which the CLI ignores and DuckDB's
Python client accepts. Those comments carry the panel's reasoning, so they are kept with the
statement they explain rather than dropped with the meta-commands.
"""

import re
from dataclasses import dataclass

_META_COMMAND = "."
_COMMENT = "--"
_PID_LINE = re.compile(r"^\s*SET\s+VARIABLE\s+pid\s*=\s*[^;]+;\s*$", re.IGNORECASE | re.MULTILINE)
_PID_BINDING = "SET VARIABLE pid = ?;"

# A `SET VARIABLE <name> = <literal>;` line, split so the literal can be swapped for another.
_VARIABLE_LINE = re.compile(
    r"^(?P<lead>[ \t]*SET[ \t]+VARIABLE[ \t]+(?P<name>\w+)[ \t]*=[ \t]*)(?P<value>[^;\n]*)(?P<tail>;)",
    re.IGNORECASE | re.MULTILINE,
)


def _as_integer(value) -> str:
    """Render a value for the query, or refuse it.

    The only way a caller's number reaches a statement that is not parameterised. `bool` is an
    `int` in Python and `True` would render as a bare `True`, which is not a number DuckDB
    wants, so it is refused with everything else that is not an integer.
    """
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{value!r} is not an integer")
    return str(value)


@dataclass(frozen=True)
class PanelQuery:
    """A panel runs as two statements: the pid binding, then the panel itself.

    DuckDB refuses prepared parameters in anything but the last statement, so the binding
    cannot ride along with the panel in one call.
    """

    binding: str
    statement: str
    parameters: list


class PanelScript:

    @staticmethod
    def to_query(script_text: str, patient_id: int) -> PanelQuery:
        block = PanelScript._query__take_first_block(script_text)
        return PanelQuery(binding=_PID_BINDING,
                          statement=PanelScript._query__without_pid_line(block),
                          parameters=[patient_id])

    @staticmethod
    def to_statement_with_variables(script_text: str, values: dict) -> str:
        """Substitute caller values into a script's own `SET VARIABLE` lines.

        A script that names no patient cannot bind its inputs as parameters the way a panel
        binds `pid`, because DuckDB allows a prepared parameter only in the last statement and
        these lines come before it. So the values go in as literals - validated as integers
        here, so nothing but a number can reach the query.

        `00_patient_list.sql` uses this for its paging. It still runs unchanged in the DuckDB
        CLI, where the literals it ships with are the defaults.
        """
        statement = PanelScript._query__take_first_block(script_text)
        named = {match.group("name").lower() for match in _VARIABLE_LINE.finditer(statement)}
        unclaimed = set(values) - named
        if unclaimed:
            raise ValueError(f"the script has no {sorted(unclaimed)} variable")

        def substitute(match):
            name = match.group("name").lower()
            if name not in values:
                raise ValueError(f"no value given for the script's {name!r} variable")
            return f"{match.group('lead')}{_as_integer(values[name])}{match.group('tail')}"

        return _VARIABLE_LINE.sub(substitute, statement)

    @staticmethod
    def _query__take_first_block(script_text: str) -> str:
        blocks = PanelScript._query__blocks(script_text)
        for index, block in enumerate(blocks):
            if any(PanelScript._query__is_statement(line) for line in block):
                return "\n".join(line for part in blocks[:index + 1] for line in part)
        raise ValueError("a panel needs a statement, found none")

    @staticmethod
    def _query__blocks(script_text: str) -> list[list[str]]:
        blocks, current = [], []
        for line in script_text.splitlines():
            if line.startswith(_META_COMMAND):
                blocks.append(current)
                current = []
                continue
            current.append(line)
        blocks.append(current)
        return blocks

    @staticmethod
    def _query__is_statement(line: str) -> bool:
        stripped = line.strip()
        return bool(stripped) and not stripped.startswith(_COMMENT)

    @staticmethod
    def _query__without_pid_line(sql: str) -> str:
        stripped, substitutions = _PID_LINE.subn("", sql)
        if substitutions != 1:
            raise ValueError(f"a panel needs exactly one pid line, found {substitutions}")
        return stripped
