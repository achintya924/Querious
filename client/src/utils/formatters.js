const LAKH  = 100_000;
const CRORE = 10_000_000;

export const CHART_COLORS = [
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
];

// ── Number formatting ────────────────────────────────────────────────────────

export function formatIndianNumber(num) {
  if (num === null || num === undefined) return "—";
  return Number(num).toLocaleString("en-IN");
}

export function formatCurrency(num) {
  if (num === null || num === undefined) return "—";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= CRORE) return `${sign}₹${(abs / CRORE).toFixed(1)}Cr`;
  if (abs >= LAKH)  return `${sign}₹${(abs / LAKH).toFixed(1)}L`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

export function formatPercentage(num) {
  if (num === null || num === undefined) return "—";
  return `${Number(num).toFixed(1)}%`;
}

/** Short label for chart axes — "10K", "1.2L", "5Cr" */
export function formatAxisLabel(value) {
  if (typeof value !== "number") return String(value ?? "");
  const abs = Math.abs(value);
  if (abs >= CRORE) return `${(value / CRORE).toFixed(1)}Cr`;
  if (abs >= LAKH)  return `${(value / LAKH).toFixed(1)}L`;
  if (abs >= 1000)  return `${(value / 1000).toFixed(0)}K`;
  return String(value);
}

/** Full tooltip value — monetary fields get ₹ prefix */
export function formatValue(value, fieldName = "") {
  if (typeof value !== "number") return String(value ?? "—");
  if (isMonetaryField(fieldName)) return formatCurrency(value);
  return formatIndianNumber(value);
}

export function isMonetaryField(fieldName) {
  return /amount|price|revenue|cost|total|sales|earnings/i.test(fieldName);
}

// ── Date formatting ──────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function formatDate(dateStr) {
  if (!dateStr) return dateStr;
  const s = String(dateStr);

  // "2025-01" → "Jan 2025"
  const monthM = s.match(/^(\d{4})-(\d{2})$/);
  if (monthM) return `${MONTH_NAMES[parseInt(monthM[2]) - 1]} ${monthM[1]}`;

  // "2025-Q1" or "2025-Q2"
  const quarterM = s.match(/^(\d{4})-Q(\d)$/);
  if (quarterM) return `Q${quarterM[2]} ${quarterM[1]}`;

  // "2025-W03"
  const weekM = s.match(/^(\d{4})-W(\d{2})$/);
  if (weekM) return `W${parseInt(weekM[2])} ${weekM[1]}`;

  // Full year "2025"
  if (/^\d{4}$/.test(s)) return s;

  return s;
}

// ── Label truncation for X-axis ──────────────────────────────────────────────

export function truncateLabel(value, maxLen = 15) {
  const str = formatDate(String(value));
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
}

// ── Chart PNG export ─────────────────────────────────────────────────────────

export function exportChartAsPNG(containerRef, filename = "querious-chart.png") {
  const svg = containerRef.current?.querySelector("svg");
  if (!svg) return;

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url  = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const scale  = 2; // retina
    canvas.width  = svg.clientWidth  * scale;
    canvas.height = svg.clientHeight * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const a = document.createElement("a");
    a.download = filename;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = url;
}
