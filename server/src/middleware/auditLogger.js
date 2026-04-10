/**
 * Lightweight audit logger.
 * Writes structured JSON to console. Extend the `persist` function to write
 * to MongoDB if you need a durable audit trail.
 */

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * Log a security-relevant event.
 * @param {"login_success"|"login_failure"|"register"|"logout"|"rate_limit_hit"|"validation_failure"} event
 * @param {{ req?: object, userId?: string, details?: object }} opts
 */
function logAuditEvent(event, { req, userId, details } = {}) {
  const entry = {
    event,
    timestamp: new Date().toISOString(),
    ip: req ? getIp(req) : undefined,
    userId: userId || undefined,
    ...details,
  };
  console.log("[AUDIT]", JSON.stringify(entry));
  // To persist: AuditLog.create(entry).catch(() => {});
}

/**
 * Middleware — attach to auth routes to log validation failures.
 * Wraps the validate() middleware and logs on 400.
 */
function auditValidationFailure(routeName) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode === 400) {
        logAuditEvent("validation_failure", {
          req,
          details: { route: routeName, error: body?.error },
        });
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { logAuditEvent, auditValidationFailure, getIp };
