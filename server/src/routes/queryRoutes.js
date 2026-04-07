const { Router } = require("express");
const auth = require("../middleware/auth");
const { processQuery } = require("../controllers/queryController");

const router = Router();

router.post("/", auth, processQuery);

module.exports = router;
