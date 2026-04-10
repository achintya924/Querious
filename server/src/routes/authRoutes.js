const { Router } = require("express");
const { register, login, me, logout } = require("../controllers/authController");
const auth = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const { auditValidationFailure } = require("../middleware/auditLogger");

const router = Router();

router.post(
  "/register",
  auditValidationFailure("register"),
  validate(schemas.register),
  register
);

router.post(
  "/login",
  auditValidationFailure("login"),
  validate(schemas.login),
  login
);

router.get("/me", auth, me);

// Logout — no auth required: even an invalid/expired token should be clearable
router.post("/logout", logout);

module.exports = router;
