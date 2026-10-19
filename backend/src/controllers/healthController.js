const mongoose = require("mongoose");
const cache = require("../utils/cache");
const { eventBus } = require("../events/eventBus");
const { jobQueueService } = require("../services/jobQueueService");

/**
 * Health and Readiness check handler
 * GET /health and GET /api/health
 */
const getHealth = (req, res) => {
  const dbStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbState = mongoose.connection.readyState;
  const dbStatus = dbStateMap[dbState] || "unknown";
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "degraded",
    server: "Task Management API",
    version: "1.1.0",
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    database: {
      provider: "MongoDB",
      status: dbStatus,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
    caching: {
      provider: "node-cache",
      stats: cache.getDetailedStats(),
    },
    eventArchitecture: {
      provider: "Node.js EventEmitter EventBus",
      metrics: eventBus.getMetrics(),
    },
    jobQueue: {
      provider: "In-Memory Asynchronous Worker Queue",
      metrics: jobQueueService.getMetrics(),
    },
    endpoints: {
      health: "GET /health",
      cacheStats: "GET /api/cache-stats",
      eventMetrics: "GET /api/activities/metrics",
      jobMetrics: "GET /api/jobs/metrics",
      auth: {
        register: "POST /auth/register",
        login: "POST /auth/login",
        me: "GET /auth/me",
      },
      tasks: {
        list: "GET /tasks",
        create: "POST /tasks",
        getById: "GET /tasks/:id",
        update: "PUT /tasks/:id",
        delete: "DELETE /tasks/:id",
        cacheStats: "GET /tasks/cache/stats",
      },
      jobs: {
        export: "POST /api/jobs/export",
        batchCreate: "POST /api/jobs/batch-create",
        bulkComplete: "POST /api/jobs/bulk-complete",
        status: "GET /api/jobs/:id",
        list: "GET /api/jobs",
      },
      activities: {
        list: "GET /api/activities",
      },
    },
  });
};

/**
 * Root endpoint overview
 * GET /
 */
const getRoot = (req, res) => {
  res.status(200).json({
    name: "AWDF Task Management & Portfolio API",
    status: "online",
    version: "1.1.0",
    features: ["In-Memory Caching (node-cache)", "Event-Driven Architecture", "Asynchronous Job Queue"],
    healthCheck: "GET /health",
    cacheStats: "GET /api/cache-stats",
    eventMetrics: "GET /api/activities/metrics",
    documentation: "See docs/API.md",
  });
};

/**
 * Liveness / load-balancer health check handler
 * GET /healthz - returns 200 whenever the process is running.
 */
const getAlive = (req, res) => {
  res.status(200).json({ status: "alive", timestamp: new Date().toISOString() });
};

/**
 * Public Cache Statistics handler (Practical 9 debug endpoint)
 * GET /cache-stats and GET /api/cache-stats
 */
const getCacheStats = (req, res) => {
  res.status(200).json({
    status: "ok",
    caching: cache.getDetailedStats(),
  });
};

module.exports = {
  getHealth,
  getRoot,
  getAlive,
  getCacheStats,
};
