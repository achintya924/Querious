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

// ── CORS — must be first, before everything including helmet ─────────────────
// Build the allowed-origin list once at startup (not per-request) so there is
// no risk of an env var being undefined mid-request.
const ALLOWED_ORIGINS = [
  "https://querious-seven.vercel.app",          // hardcoded production frontend
  process.env.FRONTEND_URL,                     // override / additional domain via env
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
].filter(Boolean).map((o) => o.replace(/\/+$/, "")); // strip trailing slashes

console.log("[CORS] Allowed origins:", ALLOWED_ORIGINS);

const corsOptions = {
  origin: function (origin, callback) {
    // No origin = Postman / curl / server-to-server — always allow
    if (!origin) return callback(null, true);

    // Exact match against the prebuilt list
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    // In development allow any localhost / 127.0.0.1 port Vite might pick
    if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    console.warn("[CORS] Blocked origin:", origin);
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["set-cookie"],
};

// Apply to all routes AND handle OPTIONS preflight explicitly
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ── Security headers (after CORS so helmet doesn't clobber CORS headers) ─────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:"],
      connectSrc: ["'self'", process.env.AI_BASE_URL].filter(Boolean),
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());

// ── MongoDB operator injection prevention ────────────────────────────────────
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
