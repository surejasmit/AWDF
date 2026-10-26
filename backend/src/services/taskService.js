const Task = require("../models/Task");

/**
 * Retrieve all tasks belonging to an authenticated user
 */
const getAllTasks = async (userId) => {
  const tasks = await Task.find({ user: userId }).sort({ createdAt: -1 });
  return tasks.map((t) => t.toJSON());
};

/**
 * Retrieve a specific task by ID, strictly scoped to the user
 */
const getTaskById = async (taskId, userId) => {
  const task = await Task.findOne({ _id: taskId, user: userId });
  return task ? task.toJSON() : null;
};

/**
 * Create a new task associated with the user in MongoDB
 * Supports both string title and structured object (with description, priority, dueDate, etc.)
 */
const createTask = async (taskInput, userId) => {
  let title;
  const extra = {};

  if (typeof taskInput === "string") {
    title = taskInput.trim();
  } else {
    title = (taskInput.title || taskInput.text || "").trim();
    if (taskInput.description !== undefined) extra.description = taskInput.description;
    if (taskInput.priority !== undefined) extra.priority = taskInput.priority;
    if (taskInput.dueDate !== undefined) extra.dueDate = taskInput.dueDate;
    if (taskInput.subtasks !== undefined) extra.subtasks = taskInput.subtasks;
    if (taskInput.aiGenerated !== undefined) extra.aiGenerated = taskInput.aiGenerated;
  }

  const task = new Task({
    title,
    completed: false,
    user: userId,
    ...extra,
  });

  const savedTask = await task.save();
  return savedTask.toJSON();
};

/**
 * Update an existing task belonging to the user
 */
const updateTask = async (taskId, updatePayload, userId) => {
  const updateData = {};
  if (updatePayload.title !== undefined) updateData.title = updatePayload.title.trim();
  if (updatePayload.completed !== undefined) updateData.completed = updatePayload.completed;
  if (updatePayload.description !== undefined) updateData.description = updatePayload.description;
  if (updatePayload.priority !== undefined) updateData.priority = updatePayload.priority;
  if (updatePayload.dueDate !== undefined) updateData.dueDate = updatePayload.dueDate;
  if (updatePayload.subtasks !== undefined) updateData.subtasks = updatePayload.subtasks;
  if (updatePayload.aiGenerated !== undefined) updateData.aiGenerated = updatePayload.aiGenerated;

  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId, user: userId },
    updateData,
    { returnDocument: "after", runValidators: true }
  );

  return updatedTask ? updatedTask.toJSON() : null;
};

/**
 * Delete a task belonging to the user
 */
const deleteTask = async (taskId, userId) => {
  const result = await Task.findOneAndDelete({ _id: taskId, user: userId });
  return !!result;
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
