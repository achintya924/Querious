import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, Sector, ResponsiveContainer } from "recharts";
import { CHART_COLORS, formatValue, formatPercentage } from "../../utils/formatters";

function ActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx} cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
}

function CustomTooltip({ active, payload, nameKey, valueKey }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: row } = payload[0];
  const total = payload[0].payload._total ?? value;
  const pct   = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-1">{name}</p>
      <p className="font-semibold text-gray-800">{formatValue(value, valueKey)}</p>
      <p className="text-gray-400 text-xs">{formatPercentage(pct)} of total</p>
    </div>
  );
}

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function PieChartViz({ data, nameKey, valueKey }) {
  const [activeIndex, setActiveIndex] = useState(null);
  if (!data?.length) return null;

  const total = data.reduce((s, r) => s + (r[valueKey] ?? 0), 0);
  // Inject total into each row so tooltip can show %
  const enriched = data.map((r) => ({ ...r, _total: total }));

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={enriched}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={120}
            labelLine={false}
            label={renderCustomLabel}
            activeIndex={activeIndex}
            activeShape={ActiveShape}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            animationDuration={800}
          >
            {enriched.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip nameKey={nameKey} valueKey={valueKey} />} />
          <Legend
            formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
            wrapperStyle={{ paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center total */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <p className="text-lg font-bold text-gray-700 leading-none">
          {formatValue(total, valueKey)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Total</p>
      </div>
    </div>
  );
}
