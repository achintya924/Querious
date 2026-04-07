const DATE_FIELDS = new Set(["order_date", "signup_date"]);

const NUMERIC_FIELDS = {
  orders:    new Set(["quantity", "unit_price", "total_amount"]),
  customers: new Set([]),
  products:  new Set(["price", "cost", "stock"]),
};

const DATE_FORMATS = {
  day:   "%Y-%m-%d",
  week:  "%Y-W%V",
  month: "%Y-%m",
  year:  "%Y",
};

function parseScalar(value, field, collection) {
  if (DATE_FIELDS.has(field)) return new Date(value);
  if (NUMERIC_FIELDS[collection]?.has(field)) return Number(value);
  return value;
}

/**
 * Convert a validated structured query into a MongoDB aggregation pipeline.
 */
function buildPipeline(structuredQuery) {
  const {
    collection,
    metrics     = [],
    dimensions  = [],
    filters     = [],
    sort,
    limit       = 10,
  } = structuredQuery;

  const pipeline = [];

  // ── 1. $match ────────────────────────────────────────────────────────────────
  if (filters.length > 0) {
    const match = {};
    for (const { field, operator, value } of filters) {
      const isDate = DATE_FIELDS.has(field);

      const parseEnd = (v) => {
        if (!isDate) return parseScalar(v, field, collection);
        // For between end-dates, use end of that day to be inclusive
        return v.includes("T") ? new Date(v) : new Date(v + "T23:59:59.999Z");
      };
      const parseStart = (v) => {
        if (!isDate) return parseScalar(v, field, collection);
        return v.includes("T") ? new Date(v) : new Date(v + "T00:00:00.000Z");
      };

      switch (operator) {
        case "eq":      match[field] = parseScalar(value, field, collection); break;
        case "neq":     match[field] = { $ne: parseScalar(value, field, collection) }; break;
        case "gt":      match[field] = { $gt:  parseScalar(value, field, collection) }; break;
        case "gte":     match[field] = { $gte: parseScalar(value, field, collection) }; break;
        case "lt":      match[field] = { $lt:  parseScalar(value, field, collection) }; break;
        case "lte":     match[field] = { $lte: parseScalar(value, field, collection) }; break;
        case "in": {
          const vals = value.split(",").map((v) => parseScalar(v.trim(), field, collection));
          match[field] = { $in: vals };
          break;
        }
        case "between": {
          const [startStr, endStr] = value.split(",").map((v) => v.trim());
          match[field] = { $gte: parseStart(startStr), $lte: parseEnd(endStr) };
          break;
        }
      }
    }
    pipeline.push({ $match: match });
  }

  // ── 2. $group ────────────────────────────────────────────────────────────────
  const groupId   = {};
  const groupAccum = {};

  for (const dim of dimensions) {
    if (dim.granularity) {
      if (dim.granularity === "quarter") {
        groupId[dim.field] = {
          $concat: [
            { $toString: { $year: `$${dim.field}` } },
            "-Q",
            { $toString: { $ceil: { $divide: [{ $month: `$${dim.field}` }, 3] } } },
          ],
        };
      } else {
        groupId[dim.field] = {
          $dateToString: { format: DATE_FORMATS[dim.granularity], date: `$${dim.field}` },
        };
      }
    } else {
      groupId[dim.field] = `$${dim.field}`;
    }
  }

  const countDistinctAliases = [];
  for (const metric of metrics) {
    const alias = metric.alias || `${metric.operation}_${metric.field}`;
    switch (metric.operation) {
      case "sum":            groupAccum[alias] = { $sum: `$${metric.field}` }; break;
      case "count":          groupAccum[alias] = { $sum: 1 }; break;
      case "average":        groupAccum[alias] = { $avg: `$${metric.field}` }; break;
      case "min":            groupAccum[alias] = { $min: `$${metric.field}` }; break;
      case "max":            groupAccum[alias] = { $max: `$${metric.field}` }; break;
      case "count_distinct":
        groupAccum[alias] = { $addToSet: `$${metric.field}` };
        countDistinctAliases.push(alias);
        break;
    }
  }

  pipeline.push({
    $group: {
      _id: Object.keys(groupId).length ? groupId : null,
      ...groupAccum,
    },
  });

  // ── 3. $addFields — replace count_distinct sets with their size ───────────────
  if (countDistinctAliases.length > 0) {
    const addFields = {};
    for (const alias of countDistinctAliases) {
      addFields[alias] = { $size: `$${alias}` };
    }
    pipeline.push({ $addFields: addFields });
  }

  // ── 4. $sort ─────────────────────────────────────────────────────────────────
  const firstMetricAlias = metrics[0].alias || `${metrics[0].operation}_${metrics[0].field}`;
  const sortField     = sort?.field      || firstMetricAlias;
  const sortDirection = sort?.direction  === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  // ── 5. $limit ────────────────────────────────────────────────────────────────
  pipeline.push({ $limit: limit });

  // ── 6. $project — flatten _id into readable top-level fields ─────────────────
  const project = { _id: 0 };
  for (const key of Object.keys(groupId)) {
    project[key] = `$_id.${key}`;
  }
  for (const key of Object.keys(groupAccum)) {
    project[key] = 1;
  }
  pipeline.push({ $project: project });

  return pipeline;
}

module.exports = { buildPipeline };
