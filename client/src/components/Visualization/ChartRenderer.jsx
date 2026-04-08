import { useRef } from "react";
import { mapResponseToChartProps } from "../../utils/chartDataMapper";
import { exportChartAsPNG } from "../../utils/formatters";
import BarChartViz       from "./BarChartViz";
import LineChartViz      from "./LineChartViz";
import PieChartViz       from "./PieChartViz";
import MetricCard        from "./MetricCard";
import GroupedBarChartViz  from "./GroupedBarChartViz";
import StackedBarChartViz  from "./StackedBarChartViz";
import DataTable         from "./DataTable";

/**
 * ChartRenderer — switches between chart types based on chartType.type.
 * Also handles backward-compat where chartType is a plain string.
 */
export default function ChartRenderer({ chartType, results, structuredQuery }) {
  const containerRef = useRef(null);

  if (!results?.length) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        No results to display
      </div>
    );
  }

  const type  = typeof chartType === "string" ? chartType : chartType?.type;
  const title = typeof chartType === "object" ? chartType?.title : null;

  const props = mapResponseToChartProps({ results, chartType, structuredQuery });
  if (!props) return null;

  // Build a slug for the export filename
  const slug = (title || type || "chart").toLowerCase().replace(/\s+/g, "-");

  function handleExport() {
    exportChartAsPNG(containerRef, `querious-${slug}.png`);
  }

  return (
    <div className="relative">
      {/* Export button — shown on hover via group */}
      {type !== "metric_card" && type !== "table" && type !== "empty_state" && (
        <button
          onClick={handleExport}
          title="Export as PNG"
          className="absolute top-0 right-0 z-10 text-xs text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1 transition-colors"
        >
          ↓ PNG
        </button>
      )}

      <div ref={containerRef} className="animate-fade-in">
        <Chart type={type} props={props} chartType={chartType} />
      </div>
    </div>
  );
}

function Chart({ type, props, chartType }) {
  switch (type) {
    case "bar_chart":
      return <BarChartViz data={props.data} xKey={props.xKey} yKey={props.yKey} />;

    case "line_chart":
      return <LineChartViz data={props.data} xKey={props.xKey} yKey={props.yKey} />;

    case "pie_chart":
      return <PieChartViz data={props.data} nameKey={props.nameKey} valueKey={props.valueKey} />;

    case "metric_card":
      return (
        <MetricCard
          data={props.data}
          metricKey={props.metricKey}
          title={typeof chartType === "object" ? chartType?.title : null}
        />
      );

    case "grouped_bar_chart":
      return <GroupedBarChartViz data={props.data} xKey={props.xKey} yKeys={props.yKeys} />;

    case "stacked_bar_chart":
      return <StackedBarChartViz data={props.data} xKey={props.xKey} stackKeys={props.stackKeys} />;

    case "table":
      return <DataTable results={props.data} />;

    case "empty_state":
      return (
        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
          No results found for your query.
        </div>
      );

    default:
      return <BarChartViz data={props.data} xKey={props.xKey} yKey={props.yKey} />;
  }
}
