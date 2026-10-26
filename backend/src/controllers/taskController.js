const taskService = require("../services/taskService");
const cache = require("../utils/cache");
const { eventBus, EVENTS } = require("../events/eventBus");

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
 * Publishes TASK_CREATED event to EventBus (triggers async audit trail, notifications & cache eviction)
 */
const createTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const title = req.validatedTitle || req.body.title || req.body.text;
    const { description, priority, dueDate, subtasks, aiGenerated } = req.body;

    const newTask = await taskService.createTask(
      { title, description, priority, dueDate, subtasks, aiGenerated },
      userId
    );

    // Invalidate local cache
    cache.invalidateUserTasks(userId);

    // Publish domain event to EventBus for decoupled background listeners
    eventBus.publish(EVENTS.TASK_CREATED, {
      task: newTask,
      user: req.user,
      userId,
    });

    return res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing task
 * PUT /tasks/:id or PATCH /tasks/:id
 * Publishes TASK_UPDATED event to EventBus (triggers async email, audit log & cache eviction)
 */
const updateTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const title = req.validatedTitle !== undefined ? req.validatedTitle : req.body.title;
    const completed = req.validatedCompleted !== undefined ? req.validatedCompleted : req.body.completed;
    const { description, priority, dueDate, subtasks, aiGenerated } = req.body;

    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (completed !== undefined) updatePayload.completed = completed;
    if (description !== undefined) updatePayload.description = description;
    if (priority !== undefined) updatePayload.priority = priority;
    if (dueDate !== undefined) updatePayload.dueDate = dueDate;
    if (subtasks !== undefined) updatePayload.subtasks = subtasks;
    if (aiGenerated !== undefined) updatePayload.aiGenerated = aiGenerated;

    const updatedTask = await taskService.updateTask(taskId, updatePayload, userId);
    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // Invalidate local cache
    cache.invalidateUserTasks(userId, taskId);

    // Publish domain event to EventBus for asynchronous background handling
    eventBus.publish(EVENTS.TASK_UPDATED, {
      task: updatedTask,
      user: req.user,
      userId,
      updates: updatePayload,
    });

    return res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a task by ID
 * DELETE /tasks/:id
 * Publishes TASK_DELETED event to EventBus (triggers async audit log & cache eviction)
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

    // Invalidate local cache
    cache.invalidateUserTasks(userId, taskId);

    // Publish domain event to EventBus
    eventBus.publish(EVENTS.TASK_DELETED, {
      taskId,
      user: req.user,
      userId,
    });

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
