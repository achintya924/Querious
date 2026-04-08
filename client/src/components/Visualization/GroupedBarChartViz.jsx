import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, formatAxisLabel, formatValue, truncateLabel } from "../../utils/formatters";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-1.5">{truncateLabel(label, 30)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs mb-0.5" style={{ color: p.color }}>
          <span className="font-medium">{p.name}: </span>
          {formatValue(p.value, p.dataKey)}
        </p>
      ))}
    </div>
  );
}

export default function GroupedBarChartViz({ data, xKey, yKeys = [] }) {
  if (!data?.length || !yKeys.length) return null;
  const angled = data.length > 5;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: angled ? 60 : 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey={xKey}
          tickFormatter={(v) => truncateLabel(v)}
          angle={angled ? -45 : 0}
          textAnchor={angled ? "end" : "middle"}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatAxisLabel}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        {yKeys.map((k, i) => (
          <Bar
            key={k}
            dataKey={k}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            radius={[3, 3, 0, 0]}
            animationDuration={800}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
