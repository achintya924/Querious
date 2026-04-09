import { useEffect, useState } from "react";
import { getSchema } from "../../services/queryService";
import FieldBadge from "./FieldBadge";

// Static mapping: collection.field → suggested query string
const FIELD_SUGGESTIONS = {
  orders: {
    total_amount: "What is the total revenue?",
    category:     "Show revenue by category",
    region:       "Show revenue by region",
    status:       "Show orders by status",
    order_date:   "Show monthly revenue trend",
    product:      "Top 10 products by revenue",
    quantity:     "Average order quantity by category",
    unit_price:   "Average unit price by category",
    customer_id:  "How many unique customers placed orders?",
    order_id:     "How many total orders are there?",
  },
  customers: {
    region:      "How many customers by region?",
    segment:     "Customer count by segment",
    signup_date: "Customer signups by month",
    name:        "How many total customers are there?",
  },
  products: {
    category: "Products by category",
    price:    "Average product price by category",
    cost:     "Average product cost by category",
    stock:    "Total stock by category",
    name:     "Show all products",
  },
};

const COLLECTION_COLORS = {
  orders:    "text-violet-600 bg-violet-50 border-violet-200",
  customers: "text-blue-600 bg-blue-50 border-blue-200",
  products:  "text-green-600 bg-green-50 border-green-200",
};

function CollectionSection({ name, collection, onFieldClick }) {
  const [open, setOpen] = useState(name === "orders"); // orders open by default

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${COLLECTION_COLORS[name] || "text-gray-600 bg-gray-50 border-gray-200"}`}>
            {name}
          </span>
          {collection.description && (
            <span className="text-[10px] text-gray-400 hidden lg:inline truncate max-w-[100px]">
              {collection.description}
            </span>
          )}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Fields */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50/50 divide-y divide-gray-100">
          {Object.entries(collection.fields).map(([fieldName, fieldMeta]) => {
            const suggestion = FIELD_SUGGESTIONS[name]?.[fieldName];
            return (
              <div
                key={fieldName}
                className={`px-3 py-2 ${suggestion ? "cursor-pointer hover:bg-violet-50 group" : ""}`}
                onClick={() => suggestion && onFieldClick(suggestion)}
                title={suggestion ? `Suggest: "${suggestion}"` : undefined}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <FieldBadge type={fieldMeta.type} />
                  <span className={`text-xs font-medium ${suggestion ? "text-gray-700 group-hover:text-violet-700" : "text-gray-600"}`}>
                    {fieldName}
                  </span>
                  {suggestion && (
                    <svg className="w-2.5 h-2.5 text-violet-400 opacity-0 group-hover:opacity-100 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </div>
                {/* Description */}
                {fieldMeta.description && (
                  <p className="text-[10px] text-gray-400 ml-8 leading-relaxed">{fieldMeta.description}</p>
                )}
                {/* Range for dates */}
                {fieldMeta.range && (
                  <p className="text-[10px] text-gray-400 ml-8">{fieldMeta.range}</p>
                )}
                {/* Enum chips */}
                {fieldMeta.enum && (
                  <div className="flex flex-wrap gap-1 ml-8 mt-1">
                    {fieldMeta.enum.map((val) => (
                      <span key={val} className="text-[9px] px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded">
                        {val}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SchemaExplorer({ onFieldClick, onClose }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchema()
      .then((data) => setSchema(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M8 11h.01M8 15h.01M12 11h.01M12 15h.01M16 11h.01M16 15h.01" />
          </svg>
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Schema</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Close schema explorer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tip */}
      <p className="text-[10px] text-gray-400 px-3 py-2 border-b border-gray-100 leading-relaxed">
        Click a field to insert a suggested query
      </p>

      {/* Collections */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading ? (
          <div className="space-y-2 pt-1">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : schema ? (
          Object.entries(schema.collections).map(([name, collection]) => (
            <CollectionSection
              key={name}
              name={name}
              collection={collection}
              onFieldClick={onFieldClick}
            />
          ))
        ) : (
          <p className="text-xs text-gray-400 text-center pt-8">Schema unavailable</p>
        )}
      </div>

      {/* Data size footer */}
      {schema?.dataSize && (
        <div className="border-t border-gray-100 px-3 py-2 shrink-0">
          <p className="text-[10px] text-gray-400">
            {Object.entries(schema.dataSize).map(([k, v]) => `${v.toLocaleString()} ${k}`).join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}
