const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const authMiddleware = require("../middleware/auth");

// Public event metrics
router.get("/metrics", activityController.getEventMetrics);

// Authenticated activity stream
router.get("/", authMiddleware, activityController.getActivities);

module.exports = router;
