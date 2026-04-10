const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const compression = require("compression");

const inputSanitizer          = require("./middleware/inputSanitizer");
const errorHandler            = require("./middleware/errorHandler");
const { generalLimiter, authLimiter, queryLimiter } = require("./middleware/rateLimiter");
const { getCacheSize }        = require("./services/cache/queryCache");

const app = express();

// ── Security & perf ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());

// ── CORS ─────────────────────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === "production";

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return cb(null, true);

    // In production, only allow the explicitly configured frontend URL
    if (isProd) {
      const allowed = process.env.FRONTEND_URL;
      if (allowed && origin === allowed) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    }

    // In development, allow any localhost / 127.0.0.1 origin regardless of port
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }

    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body parsing + sanitization ──────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(inputSanitizer);

// ── General rate limit (all protected API routes) ────────────────────────────
app.use("/api", generalLimiter);

// ── Health check (before auth rate limiter) ───────────────────────────────────
app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    status:      "ok",
    name:        "Querious API",
    version:     "0.8.0",
    environment: process.env.NODE_ENV || "development",
    database:    mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    aiProvider:  new URL(process.env.AI_BASE_URL || "https://openrouter.ai/api/v1").hostname,
    aiModel:     process.env.AI_MODEL || "unknown",
    uptime:      Math.floor(process.uptime()),
    cacheSize:   getCacheSize(),
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",      authLimiter,  require("./routes/authRoutes"));
app.use("/api/query",     queryLimiter, require("./routes/queryRoutes"));
app.use("/api/schema",                 require("./routes/schemaRoutes"));
app.use("/api/sessions",               require("./routes/sessionRoutes"));
app.use("/api/history",                require("./routes/historyRoutes"));
app.use("/api/bookmarks",              require("./routes/bookmarkRoutes"));

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
