import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, formatAxisLabel, formatValue, truncateLabel } from "../../utils/formatters";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-600 mb-1">{truncateLabel(label, 30)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          <span className="text-gray-500 font-normal">{p.name}: </span>
          {formatValue(p.value, p.dataKey)}
        </p>
      ))}
    </div>
  );
}

export default function LineChartViz({ data, xKey, yKey }) {
  if (!data?.length) return null;

  // yKey can be a string (single line) or array (multiple lines)
  const yKeys  = Array.isArray(yKey) ? yKey : [yKey];
  const isMulti = yKeys.length > 1;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
        <defs>
          {yKeys.map((k, i) => (
            <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.15} />
              <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.01} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey={xKey}
          tickFormatter={(v) => truncateLabel(v)}
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
        {isMulti && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />}
        {yKeys.map((k, i) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2.5}
            fill={isMulti ? "transparent" : `url(#grad-${k})`}
            dot={{ r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            animationDuration={800}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
