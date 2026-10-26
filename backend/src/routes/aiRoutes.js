const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const authMiddleware = require("../middleware/auth");

// All AI suggestion endpoints require authenticated user
router.use(authMiddleware);

router.post("/suggest", aiController.analyzeTask);
router.post("/analyze", aiController.analyzeTask);

module.exports = router;
