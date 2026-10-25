const { eventBus, EVENTS } = require("../eventBus");
const cache = require("../../utils/cache");

/**
 * Initializes Event-Driven Cache Invalidation Subscribers
 * Decouples cache eviction rules completely from HTTP controllers.
 */
const initCacheSubscribers = () => {
  // 1. When a task is created, invalidate the user's task list cache
  eventBus.subscribe(EVENTS.TASK_CREATED, ({ userId, user }) => {
    const targetUserId = userId || (user && (user.id || user._id));
    cache.invalidateUserTasks(targetUserId);
  });

  // 2. When a task is updated, invalidate both the collection and the single task cache
  eventBus.subscribe(EVENTS.TASK_UPDATED, ({ taskId, task, userId, user }) => {
    const targetUserId = userId || (user && (user.id || user._id));
    const targetTaskId = taskId || (task && (task.id || task._id));
    cache.invalidateUserTasks(targetUserId, targetTaskId);
  });

  // 3. When a task is deleted, invalidate both collection and single task cache
  eventBus.subscribe(EVENTS.TASK_DELETED, ({ taskId, userId, user }) => {
    const targetUserId = userId || (user && (user.id || user._id));
    cache.invalidateUserTasks(targetUserId, taskId);
  });
};

module.exports = {
  initCacheSubscribers,
};
