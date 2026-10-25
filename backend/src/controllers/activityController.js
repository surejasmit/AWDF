const ActivityLog = require("../models/ActivityLog");
const { eventBus } = require("../events/eventBus");

/**
 * Get audit / activity logs for the authenticated user
 * GET /api/activities
 */
const getActivities = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const logs = await ActivityLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: logs.length,
      activities: logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system-wide event telemetry metrics
 * GET /api/activities/metrics
 */
const getEventMetrics = (req, res) => {
  return res.status(200).json({
    success: true,
    data: eventBus.getMetrics(),
  });
};

module.exports = {
  getActivities,
  getEventMetrics,
};
