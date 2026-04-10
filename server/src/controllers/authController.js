const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");
const { logAuditEvent } = require("../middleware/auditLogger");

const isProd = process.env.NODE_ENV === "production";
// 7 days in ms — matches the default JWT_EXPIRY
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// sameSite "none" + secure:true is required for cross-domain cookies (Vercel ↔ Render).
// In development, secure:false so the cookie works on plain http://localhost.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   isProd,
  sameSite: isProd ? "none" : "lax",
  path:     "/",
  maxAge:   COOKIE_MAX_AGE,
};

function signToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || "7d" }
  );
}

function userPayload(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/register
async function register(req, res) {
  // Input already validated + coerced by Zod middleware
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "An account with that email already exists" });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password_hash });

  const token = signToken(user);
  res.cookie("querious_token", token, COOKIE_OPTIONS);

  logAuditEvent("register", { req, userId: user._id.toString() });

  // Return token in body as well — needed when cross-domain cookies are blocked
  return res.status(201).json({ token, user: userPayload(user) });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    logAuditEvent("login_failure", { req, details: { email, reason: "user not found" } });
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    logAuditEvent("login_failure", { req, details: { email, reason: "wrong password" } });
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user);
  res.cookie("querious_token", token, COOKIE_OPTIONS);

  logAuditEvent("login_success", { req, userId: user._id.toString() });

  // Return token in body as well — needed when cross-domain cookies are blocked
  return res.json({ token, user: userPayload(user) });
}

// GET /api/auth/me  (protected)
async function me(req, res) {
  const user = await User.findById(req.user.userId).select("-password_hash");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ user: userPayload(user) });
}

// POST /api/auth/logout
function logout(req, res) {
  res.clearCookie("querious_token", { path: "/" });
  logAuditEvent("logout", { req, userId: req.user?.userId });
  return res.json({ success: true });
}

module.exports = { register, login, me, logout };
