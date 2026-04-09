/**
 * OpenAI/Grok-compatible function declaration for query_database.
 * Types are lowercase (string, object, array, number, integer) per JSON Schema spec.
 */
const queryDatabaseFunction = {
  type: "function",
  function: {
    name: "query_database",
    description: "Query the business database based on user's natural language question",
    parameters: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          enum: ["orders", "customers", "products"],
          description: "Which collection to query",
        },
        metrics: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field:     { type: "string", description: "Field to aggregate" },
              operation: {
                type: "string",
                enum: ["sum", "count", "average", "min", "max", "count_distinct"],
              },
              alias: { type: "string", description: "Display name for this metric" },
            },
            required: ["field", "operation"],
          },
          description: "What to measure",
        },
        dimensions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string", description: "Field to group by" },
              granularity: {
                type: "string",
                enum: ["day", "week", "month", "quarter", "year"],
                description: "For date fields only",
              },
            },
            required: ["field"],
          },
          description: "How to group the results",
        },
        filters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field:    { type: "string" },
              operator: {
                type: "string",
                enum: ["eq", "neq", "gt", "gte", "lt", "lte", "in", "between"],
              },
              value: {
                type: "string",
                description: "Single value, or comma-separated for in/between operators",
              },
            },
            required: ["field", "operator", "value"],
          },
          description: "Filter conditions",
        },
        sort: {
          type: "object",
          properties: {
            field:     { type: "string" },
            direction: { type: "string", enum: ["asc", "desc"] },
          },
        },
        limit: {
          type: "integer",
          description: "Max rows to return (default 10)",
        },
        confidence: {
          type: "number",
          description: "0-1 confidence in interpretation. Below 0.7 triggers clarification",
        },
        clarification_needed: {
          type: "string",
          description: "Question to ask the user if the query is ambiguous",
        },
      },
      required: ["collection", "metrics", "confidence"],
    },
  },
};

module.exports = { queryDatabaseFunction };
