# Vendored assets

## `echarts.min.js`

| | |
|---|---|
| Version | **5.6.1** (`echarts@5` on jsDelivr resolved here; 5.x is the line this build targets) |
| File | `dist/echarts.min.js`, the full UMD build, 1,034,102 bytes |
| Source | `https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js` |
| Licence | Apache 2.0, header retained in the file |

Vendored rather than loaded from a CDN: the page has to draw with no network, in a review and
inside the container, and a pinned copy in the repository makes a version change visible in a
diff instead of in a browser console.

**The full build is required.** `echarts.simple.min.js` omits the tooltip, the legend and the
SVG renderer; `echarts.common.min.js` omits the `custom` series, which the problems timeline is
built on. Both would fail quietly - a missing tooltip does not throw.

Loaded as a classic `<script>` before the module entry, exposing the `echarts` global. The file
is UMD, so no build step and no bundler is involved.

To upgrade: fetch the new `dist/echarts.min.js`, replace this file, and update the version row
above. ECharts 6 changed the default palette and the option schema, so the move is not a
drop-in - every colour on this page comes from `static/css/app_style.css` and would survive,
but the `custom` series and the label layout want re-checking in a browser.
