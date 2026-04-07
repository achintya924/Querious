const SCHEMA_RESPONSE = {
  collections: {
    orders: {
      description: "Customer purchase orders (Jan 2024 – Dec 2025)",
      fields: {
        order_id:     { type: "string",   description: "Unique order identifier" },
        customer_id:  { type: "ObjectId", description: "Reference to customers collection" },
        product:      { type: "string",   description: "Product name" },
        category:     { type: "string",   enum: ["Electronics", "Clothing", "Home & Kitchen", "Office"] },
        region:       { type: "string",   enum: ["North", "South", "East", "West"] },
        quantity:     { type: "number",   description: "Units ordered" },
        unit_price:   { type: "number",   description: "Price per unit (INR, with ±5% noise)" },
        total_amount: { type: "number",   description: "quantity × unit_price — use for revenue queries" },
        status:       { type: "string",   enum: ["delivered", "shipped", "processing", "cancelled", "returned"] },
        order_date:   { type: "date",     description: "Order placement date", range: "2024-01-01 to 2025-12-31" },
      },
    },
    customers: {
      description: "Customer profiles",
      fields: {
        name:        { type: "string" },
        email:       { type: "string" },
        segment:     { type: "string", enum: ["Enterprise", "Mid-Market", "SMB", "Consumer"] },
        region:      { type: "string", enum: ["North", "South", "East", "West"] },
        signup_date: { type: "date",   description: "Account creation date", range: "2023-01-01 to 2025-12-31" },
      },
    },
    products: {
      description: "Product catalog",
      fields: {
        name:     { type: "string" },
        category: { type: "string", enum: ["Electronics", "Clothing", "Home & Kitchen", "Office"] },
        price:    { type: "number", description: "Selling price (INR)" },
        cost:     { type: "number", description: "Cost price (INR)" },
        stock:    { type: "number", description: "Units in stock" },
      },
    },
  },
  dataSize: {
    orders:    5000,
    customers: 200,
    products:  20,
  },
};

function getSchema(req, res) {
  return res.json(SCHEMA_RESPONSE);
}

module.exports = { getSchema };
