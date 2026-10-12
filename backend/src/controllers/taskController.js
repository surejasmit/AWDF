const taskService = require("../services/taskService");
const emailService = require("../services/emailService");
const User = require("../models/User");
const cache = require("../utils/cache");

/**
 * Get all tasks for the authenticated user
 * GET /tasks
 * Checks cache first: HIT -> return cached, MISS -> query MongoDB and store in cache
 */
const getAllTasks = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const cacheKey = cache.getUserTasksKey(userId);

    // 1. In-memory cache lookup
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cached);
    }

    // 2. Cache miss: query database
    const tasks = await taskService.getAllTasks(userId);

    // 3. Store query result in cache
    cache.set(cacheKey, tasks);
    res.setHeader("X-Cache", "MISS");
    return res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific task by ID
 * GET /tasks/:id
 * Implements single-task endpoint caching with dedicated key
 */
const getTaskById = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const taskId = req.params.id;
    const cacheKey = cache.getSingleTaskKey(userId, taskId);

    // 1. In-memory cache lookup
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cached);
    }

    // 2. Cache miss: query database
    const task = await taskService.getTaskById(taskId, userId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // 3. Store single task in cache
    cache.set(cacheKey, task);
    res.setHeader("X-Cache", "MISS");
    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 * POST /tasks
 * Invalidates user task collection cache on successful write
 */
const createTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const title = req.validatedTitle || req.body.title || req.body.text;

    const newTask = await taskService.createTask(title, userId);

    // Cache Invalidation: invalidate user tasks list so newly created task appears immediately
    cache.invalidateUserTasks(userId);

    return res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing task
 * PUT /tasks/:id or PATCH /tasks/:id
 * Invalidates both the collection cache and the single task cache on write
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

    // Cache Invalidation: clear stale cached list and cached individual task
    cache.invalidateUserTasks(userId, taskId);

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
 * Invalidates both the collection cache and the single task cache on delete
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

    // Cache Invalidation: remove deleted item from cache immediately
    cache.invalidateUserTasks(userId, taskId);

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get cache hit/miss statistics and active keys
 * GET /tasks/cache/stats
 */
const getCacheStats = (req, res) => {
  return res.status(200).json({
    success: true,
    data: cache.getDetailedStats(),
  });
};

/**
 * Flush all cached entries (manual reset for benchmarking/testing)
 * POST /tasks/cache/clear
 */
const clearCache = (req, res) => {
  cache.flushAll();
  return res.status(200).json({
    success: true,
    message: "Cache flushed successfully.",
    data: cache.getDetailedStats(),
  });
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getCacheStats,
  clearCache,
};
