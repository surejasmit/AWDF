const { jobQueueService } = require("../services/jobQueueService");

/**
 * Submit asynchronous task export job
 * POST /api/jobs/export
 * Returns 202 Accepted immediately
 */
const createExportJob = (req, res, next) => {
  try {
    const userId = req.user.id;
    const job = jobQueueService.addJob("export_tasks", {}, userId);

    return res.status(202).json({
      success: true,
      message: "Task export job accepted and is processing asynchronously in the background.",
      jobId: job.id,
      status: job.status,
      statusUrl: `/api/jobs/${job.id}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit asynchronous batch task creation job
 * POST /api/jobs/batch-create
 * Returns 202 Accepted immediately
 */
const createBatchJob = (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must contain an 'items' array of task titles.",
      });
    }

    const job = jobQueueService.addJob("batch_create_tasks", { items }, userId);

    return res.status(202).json({
      success: true,
      message: "Batch task creation job queued successfully.",
      jobId: job.id,
      status: job.status,
      itemCount: items.length,
      statusUrl: `/api/jobs/${job.id}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit asynchronous bulk task completion job
 * POST /api/jobs/bulk-complete
 * Returns 202 Accepted immediately
 */
const createBulkCompleteJob = (req, res, next) => {
  try {
    const userId = req.user.id;
    const job = jobQueueService.addJob("bulk_complete_tasks", {}, userId);

    return res.status(202).json({
      success: true,
      message: "Bulk complete tasks job queued successfully.",
      jobId: job.id,
      status: job.status,
      statusUrl: `/api/jobs/${job.id}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Poll job status and progress
 * GET /api/jobs/:id
 */
const getJobStatus = (req, res, next) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.id;

    const job = jobQueueService.getJob(jobId, userId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all jobs for the authenticated user
 * GET /api/jobs
 */
const listJobs = (req, res, next) => {
  try {
    const userId = req.user.id;
    const jobs = jobQueueService.listJobs(userId);

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Queue telemetry & worker metrics
 * GET /api/jobs/metrics
 */
const getMetrics = (req, res) => {
  return res.status(200).json({
    success: true,
    data: jobQueueService.getMetrics(),
  });
};

module.exports = {
  createExportJob,
  createBatchJob,
  createBulkCompleteJob,
  getJobStatus,
  listJobs,
  getMetrics,
};
