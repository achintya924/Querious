/**
 * Maps the raw API response into typed props for each chart component.
 *
 * Input: response.data = { results, chartType, structuredQuery }
 * Output: { data, xKey, yKey, ... } shaped for the target chart
 */
export function mapResponseToChartProps({ results, chartType, structuredQuery }) {
  if (!results || results.length === 0) return null;

  const type = typeof chartType === "string" ? chartType : chartType?.type;
  const xAxisHint = chartType?.xAxis;
  const yAxisHint = chartType?.yAxis;

  const { metrics = [], dimensions = [] } = structuredQuery || {};
  const metricAliases = metrics.map((m) => m.alias || `${m.operation}_${m.field}`);

  const resultKeys = Object.keys(results[0]);

  // Best-effort key resolution: prefer chartType hints, fall back to inference
  const xKey = resolveKey(xAxisHint, resultKeys, (k) => typeof results[0][k] !== "number") ?? resultKeys[0];
  const yKey = resolveKey(yAxisHint, resultKeys, (k) => typeof results[0][k] === "number")
    ?? metricAliases.find((a) => resultKeys.includes(a))
    ?? resultKeys.find((k) => typeof results[0][k] === "number");

  switch (type) {
    case "bar_chart":
    case "line_chart":
      return { data: results, xKey, yKey };

    case "pie_chart":
      return { data: results, nameKey: xKey, valueKey: yKey };

    case "metric_card": {
      const metricKey = resolveKey(yAxisHint, resultKeys, (k) => typeof results[0][k] === "number")
        ?? metricAliases.find((a) => resultKeys.includes(a))
        ?? resultKeys.find((k) => typeof results[0][k] === "number");
      return { data: results[0], metricKey };
    }

    case "grouped_bar_chart": {
      // Multiple metrics as side-by-side bars, single dimension on x-axis
      const validYKeys = metricAliases.filter((a) => resultKeys.includes(a));
      return { data: results, xKey, yKeys: validYKeys.length ? validYKeys : [yKey] };
    }

    case "stacked_bar_chart": {
      // Single metric, two dimensions — pivot long→wide so each second-dim value
      // becomes its own column (Recharts stacked bar needs wide format)
      if (dimensions.length >= 2) {
        const stackDimField = dimensions[1].field;
        if (resultKeys.includes(stackDimField)) {
          const { data: pivoted, stackKeys } = pivotLongToWide(results, xKey, stackDimField, yKey);
          return { data: pivoted, xKey, stackKeys };
        }
      }
      // Fallback: treat like grouped bar with available numeric keys
      const numericKeys = resultKeys.filter((k) => typeof results[0][k] === "number");
      return { data: results, xKey, stackKeys: numericKeys };
    }

    case "table":
      return { data: results };

    default:
      return { data: results, xKey, yKey };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveKey(hint, keys, fallbackFilter) {
  if (hint && keys.includes(hint)) return hint;
  return null; // let caller apply its own fallback
}

/**
 * Pivot long-format results to wide format for stacked/grouped bar charts.
 * e.g. [{ category, region, revenue }] → [{ category, North: X, South: Y, ... }]
 */
function pivotLongToWide(results, xKey, stackKey, valueKey) {
  const stackValues = [...new Set(results.map((r) => String(r[stackKey])))].sort();
  const xValues     = [...new Set(results.map((r) => r[xKey]))];

  const data = xValues.map((xVal) => {
    const row = { [xKey]: xVal };
    stackValues.forEach((sv) => {
      const match = results.find((r) => r[xKey] === xVal && String(r[stackKey]) === sv);
      row[sv] = match ? (match[valueKey] ?? 0) : 0;
    });
    return row;
  });

  return { data, stackKeys: stackValues };
}
