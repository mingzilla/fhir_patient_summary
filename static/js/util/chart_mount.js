/**
 * The lifecycle of one chart on the page: build it, keep it the right size, throw it away.
 *
 * **Mounting is deferred.** `echarts.init` measures its container, and a component builds its
 * tree detached from the document, where every container is 0px wide. So a component registers
 * what to draw and the page mounts it once the tree is in the document - one walk, after the
 * append, and no chart ever initialises against a zero-width box.
 *
 * A chart is re-made whenever the patient changes, and the previous instance is disposed first.
 * `setOption` on a live instance merges: the last patient's series would survive into the new
 * one, and a series that exists for one patient and not the next would leave a ghost behind -
 * which on this page is a clinical claim about the wrong person.
 *
 * Sizing is observed rather than sampled, because a chart inside a wrapping grid changes width
 * with no window resize at all.
 */
const instances = new WeakMap();
const observer_registry = new WeakMap();
const pending = new WeakMap();

/** Register a chart to draw into `host` once the host is in the document. */
export function defer_chart(host, build_option) {
  pending.set(host, build_option);
  return host;
}

/**
 * Draw every deferred chart under `root`. Called once, after the tree is appended.
 *
 * The measured width is handed to the builder, because how much room a chart has for its
 * axis labels is a decision the builder has to make and only the document knows the answer.
 * A 300px left margin is right on a 1200px panel and leaves a phone with no plot at all.
 */
export function mount_deferred_charts(root) {
  for (const host of root.querySelectorAll('.chart-host')) {
    const build_option = pending.get(host);
    if (build_option !== undefined) {
      pending.delete(host);
      mount_chart(host, build_option(host.clientWidth));
    }
  }
}

/**
 * Dispose every chart under `root` before its subtree is thrown away.
 *
 * A re-render replaces the panel elements, and an ECharts instance holds its container, a
 * `ResizeObserver` and a canvas. Dropping the nodes without disposing leaves all three alive
 * and detached, once per patient switch - a leak that is invisible in a screenshot and grows
 * with every click. `root` is still in the document when this runs, so the hosts are findable.
 */
export function dispose_charts_within(root) {
  for (const host of root.querySelectorAll('.chart-host')) {
    dispose_chart(host);
  }
}

export function mount_chart(host, option) {
  dispose_chart(host);

  if (option === null || host.clientWidth === 0) {
    // Nothing to draw, or nothing to measure. Say so in words rather than draw a
    // zero-width canvas that never recovers; the rows stay in the table below.
    host.classList.add('chart-host--fallback');
    host.textContent = option === null
      ? 'There is nothing to plot for this patient.'
      : 'The chart had no width to draw into. The rows are in the table below.';
    return null;
  }

  const chart = echarts.init(host, null, { renderer: 'canvas' });
  chart.setOption(option);
  instances.set(host, chart);

  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(host);
    observer_registry.set(host, observer);
  }
  return chart;
}

export function dispose_chart(host) {
  const observer = observer_registry.get(host);
  if (observer !== undefined) {
    observer.disconnect();
    observer_registry.delete(host);
  }
  const chart = instances.get(host);
  if (chart !== undefined) {
    chart.dispose();
    instances.delete(host);
    // `dispose` clears the instance but leaves the attributes `aria` wrote onto the
    // container, so a re-used node would keep announcing the previous chart.
    host.removeAttribute('role');
    host.removeAttribute('aria-label');
  }
}

/** The element a chart draws into, with the height its axis band needs included. */
export function chart_host(class_name, height_px) {
  const host = document.createElement('div');
  host.className = `chart-host ${class_name}`;
  host.style.height = `${height_px}px`;
  return host;
}
