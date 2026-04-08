const { Router } = require("express");
const auth = require("../middleware/auth");
const { processQuery }   = require("../controllers/queryController");
const { getSuggestions } = require("../controllers/suggestionsController");

const router = Router();

router.get("/suggestions", auth, getSuggestions);
router.post("/",           auth, processQuery);

module.exports = router;
