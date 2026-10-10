const express = require("express");
const router = express.Router();
const healthController = require("../controllers/healthController");

router.get("/", healthController.getRoot);
router.get("/health", healthController.getHealth);
router.get("/api/health", healthController.getHealth);
// Process-alive check for liveness probes / ALB target group health checks.
// Deliberately ignores DB state so a database outage never causes restart loops.
router.get("/healthz", healthController.getAlive);
router.get("/api/healthz", healthController.getAlive);

module.exports = router;
