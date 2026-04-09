const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", name: "Querious API" });
});

// Routes
app.use("/api/auth",      require("./routes/authRoutes"));
app.use("/api/query",     require("./routes/queryRoutes"));
app.use("/api/schema",    require("./routes/schemaRoutes"));
app.use("/api/sessions",  require("./routes/sessionRoutes"));
app.use("/api/history",   require("./routes/historyRoutes"));
app.use("/api/bookmarks", require("./routes/bookmarkRoutes"));
// app.use("/api/history", require("./routes/historyRoutes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
