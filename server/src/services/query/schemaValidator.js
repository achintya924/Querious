const SCHEMA = {
  orders: {
    fields: new Set(["order_id", "customer_id", "product", "category", "region",
                     "quantity", "unit_price", "total_amount", "status", "order_date"]),
    enums: {
      category: ["Electronics", "Clothing", "Home & Kitchen", "Office"],
      region:   ["North", "South", "East", "West"],
      status:   ["delivered", "shipped", "processing", "cancelled", "returned"],
    },
    dateFields: new Set(["order_date"]),
  },
  customers: {
    fields: new Set(["name", "email", "segment", "region", "signup_date"]),
    enums: {
      segment: ["Enterprise", "Mid-Market", "SMB", "Consumer"],
      region:  ["North", "South", "East", "West"],
    },
    dateFields: new Set(["signup_date"]),
  },
  products: {
    fields: new Set(["name", "category", "price", "cost", "stock"]),
    enums: {
      category: ["Electronics", "Clothing", "Home & Kitchen", "Office"],
    },
    dateFields: new Set(),
  },
};

const VALID_OPERATORS = new Set(["eq", "neq", "gt", "gte", "lt", "lte", "in", "between"]);

/**
 * Case-insensitive enum lookup. Returns the correctly-cased value or null.
 */
function matchEnum(value, enumValues) {
  const lower = value.toLowerCase();
  return enumValues.find((e) => e.toLowerCase() === lower) || null;
}

/**
 * Validate and clean a structured query from Gemini.
 * Returns { valid: true, query } or { valid: false, error }.
 */
function validateQuery(structuredQuery) {
  const { collection, metrics, dimensions, filters } = structuredQuery;

  // 1. Collection
  if (!SCHEMA[collection]) {
    return { valid: false, error: `Unknown collection "${collection}". Valid: ${Object.keys(SCHEMA).join(", ")}` };
  }
  const { fields, enums, dateFields } = SCHEMA[collection];

  // 2. Metrics
  if (!metrics || metrics.length === 0) {
    return { valid: false, error: "At least one metric is required" };
  }
  for (const m of metrics) {
    // _id is a valid MongoDB field for count/count_distinct operations
    if (m.field === "_id" && (m.operation === "count" || m.operation === "count_distinct")) continue;
    if (!fields.has(m.field)) {
      return { valid: false, error: `Field "${m.field}" does not exist in collection "${collection}". Available: ${[...fields].join(", ")}` };
    }
  }

  // 3. Dimensions
  for (const d of dimensions || []) {
    if (!fields.has(d.field)) {
      return { valid: false, error: `Dimension field "${d.field}" does not exist in "${collection}"` };
    }
    if (d.granularity && !dateFields.has(d.field)) {
      return { valid: false, error: `Granularity can only be set on date fields. "${d.field}" is not a date field` };
    }
  }

  // 4. Filters — validate fields, operators, and enum values
  const cleanedFilters = [];
  for (const f of filters || []) {
    if (!fields.has(f.field)) {
      return { valid: false, error: `Filter field "${f.field}" does not exist in "${collection}"` };
    }
    if (!VALID_OPERATORS.has(f.operator)) {
      return { valid: false, error: `Invalid operator "${f.operator}". Valid: ${[...VALID_OPERATORS].join(", ")}` };
    }

    // Enum value correction (case-insensitive)
    let cleanedValue = f.value;
    if (enums[f.field]) {
      const valuesToCheck = f.operator === "in"
        ? f.value.split(",").map((v) => v.trim())
        : [f.value.trim()];

      const corrected = [];
      for (const val of valuesToCheck) {
        const match = matchEnum(val, enums[f.field]);
        if (!match) {
          return {
            valid: false,
            error: `Value "${val}" is not valid for field "${f.field}". Available: ${enums[f.field].join(", ")}`,
          };
        }
        corrected.push(match);
      }
      cleanedValue = corrected.join(",");
    }

    cleanedFilters.push({ ...f, value: cleanedValue });
  }

  const cleanedQuery = {
    ...structuredQuery,
    filters: cleanedFilters,
  };

  return { valid: true, query: cleanedQuery };
}

module.exports = { validateQuery };
