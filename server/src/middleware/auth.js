const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  // Cookie-first: httpOnly cookie set by login/register
  // Falls back to Authorization header for API clients / Postman
  const cookieToken = req.cookies?.querious_token;
  const headerToken =
    req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;

  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized" });
  }
}

module.exports = auth;
