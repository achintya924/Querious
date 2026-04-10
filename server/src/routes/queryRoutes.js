const { Router } = require("express");
const auth = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const { processQuery }   = require("../controllers/queryController");
const { getSuggestions } = require("../controllers/suggestionsController");

const router = Router();

router.get("/suggestions", auth, getSuggestions);
router.post("/",           auth, validate(schemas.query), processQuery);

module.exports = router;
