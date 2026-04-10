const { z } = require("zod");

const OBJECTID_RE = /^[0-9a-fA-F]{24}$/;

// ── Schemas ──────────────────────────────────────────────────────────────────

const PASSWORD_MSG =
  "Password must be at least 8 characters with one uppercase letter and one number";

const schemas = {
  register: z.object({
    name: z
      .string({ required_error: "name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters"),
    email: z
      .string({ required_error: "email is required" })
      .email("Invalid email format")
      .toLowerCase(),
    password: z
      .string({ required_error: "password is required" })
      .min(8, PASSWORD_MSG)
      .max(128, "Password cannot exceed 128 characters")
      .refine((p) => /[A-Z]/.test(p), PASSWORD_MSG)
      .refine((p) => /[0-9]/.test(p), PASSWORD_MSG),
  }),

  login: z.object({
    email: z
      .string({ required_error: "email is required" })
      .email("Invalid email format"),
    password: z
      .string({ required_error: "password is required" })
      .min(1, "Password is required"),
  }),

  query: z.object({
    question: z
      .string({ required_error: "question is required" })
      .trim()
      .min(1, "question is required")
      .max(500, "question cannot exceed 500 characters"),
    sessionId: z.string().nullable().optional(),
  }),

  addBookmark: z.object({
    queryId: z
      .string({ required_error: "queryId is required" })
      .regex(OBJECTID_RE, "queryId must be a valid MongoDB ObjectId"),
    label: z.string().trim().max(100, "label cannot exceed 100 characters").optional(),
  }),

  updateBookmark: z.object({
    label: z
      .string({ required_error: "label is required" })
      .trim()
      .min(1, "label is required")
      .max(100, "label cannot exceed 100 characters"),
  }),
};

// ── Middleware factory ────────────────────────────────────────────────────────

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors
        .map((e) => e.message)
        .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
        .join("; ");
      return res.status(400).json({ success: false, error: message });
    }
    // Replace body with coerced + stripped data (removes unknown keys)
    req.body = result.data;
    next();
  };
}

module.exports = { validate, schemas };
