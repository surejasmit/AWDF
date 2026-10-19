const { eventBus, EVENTS } = require("../eventBus");
const emailService = require("../../services/emailService");
const User = require("../../models/User");

/**
 * Initializes Email Notification Event Subscribers
 */
const initEmailSubscribers = () => {
  // 1. Asynchronously send welcome email when a user registers
  eventBus.subscribe(EVENTS.USER_REGISTERED, async ({ user }) => {
    if (!user || !user.email) return;
    try {
      await emailService.sendWelcomeEmail(user);
    } catch (err) {
      console.warn(`[EmailSubscriber] Failed to send welcome email to ${user.email}:`, err.message);
    }
  });

  // 2. Asynchronously send task update email when a task is updated
  eventBus.subscribe(EVENTS.TASK_UPDATED, async ({ task, user, userId }) => {
    try {
      let recipient = user;
      const targetUserId = userId || (user && user.id) || (task && task.user);

      if (!recipient || !recipient.email) {
        if (targetUserId) {
          recipient = await User.findById(targetUserId);
        }
      }

      if (recipient && recipient.email) {
        await emailService.sendTaskUpdateEmail(recipient, task);
      }
    } catch (err) {
      console.warn("[EmailSubscriber] Failed to send task update email:", err.message);
    }
  });
};

module.exports = {
  initEmailSubscribers,
};
