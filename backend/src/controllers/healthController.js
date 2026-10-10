const mongoose = require("mongoose");

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
    version: "1.0.0",
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    database: {
      provider: "MongoDB",
      status: dbStatus,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
    endpoints: {
      health: "GET /health",
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
    version: "1.0.0",
    healthCheck: "GET /health",
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

module.exports = {
  getHealth,
  getRoot,
  getAlive,
};
