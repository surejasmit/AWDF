const NodeCache = require("node-cache");

// Configurable standard Time-To-Live (TTL) in seconds (default: 60s)
const DEFAULT_TTL = process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL, 10) : 60;

/**
 * Shared in-memory cache instance (node-cache)
 * stdTTL: default expiration time in seconds
 * checkperiod: automatic deletion check interval in seconds
 * useClones: false allows fast reference retrieval without deep cloning overhead
 */
const cache = new NodeCache({
  stdTTL: DEFAULT_TTL,
  checkperiod: 120,
  useClones: false,
});

/**
 * Generate a cache key for a user's task list
 * Ensures strict user data isolation so User A never sees User B's cached tasks.
 */
cache.getUserTasksKey = (userId) => {
  return userId ? `tasks_user_${userId}` : "all_tasks";
};

/**
 * Generate a cache key for a single task
 */
cache.getSingleTaskKey = (userId, taskId) => {
  return userId ? `task_user_${userId}_${taskId}` : `task_${taskId}`;
};

/**
 * Invalidate cache for a specific user and optional single task key
 * Called immediately after any write operation (POST, PUT, PATCH, DELETE)
 */
cache.invalidateUserTasks = (userId, taskId = null) => {
  const keysToDelete = ["all_tasks"];

  if (userId) {
    keysToDelete.push(cache.getUserTasksKey(userId));
    if (taskId) {
      keysToDelete.push(cache.getSingleTaskKey(userId, taskId));
    }
  } else if (taskId) {
    keysToDelete.push(`task_${taskId}`);
  }

  cache.del(keysToDelete);
};

/**
 * Return detailed hit/miss statistics and cache metadata
 * Used for debugging, monitoring, and performance benchmarking.
 */
cache.getDetailedStats = () => {
  const stats = cache.getStats();
  const total = stats.hits + stats.misses;
  const hitRatio = total > 0 ? ((stats.hits / total) * 100).toFixed(2) + "%" : "0.00%";

  return {
    hits: stats.hits,
    misses: stats.misses,
    totalRequests: total,
    hitRatio,
    activeKeysCount: cache.keys().length,
    keys: cache.keys(),
    ttlSeconds: DEFAULT_TTL,
    ksize: stats.ksize,
    vsize: stats.vsize,
  };
};

module.exports = cache;
