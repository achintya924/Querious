const express         = require("express");
const cors            = require("cors");
const helmet          = require("helmet");
const compression     = require("compression");
const cookieParser    = require("cookie-parser");
const mongoSanitize   = require("express-mongo-sanitize");

const inputSanitizer          = require("./middleware/inputSanitizer");
const errorHandler            = require("./middleware/errorHandler");
const { generalLimiter, authLimiter, queryLimiter } = require("./middleware/rateLimiter");
const { getCacheSize }        = require("./services/cache/queryCache");

const app = express();
const isProd = process.env.NODE_ENV === "production";

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],  // Recharts uses inline styles
      imgSrc:     ["'self'", "data:"],
      connectSrc: ["'self'", process.env.AI_BASE_URL].filter(Boolean),
    },
  },
  crossOriginEmbedderPolicy: false, // required for Recharts
}));
app.use(compression());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    if (isProd) {
      const allowed = process.env.FRONTEND_URL;
      if (allowed && origin === allowed) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    }

    // Development: allow any localhost / 127.0.0.1 port (Vite picks dynamically)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }

    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ── MongoDB operator injection prevention ────────────────────────────────────
// Strips $ and . from req.body, req.params, req.query
app.use(mongoSanitize());

// ── XSS + trim sanitization ───────────────────────────────────────────────────
app.use(inputSanitizer);

// ── General rate limit (all protected API routes) ────────────────────────────
app.use("/api", generalLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    status:      "ok",
    name:        "Querious API",
    version:     "0.9.0",
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
