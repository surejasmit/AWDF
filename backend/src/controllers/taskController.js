const taskService = require("../services/taskService");
const emailService = require("../services/emailService");
const User = require("../models/User");

/**
 * Get all tasks for the authenticated user
 * GET /tasks
 */
const getAllTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tasks = await taskService.getAllTasks(userId);
    return res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific task by ID
 * GET /tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const task = await taskService.getTaskById(taskId, userId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 * POST /tasks
 */
const createTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const title = req.validatedTitle || req.body.title || req.body.text;

    const newTask = await taskService.createTask(title, userId);
    return res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing task
 * PUT /tasks/:id or PATCH /tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const title = req.validatedTitle;
    const completed = req.validatedCompleted;

    const updatedTask = await taskService.updateTask(taskId, { title, completed }, userId);
    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // Send task update notification email asynchronously
    (async () => {
      let user = req.user;
      if (!user || !user.email) {
        user = await User.findById(userId);
      }
      if (user && user.email) {
        await emailService.sendTaskUpdateEmail(user, updatedTask);
      }
    })().catch((err) => {
      console.warn("Task update email error:", err.message);
    });

    return res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a task by ID
 * DELETE /tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const deleted = await taskService.deleteTask(taskId, userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
