const { eventBus, EVENTS } = require("../events/eventBus");
const taskService = require("./taskService");

/**
 * Job Status Enum
 */
const JOB_STATUS = Object.freeze({
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
});

/**
 * Enterprise In-Memory Asynchronous Job Queue & Worker Service
 * Simulates a production message queue (e.g. BullMQ / Celery / SQS) using Node.js event loop
 */
class JobQueueService {
  constructor() {
    this.jobs = new Map();
    this.queue = [];
    this.isProcessing = false;
    this.concurrency = 2; // Process up to 2 concurrent jobs
    this.activeWorkers = 0;
  }

  /**
   * Submit a new background job to the queue
   * Returns immediately with 202 Accepted semantics
   */
  addJob(type, payload = {}, userId = null) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const job = {
      id: jobId,
      type,
      userId: userId ? userId.toString() : null,
      status: JOB_STATUS.QUEUED,
      progress: 0,
      payload,
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);

    // Publish event
    eventBus.publish(EVENTS.JOB_QUEUED, { job });

    // Trigger queue consumer asynchronously
    setImmediate(() => this.processNext());

    return job;
  }

  /**
   * Worker loop to process queued jobs
   */
  async processNext() {
    if (this.activeWorkers >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const jobId = this.queue.shift();
    const job = this.jobs.get(jobId);
    if (!job || job.status !== JOB_STATUS.QUEUED) {
      return;
    }

    this.activeWorkers++;
    job.status = JOB_STATUS.PROCESSING;
    job.startedAt = new Date().toISOString();
    job.progress = 10;

    eventBus.publish(EVENTS.JOB_STARTED, { job });

    try {
      // Execute the job based on its type
      const result = await this.executeJob(job);

      job.status = JOB_STATUS.COMPLETED;
      job.progress = 100;
      job.result = result;
      job.completedAt = new Date().toISOString();

      eventBus.publish(EVENTS.JOB_COMPLETED, { job });
    } catch (err) {
      job.status = JOB_STATUS.FAILED;
      job.error = err.message || "Unknown background job error";
      job.completedAt = new Date().toISOString();

      eventBus.publish(EVENTS.JOB_FAILED, { job, error: err.message });
    } finally {
      this.activeWorkers--;
      // Continue draining queue
      setImmediate(() => this.processNext());
    }
  }

  /**
   * Internal job execution dispatcher
   */
  async executeJob(job) {
    const { type, payload, userId } = job;

    switch (type) {
      case "export_tasks": {
        // Fetch all tasks for the user
        const tasks = await taskService.getAllTasks(userId);
        job.progress = 50;

        // Calculate summary metrics
        const total = tasks.length;
        const completedCount = tasks.filter((t) => t.completed).length;
        const pendingCount = total - completedCount;

        job.progress = 90;
        return {
          exportType: "tasks_report",
          generatedAt: new Date().toISOString(),
          userId,
          summary: {
            totalTasks: total,
            completedTasks: completedCount,
            pendingTasks: pendingCount,
            completionRate: total > 0 ? `${((completedCount / total) * 100).toFixed(1)}%` : "0%",
          },
          tasks,
        };
      }

      case "batch_create_tasks": {
        const { items } = payload;
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error("Payload 'items' must be a non-empty array of task titles.");
        }

        const createdTasks = [];
        for (let i = 0; i < items.length; i++) {
          const title = typeof items[i] === "string" ? items[i] : items[i].title;
          if (title && title.trim()) {
            const newTask = await taskService.createTask(title, userId);
            createdTasks.push(newTask);
            // Publish domain event for each task created
            eventBus.publish(EVENTS.TASK_CREATED, { task: newTask, userId });
          }
          job.progress = Math.round(((i + 1) / items.length) * 100);
        }

        return {
          batchSize: items.length,
          createdCount: createdTasks.length,
          tasks: createdTasks,
        };
      }

      case "bulk_complete_tasks": {
        const tasks = await taskService.getAllTasks(userId);
        let updatedCount = 0;

        for (let i = 0; i < tasks.length; i++) {
          const t = tasks[i];
          if (!t.completed) {
            const updated = await taskService.updateTask(t.id || t._id, { completed: true }, userId);
            if (updated) {
              updatedCount++;
              eventBus.publish(EVENTS.TASK_UPDATED, { task: updated, userId });
            }
          }
          job.progress = Math.round(((i + 1) / tasks.length) * 100);
        }

        return {
          totalChecked: tasks.length,
          updatedCount,
        };
      }

      default:
        throw new Error(`Unsupported background job type: '${type}'`);
    }
  }

  /**
   * Retrieve job by ID with user isolation check
   */
  getJob(jobId, userId = null) {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    // Strict user isolation: user can only see their own jobs
    if (userId && job.userId && job.userId !== userId.toString()) {
      return null;
    }

    return job;
  }

  /**
   * List jobs belonging to a specific user
   */
  listJobs(userId = null) {
    const all = Array.from(this.jobs.values());
    if (!userId) return all;
    return all.filter((j) => j.userId === userId.toString());
  }

  /**
   * Queue health and stats
   */
  getMetrics() {
    let queued = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    for (const job of this.jobs.values()) {
      if (job.status === JOB_STATUS.QUEUED) queued++;
      else if (job.status === JOB_STATUS.PROCESSING) processing++;
      else if (job.status === JOB_STATUS.COMPLETED) completed++;
      else if (job.status === JOB_STATUS.FAILED) failed++;
    }

    return {
      totalJobs: this.jobs.size,
      queued,
      processing,
      completed,
      failed,
      activeWorkers: this.activeWorkers,
      concurrency: this.concurrency,
    };
  }

  /**
   * Clear all jobs (for test harness)
   */
  clear() {
    this.jobs.clear();
    this.queue = [];
    this.activeWorkers = 0;
  }
}

// Singleton instance
const jobQueueService = new JobQueueService();

module.exports = {
  jobQueueService,
  JOB_STATUS,
};
