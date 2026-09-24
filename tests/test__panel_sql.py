"""The panels are served from `src/sql/` and verified in the analysis tree.

Two copies exist for one reason: the runtime must not reach into `data_analysis/`, which is named
for the process that produced it. That folder has been renumbered twice, and both times the app
that read it stopped answering - the panels are runtime, and their path should not move because
the analysis was renumbered.

Two copies can drift, so this compares them rather than trusting them. The analysis copy is the
one the reports were verified against, so if they disagree, the served one is wrong.
"""

from pathlib import Path

import pytest

_REPO_ROOT = Path(__file__).resolve().parents[1]
_SERVED = _REPO_ROOT / "src/sql"
_ANALYSED = _REPO_ROOT / "data_analysis/stage_05__text_report_refine"

pytestmark = pytest.mark.skipif(
    not _ANALYSED.is_dir(),
    reason="the analysis tree is not in this checkout, so there is nothing to compare against")


def analysed_panels() -> dict[str, str]:
    """The verified panels: the seven per-patient ones, and the list that sits above them."""
    scripts = sorted((_ANALYSED / "D__synthesis_01").glob("*.sql"))
    scripts.append(_ANALYSED / "00_patient_list.sql")
    return {script.name: script.read_text() for script in scripts}


class TestServedPanels:

    def test_the_same_panels_are_served_as_were_verified(self):
        assert sorted(p.name for p in _SERVED.glob("*.sql")) == sorted(analysed_panels())

    def test_no_served_panel_has_drifted_from_the_verified_one(self):
        served = {p.name: p.read_text() for p in _SERVED.glob("*.sql")}
        drifted = sorted(name for name, text in analysed_panels().items() if served[name] != text)

        assert not drifted, (
            f"served copy differs from the verified panel: {drifted}. "
            f"Copy {_ANALYSED} over {_SERVED} if the analysis change was the intended one.")
