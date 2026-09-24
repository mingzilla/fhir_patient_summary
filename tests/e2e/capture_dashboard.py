"""Render the dashboard in a real browser and write what it looks like to `_docs/screenshots`.

Not a test - a look. The chart layer is verified by opening the page, because a wrong axis, a
clipped label or a chart initialised against a zero-width container all pass a unit test and
are obvious in a screenshot.

    uv run uvicorn src.main:app --port 8021 &
    LD_LIBRARY_PATH=$HOME/.cache/playwright-userlibs/usr/lib/x86_64-linux-gnu \
        uv run python tests/e2e/capture_dashboard.py
"""

import json
import os
import pathlib
import sys

from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8021"
OUT_DIR = pathlib.Path(
    os.environ.get(
        "DASHBOARD_SHOT_DIR",
        pathlib.Path(__file__).resolve().parents[2] / "_docs/screenshots/dashboard",
    )
)

PATIENTS = [("1643", "full-record"), ("12069", "thin-record")]

# The phone layout is a different layout, not a narrower one: the rail becomes a drawer and
# the figures move into a strip under the top bar. It gets its own screenshots.
VIEWPORTS = [("", {"width": 1500, "height": 1000}), ("-phone", {"width": 414, "height": 860})]


def capture(page, patient_id, slug, theme, size_suffix):
    page.goto(f"{BASE_URL}/?patient={patient_id}", wait_until="networkidle")
    page.wait_for_timeout(1100)
    theme_suffix = "" if theme == "light" else f"-{theme}"
    # Not `full_page`: the page is a fixed shell whose pane scrolls internally, so a
    # full-page shot captures the viewport plus nothing. The pane is the thing to look at.
    page.screenshot(path=OUT_DIR / f"{patient_id}-{slug}{size_suffix}{theme_suffix}.png")

    panels = page.eval_on_selector_all(
        ".panel-card, .patient-strip",
        """nodes => nodes.map(node => ({
             key: node.dataset.panel,
             title: (node.querySelector('.panel-card__title')
                     || node.querySelector('.patient-strip__name')).textContent,
             count: node.querySelector('.panel-card__count')?.textContent ?? '',
             notes: [...node.querySelectorAll('.panel-card__note')].map(n => n.textContent),
             canvases: node.querySelectorAll('canvas').length,
             fallbacks: [...node.querySelectorAll('.chart-host--fallback')]
                          .map(n => n.textContent),
             tiles: node.querySelectorAll('.measure-tile').length,
             chips: node.querySelectorAll('.allergy-chip').length,
           }))""",
    )
    return panels


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    report = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        for theme in ("light", "dark"):
            for size_suffix, viewport in VIEWPORTS:
                context = browser.new_context(
                    viewport=viewport, color_scheme=theme, device_scale_factor=2,
                )
                page = context.new_page()
                console = []
                page.on("console", lambda m: console.append(f"{m.type}: {m.text}"))
                page.on("pageerror", lambda error: console.append(f"pageerror: {error}"))
                for patient_id, slug in PATIENTS:
                    panels = capture(page, patient_id, slug, theme, size_suffix)
                    if theme == "light" and size_suffix == "":
                        report[patient_id] = panels
                        report[f"{patient_id}__console"] = console.copy()
                context.close()
        browser.close()

    (OUT_DIR / "panel_report.json").write_text(json.dumps(report, indent=2))
    for patient_id, _ in PATIENTS:
        print(f"--- patient {patient_id}")
        for panel in report[patient_id]:
            print(f"  {panel['key']:<14} {panel['title']:<28} {panel['count']:<6} "
                  f"canvas={panel['canvases']} tiles={panel['tiles']} chips={panel['chips']} "
                  f"fallback={panel['fallbacks']} notes={panel['notes']}")
        noise = [line for line in report[f"{patient_id}__console"] if "favicon" not in line]
        print(f"  console: {noise if noise else 'clean'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
