/**
 * Build the chart metadata object from query shape and result data.
 *
 * Returns: { type, title, xAxis, yAxis }
 * type is one of:
 *   "metric_card" | "line_chart" | "pie_chart" | "bar_chart" |
 *   "grouped_bar_chart" | "stacked_bar_chart" | "table" | "empty_state"
 */
function recommendChart(structuredQuery, resultData) {
  const { dimensions = [], metrics = [] } = structuredQuery;

  const dimCount         = dimensions.length;
  const hasTimeDimension = dimensions.some((d) => d.granularity);
  const metricCount      = metrics.length;
  const rowCount         = resultData.length;

  // ── Derive readable field names ───────────────────────────────────────────
  const firstMetric = metrics[0] || {};
  const firstDim    = dimensions[0] || {};
  const secondDim   = dimensions[1] || {};

  const metricAlias = firstMetric.alias || `${firstMetric.operation}_${firstMetric.field}`;
  const dimField    = firstDim.field || "";
  const dimField2   = secondDim.field || "";

  // ── Title generation ──────────────────────────────────────────────────────
  function makeTitle() {
    const metricLabel = humanise(metricAlias);
    if (dimCount === 0) return metricLabel;
    if (dimCount === 1) return `${metricLabel} by ${humanise(dimField)}`;
    return `${metricLabel} by ${humanise(dimField)} and ${humanise(dimField2)}`;
  }

  // ── Type selection ────────────────────────────────────────────────────────
  let type;

  if (rowCount === 0) {
    type = "empty_state";
  } else if (dimCount === 0 && metricCount === 1) {
    type = "metric_card";
  } else if (dimCount === 2) {
    type = "stacked_bar_chart";
  } else if (hasTimeDimension && metricCount <= 3) {
    type = "line_chart";
  } else if (!hasTimeDimension && metricCount === 1 && rowCount <= 7) {
    type = "pie_chart";
  } else if (!hasTimeDimension && metricCount === 1) {
    type = "bar_chart";
  } else if (!hasTimeDimension && metricCount > 1) {
    type = "grouped_bar_chart";
  } else {
    type = "bar_chart";
  }

  // Wide/complex result — fall back to table
  const columnCount = resultData.length > 0 ? Object.keys(resultData[0]).length : 0;
  if (columnCount > 5 && type !== "metric_card" && type !== "empty_state") {
    type = "table";
  }

  // ── Axis mapping ──────────────────────────────────────────────────────────
  // xAxis: the grouping dimension; yAxis: the first metric
  const xAxis = dimField || null;
  const yAxis = metricAlias || null;

  return { type, title: makeTitle(), xAxis, yAxis };
}

/** Convert snake_case or camelCase field names to Title Case readable labels */
function humanise(str) {
  if (!str) return "";
  return str
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = { recommendChart };
