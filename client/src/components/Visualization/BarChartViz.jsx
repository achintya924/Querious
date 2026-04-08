import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, formatAxisLabel, formatValue, truncateLabel } from "../../utils/formatters";

const BAR_COLOR = CHART_COLORS[0];

function CustomTooltip({ active, payload, label, yKey }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-1">{truncateLabel(label, 30)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {formatValue(p.value, p.dataKey)}
        </p>
      ))}
    </div>
  );
}

export default function BarChartViz({ data, xKey, yKey }) {
  if (!data?.length) return null;
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
        <Tooltip content={<CustomTooltip yKey={yKey} />} cursor={{ fill: "#f5f3ff" }} />
        <Bar
          dataKey={yKey}
          fill={BAR_COLOR}
          radius={[4, 4, 0, 0]}
          animationDuration={800}
          maxBarSize={60}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
