const { Router } = require("express");
const auth = require("../middleware/auth");
const { getSchema } = require("../controllers/schemaController");

const router = Router();

router.get("/", auth, getSchema);

module.exports = router;
