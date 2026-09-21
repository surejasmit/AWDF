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
 */
const createTask = async (title, userId) => {
  const task = new Task({
    title: title.trim(),
    completed: false,
    user: userId,
  });

  const savedTask = await task.save();
  return savedTask.toJSON();
};

/**
 * Update an existing task belonging to the user
 */
const updateTask = async (taskId, { title, completed }, userId) => {
  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (completed !== undefined) updateData.completed = completed;

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
