import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, formatAxisLabel, formatValue, truncateLabel } from "../../utils/formatters";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-1.5">{truncateLabel(label, 30)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs mb-0.5" style={{ color: p.color }}>
          <span className="font-medium">{p.name}: </span>
          {formatValue(p.value, p.dataKey)}
        </p>
      ))}
      <p className="text-xs text-gray-500 mt-1 border-t pt-1">
        Total: {formatValue(total, payload[0]?.dataKey)}
      </p>
    </div>
  );
}

export default function StackedBarChartViz({ data, xKey, stackKeys = [] }) {
  if (!data?.length || !stackKeys.length) return null;
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
        {stackKeys.map((k, i) => (
          <Bar
            key={k}
            dataKey={k}
            stackId="stack"
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            animationDuration={800}
            radius={i === stackKeys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
