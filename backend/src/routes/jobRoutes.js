const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const authMiddleware = require("../middleware/auth");

// Public queue health metrics
router.get("/metrics", jobController.getMetrics);

// All job operations require authentication
router.use(authMiddleware);

// Job submission endpoints (202 Accepted)
router.post("/export", jobController.createExportJob);
router.post("/batch-create", jobController.createBatchJob);
router.post("/bulk-complete", jobController.createBulkCompleteJob);

// Job listing & status endpoints
router.get("/", jobController.listJobs);
router.get("/:id", jobController.getJobStatus);

module.exports = router;
