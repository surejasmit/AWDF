const express = require("express");
const router = express.Router();
const healthController = require("../controllers/healthController");

router.get("/", healthController.getRoot);
router.get("/health", healthController.getHealth);
router.get("/api/health", healthController.getHealth);

// Process-alive check for liveness probes / ALB target group health checks.
router.get("/healthz", healthController.getAlive);
router.get("/api/healthz", healthController.getAlive);

// Public Cache Statistics debug endpoint (Practical 9)
router.get("/cache-stats", healthController.getCacheStats);
router.get("/api/cache-stats", healthController.getCacheStats);

module.exports = router;
