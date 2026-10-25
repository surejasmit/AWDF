const mongoose = require("mongoose");
const { eventBus, EVENTS } = require("../eventBus");
const ActivityLog = require("../../models/ActivityLog");

/**
 * Initializes Audit / Event Trail Subscribers
 */
const initAuditSubscribers = () => {
  // Helper to record log safely
  const logActivity = async ({ event, action, entityType, entityId, userId, userEmail, details, eventId }) => {
    // If DB is disconnected or mocking without DB connection, skip DB write gracefully
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    try {
      await ActivityLog.create({
        event,
        action,
        entityType,
        entityId,
        user: userId || null,
        userEmail: userEmail || null,
        details: details || {},
        eventId: eventId || null,
      });
    } catch (err) {
      console.warn(`[AuditSubscriber] Failed to record activity log for ${event}:`, err.message);
    }
  };

  // User Registered
  eventBus.subscribe(EVENTS.USER_REGISTERED, async ({ user, _eventId }) => {
    await logActivity({
      event: EVENTS.USER_REGISTERED,
      action: "REGISTER",
      entityType: "User",
      entityId: user ? user.id || user._id : null,
      userId: user ? user.id || user._id : null,
      userEmail: user ? user.email : null,
      details: { name: user ? user.name : null },
      eventId: _eventId,
    });
  });

  // User Logged In
  eventBus.subscribe(EVENTS.USER_LOGGED_IN, async ({ user, _eventId }) => {
    await logActivity({
      event: EVENTS.USER_LOGGED_IN,
      action: "LOGIN",
      entityType: "User",
      entityId: user ? user.id || user._id : null,
      userId: user ? user.id || user._id : null,
      userEmail: user ? user.email : null,
      details: { email: user ? user.email : null },
      eventId: _eventId,
    });
  });

  // Task Created
  eventBus.subscribe(EVENTS.TASK_CREATED, async ({ task, user, userId, _eventId }) => {
    await logActivity({
      event: EVENTS.TASK_CREATED,
      action: "CREATE_TASK",
      entityType: "Task",
      entityId: task ? task.id || task._id : null,
      userId: userId || (user && (user.id || user._id)),
      userEmail: user ? user.email : null,
      details: { title: task ? task.title : null },
      eventId: _eventId,
    });
  });

  // Task Updated
  eventBus.subscribe(EVENTS.TASK_UPDATED, async ({ task, user, userId, updates, _eventId }) => {
    await logActivity({
      event: EVENTS.TASK_UPDATED,
      action: "UPDATE_TASK",
      entityType: "Task",
      entityId: task ? task.id || task._id : null,
      userId: userId || (user && (user.id || user._id)),
      userEmail: user ? user.email : null,
      details: { updates: updates || {}, title: task ? task.title : null, completed: task ? task.completed : null },
      eventId: _eventId,
    });
  });

  // Task Deleted
  eventBus.subscribe(EVENTS.TASK_DELETED, async ({ taskId, user, userId, _eventId }) => {
    await logActivity({
      event: EVENTS.TASK_DELETED,
      action: "DELETE_TASK",
      entityType: "Task",
      entityId: taskId,
      userId: userId || (user && (user.id || user._id)),
      userEmail: user ? user.email : null,
      details: { taskId },
      eventId: _eventId,
    });
  });

  // Job Completed
  eventBus.subscribe(EVENTS.JOB_COMPLETED, async ({ job, _eventId }) => {
    await logActivity({
      event: EVENTS.JOB_COMPLETED,
      action: "JOB_COMPLETE",
      entityType: "Job",
      entityId: job ? job.id : null,
      userId: job ? job.userId : null,
      details: { type: job ? job.type : null, processedItems: job ? job.processedItems : 0 },
      eventId: _eventId,
    });
  });
};

module.exports = {
  initAuditSubscribers,
};
