import { formatCurrency, formatIndianNumber, isMonetaryField } from "../../utils/formatters";

export default function MetricCard({ data, metricKey, title }) {
  const value  = data?.[metricKey];
  const isMoney = isMonetaryField(metricKey || "");

  const formatted =
    typeof value === "number"
      ? isMoney
        ? formatCurrency(value)
        : formatIndianNumber(value)
      : String(value ?? "—");

  return (
    <div className="border border-violet-100 rounded-2xl overflow-hidden mb-4">
      {/* Colored top stripe */}
      <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 p-8 text-center">
        {title && (
          <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-3">
            {title}
          </p>
        )}
        <p className="text-5xl font-bold text-violet-700 tracking-tight tabular-nums">
          {formatted}
        </p>
      </div>
    </div>
  );
}
