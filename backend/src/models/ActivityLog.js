const mongoose = require("mongoose");

/**
 * ActivityLog Schema
 * Immutable audit trail capturing domain events emitted across the system.
 */
const activityLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["User", "Task", "Job", "System"],
      index: true,
    },
    entityId: {
      type: String,
      default: null,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    userEmail: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    eventId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries by user and timestamp
activityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
