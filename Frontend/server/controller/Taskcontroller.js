const taskService = require("../service/Taskservice");

// Helper to extract text from standard JSON or Firestore/RTDB payload structure
const extractText = (req) => {
  if (req.validatedTitle) return req.validatedTitle;
  const body = req.body;
  if (!body) return "";
  if (typeof body.title === "string" && body.title.trim()) return body.title.trim();
  if (typeof body.text === "string" && body.text.trim()) return body.text.trim();
  if (body.fields && body.fields.text) {
    return body.fields.text.stringValue || body.fields.text || "";
  }
  return "";
};

// Helper to extract completed status
const extractCompleted = (req) => {
  if (req.validatedCompleted !== undefined) return req.validatedCompleted;
  const body = req.body;
  if (!body) return undefined;
  if (typeof body.completed === "boolean") return body.completed;
  if (body.fields && body.fields.completed) {
    return body.fields.completed.booleanValue;
  }
  return undefined;
};

exports.getAllTasks = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const tasks = await taskService.getAllTasks(userId);
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const task = await taskService.getTaskById(req.params.id, userId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const title = extractText(req);
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Validation Error: Task title is required",
      });
    }

    const userId = req.user ? req.user.id : null;
    const newTask = await taskService.createTask(title, userId);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const id = req.params.id;
    const title = extractText(req) || undefined;
    const completed = extractCompleted(req);
    const userId = req.user ? req.user.id : null;

    const updatedTask = await taskService.updateTask(id, title, completed, userId);
    if (!updatedTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user ? req.user.id : null;
    const success = await taskService.deleteTask(id, userId);
    if (!success) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};