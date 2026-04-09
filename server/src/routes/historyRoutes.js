const { Router } = require("express");
const auth = require("../middleware/auth");
const {
  getHistory,
  getHistoryById,
  deleteHistoryItem,
  clearHistory,
} = require("../controllers/historyController");

const router = Router();

router.get("/",      auth, getHistory);
router.get("/:id",   auth, getHistoryById);
router.delete("/",   auth, clearHistory);
router.delete("/:id", auth, deleteHistoryItem);

module.exports = router;
