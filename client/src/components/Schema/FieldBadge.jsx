const TYPE_STYLES = {
  string:   { label: "abc", cls: "bg-blue-50 text-blue-500" },
  number:   { label: "#",   cls: "bg-green-50 text-green-600" },
  date:     { label: "📅",  cls: "bg-orange-50 text-orange-500" },
  ObjectId: { label: "id",  cls: "bg-gray-100 text-gray-500" },
};

export default function FieldBadge({ type }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.string;
  return (
    <span className={`inline-block text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${style.cls}`}>
      {style.label}
    </span>
  );
}
