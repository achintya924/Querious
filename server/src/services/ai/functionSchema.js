const queryDatabaseFunction = {
  name: "query_database",
  description: "Query the business database based on user's natural language question",
  parameters: {
    type: "OBJECT",
    properties: {
      collection: {
        type: "STRING",
        enum: ["orders", "customers", "products"],
        description: "Which collection to query",
      },
      metrics: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            field: { type: "STRING", description: "Field to aggregate" },
            operation: {
              type: "STRING",
              enum: ["sum", "count", "average", "min", "max", "count_distinct"],
            },
            alias: { type: "STRING", description: "Display name for this metric" },
          },
          required: ["field", "operation"],
        },
        description: "What to measure",
      },
      dimensions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            field: { type: "STRING", description: "Field to group by" },
            granularity: {
              type: "STRING",
              enum: ["day", "week", "month", "quarter", "year"],
              description: "For date fields only",
            },
          },
          required: ["field"],
        },
        description: "How to group the results",
      },
      filters: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            field: { type: "STRING" },
            operator: {
              type: "STRING",
              enum: ["eq", "neq", "gt", "gte", "lt", "lte", "in", "between"],
            },
            value: {
              type: "STRING",
              description: "Single value, or comma-separated for in/between operators",
            },
          },
          required: ["field", "operator", "value"],
        },
        description: "Filter conditions",
      },
      sort: {
        type: "OBJECT",
        properties: {
          field: { type: "STRING" },
          direction: { type: "STRING", enum: ["asc", "desc"] },
        },
      },
      limit: {
        type: "INTEGER",
        description: "Max rows to return (default 10)",
      },
      confidence: {
        type: "NUMBER",
        description: "0-1 confidence in interpretation. Below 0.7 triggers clarification",
      },
      clarification_needed: {
        type: "STRING",
        description: "Question to ask the user if the query is ambiguous",
      },
    },
    required: ["collection", "metrics", "confidence"],
  },
};

module.exports = { queryDatabaseFunction };
