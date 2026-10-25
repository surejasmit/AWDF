const EventEmitter = require("events");

/**
 * Standard Domain Event Constants
 */
const EVENTS = Object.freeze({
  // User lifecycle events
  USER_REGISTERED: "user.registered",
  USER_LOGGED_IN: "user.logged_in",

  // Task lifecycle events
  TASK_CREATED: "task.created",
  TASK_UPDATED: "task.updated",
  TASK_DELETED: "task.deleted",

  // Background Job Queue events
  JOB_QUEUED: "job.queued",
  JOB_STARTED: "job.started",
  JOB_COMPLETED: "job.completed",
  JOB_FAILED: "job.failed",
});

/**
 * Enterprise EventBus extending Node.js EventEmitter
 * Provides safe asynchronous publish, decoupled listener execution, and telemetry.
 */
class AppEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase listener limit to accommodate multiple subscribers per domain event
    this.setMaxListeners(30);

    // In-memory telemetry counter for event monitoring
    this.telemetry = {
      publishedCount: 0,
      processedCount: 0,
      failedCount: 0,
      eventsByType: {},
    };
  }

  /**
   * Publish an event safely without blocking the caller's execution thread
   * @param {string} eventName - One of EVENTS constants
   * @param {object} payload - Structured event payload
   */
  publish(eventName, payload = {}) {
    const enrichedPayload = {
      ...payload,
      _eventId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      _timestamp: new Date().toISOString(),
    };

    // Telemetry bookkeeping
    this.telemetry.publishedCount++;
    this.telemetry.eventsByType[eventName] = (this.telemetry.eventsByType[eventName] || 0) + 1;

    // Use setImmediate to ensure event delivery is truly asynchronous and decoupled
    // from the calling HTTP request/response tick
    setImmediate(() => {
      try {
        this.emit(eventName, enrichedPayload);
      } catch (err) {
        this.telemetry.failedCount++;
        console.error(`[EventBus] Uncaught synchronous error in listener for "${eventName}":`, err.message);
      }
    });

    return enrichedPayload;
  }

  /**
   * Subscribe an async handler to an event with error boundary
   * @param {string} eventName
   * @param {Function} handler - Async or sync function
   */
  subscribe(eventName, handler) {
    const safeWrapper = async (payload) => {
      try {
        await handler(payload);
        this.telemetry.processedCount++;
      } catch (error) {
        this.telemetry.failedCount++;
        console.error(`[EventBus] Listener failure on event "${eventName}" (EventID: ${payload._eventId}):`, error.message);
      }
    };

    this.on(eventName, safeWrapper);
    return () => this.off(eventName, safeWrapper);
  }

  /**
   * Retrieve EventBus health, listener counts, and telemetry stats
   */
  getMetrics() {
    const eventNames = this.eventNames();
    const listenersPerEvent = {};
    for (const name of eventNames) {
      listenersPerEvent[name] = this.listenerCount(name);
    }

    return {
      activeSubscribers: listenersPerEvent,
      totalRegisteredEvents: eventNames.length,
      publishedCount: this.telemetry.publishedCount,
      processedCount: this.telemetry.processedCount,
      failedCount: this.telemetry.failedCount,
      eventsByType: this.telemetry.eventsByType,
    };
  }

  /**
   * Reset telemetry counters (useful for unit tests)
   */
  resetTelemetry() {
    this.telemetry = {
      publishedCount: 0,
      processedCount: 0,
      failedCount: 0,
      eventsByType: {},
    };
  }
}

// Singleton instance across the application lifecycle
const eventBus = new AppEventBus();

module.exports = {
  eventBus,
  EVENTS,
};
