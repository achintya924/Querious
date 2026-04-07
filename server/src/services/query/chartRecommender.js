/**
 * Recommend a chart type based on the query shape and result row count.
 *
 * Returns one of:
 *   "metric_card" | "line_chart" | "pie_chart" | "bar_chart" | "grouped_bar_chart"
 */
function recommendChart(structuredQuery, resultData) {
  const { dimensions = [], metrics = [] } = structuredQuery;

  const hasDimensions    = dimensions.length > 0;
  const hasTimeDimension = dimensions.some((d) => d.granularity);
  const metricCount      = metrics.length;
  const rowCount         = resultData.length;

  // Single aggregate number — no grouping, one metric
  if (!hasDimensions && metricCount === 1) return "metric_card";

  // Time series — at least one time-bucketed dimension, up to 3 metrics
  if (hasTimeDimension && metricCount <= 3) return "line_chart";

  // Proportion — one categorical dimension, one metric, few slices
  if (!hasTimeDimension && metricCount === 1 && rowCount <= 7) return "pie_chart";

  // Comparison — one categorical dimension, one metric, many rows
  if (!hasTimeDimension && metricCount === 1) return "bar_chart";

  // Multi-metric comparison — several metrics, no time axis
  if (!hasTimeDimension && metricCount > 1) return "grouped_bar_chart";

  return "bar_chart";
}

module.exports = { recommendChart };
