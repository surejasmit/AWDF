const { initEmailSubscribers } = require("./emailSubscriber");
const { initAuditSubscribers } = require("./auditSubscriber");
const { initCacheSubscribers } = require("./cacheSubscriber");

/**
 * Register all application event subscribers
 * Called once during server boot up
 */
const registerAllSubscribers = () => {
  initEmailSubscribers();
  initAuditSubscribers();
  initCacheSubscribers();
  console.log("⚡ [EventBus] All event subscribers registered successfully (Email, Audit Trail, Cache Invalidation).");
};

module.exports = {
  registerAllSubscribers,
};
