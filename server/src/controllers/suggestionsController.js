const SUGGESTIONS = {
  categories: [
    {
      name: "Revenue & Sales",
      queries: [
        "What was total revenue by category?",
        "Top 5 products by sales",
        "Monthly revenue trend for 2025",
      ],
    },
    {
      name: "Orders & Volume",
      queries: [
        "How many orders per month in 2025?",
        "Order count by region",
        "What percentage of orders were cancelled?",
      ],
    },
    {
      name: "Customers",
      queries: [
        "How many customers by segment?",
        "Customer count by region",
        "Which region has the most Enterprise customers?",
      ],
    },
    {
      name: "Products & Performance",
      queries: [
        "Average order value by category",
        "Which product has the highest stock?",
        "Compare revenue across all categories for 2024 vs 2025",
      ],
    },
  ],
};

function getSuggestions(req, res) {
  return res.json(SUGGESTIONS);
}

module.exports = { getSuggestions };
