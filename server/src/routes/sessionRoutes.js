const { Router } = require("express");
const auth = require("../middleware/auth");
const { createNewSession, fetchSession, deleteSession } = require("../controllers/sessionController");

const router = Router();

router.post("/",       auth, createNewSession);
router.get("/:id",     auth, fetchSession);
router.delete("/:id",  auth, deleteSession);

module.exports = router;
