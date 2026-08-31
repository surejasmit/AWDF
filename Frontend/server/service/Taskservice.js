const Task = require("../models/Task");
const mongoose = require("mongoose");

// Fallback in-memory store if MongoDB is not connected
let localMemoryTasks = [];

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Get all tasks for a specific user
 */
exports.getAllTasks = async (userId) => {
  if (isDbConnected()) {
    try {
      const query = userId ? { user: userId } : {};
      const tasks = await Task.find(query).sort({ createdAt: -1 });
      return tasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        text: t.title,
        completed: t.completed,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    } catch (err) {
      console.warn("MongoDB Task find error, using fallback:", err.message);
    }
  }

  const userTasks = userId
    ? localMemoryTasks.filter((t) => String(t.user) === String(userId))
    : localMemoryTasks;
  return userTasks;
};

/**
 * Get single task by ID
 */
exports.getTaskById = async (id, userId) => {
  if (isDbConnected()) {
    try {
      const query = { _id: id };
      if (userId) query.user = userId;
      const task = await Task.findOne(query);
      if (task) {
        return {
          id: task._id.toString(),
          title: task.title,
          text: task.title,
          completed: task.completed,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
      }
      return null;
    } catch (err) {
      console.warn("MongoDB getTaskById error:", err.message);
    }
  }

  return (
    localMemoryTasks.find(
      (t) => String(t.id) === String(id) && (!userId || String(t.user) === String(userId))
    ) || null
  );
};

/**
 * Create a new task for the authenticated user
 */
exports.createTask = async (title, userId) => {
  if (isDbConnected() && userId) {
    try {
      const task = new Task({
        title,
        completed: false,
        user: userId,
      });
      const savedTask = await task.save();
      return {
        id: savedTask._id.toString(),
        title: savedTask.title,
        text: savedTask.title,
        completed: savedTask.completed,
        createdAt: savedTask.createdAt,
        updatedAt: savedTask.updatedAt,
      };
    } catch (err) {
      console.warn("MongoDB Task creation error, using fallback:", err.message);
    }
  }

  const fallbackTask = {
    id: String(Date.now()),
    title,
    text: title,
    completed: false,
    user: userId || "default",
    createdAt: new Date().toISOString(),
  };
  localMemoryTasks.unshift(fallbackTask);
  return fallbackTask;
};

/**
 * Update an existing task
 */
exports.updateTask = async (id, title, completed, userId) => {
  if (isDbConnected()) {
    try {
      const query = { _id: id };
      if (userId) query.user = userId;

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (completed !== undefined) updateData.completed = completed;

      const updated = await Task.findOneAndUpdate(query, updateData, {
        returnDocument: "after",
        runValidators: true,
      });

      if (updated) {
        return {
          id: updated._id.toString(),
          title: updated.title,
          text: updated.title,
          completed: updated.completed,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      }
      return null;
    } catch (err) {
      console.warn("MongoDB updateTask error:", err.message);
    }
  }

  const index = localMemoryTasks.findIndex(
    (t) => String(t.id) === String(id) && (!userId || String(t.user) === String(userId))
  );

  if (index !== -1) {
    localMemoryTasks[index] = {
      ...localMemoryTasks[index],
      ...(title !== undefined ? { title, text: title } : {}),
      ...(completed !== undefined ? { completed } : {}),
      updatedAt: new Date().toISOString(),
    };
    return localMemoryTasks[index];
  }

  return null;
};

/**
 * Delete task by ID
 */
exports.deleteTask = async (id, userId) => {
  if (isDbConnected()) {
    try {
      const query = { _id: id };
      if (userId) query.user = userId;
      const result = await Task.findOneAndDelete(query);
      return !!result;
    } catch (err) {
      console.warn("MongoDB deleteTask error:", err.message);
    }
  }

  const initialLen = localMemoryTasks.length;
  localMemoryTasks = localMemoryTasks.filter(
    (t) => !(String(t.id) === String(id) && (!userId || String(t.user) === String(userId)))
  );
  return localMemoryTasks.length < initialLen;
};
