const taskService = require("../service/Taskservice");

// Helper to extract text from standard JSON or Firestore payload structure
const extractText = (body) => {
  if (!body) return "";
  if (typeof body.text === "string" && body.text) return body.text;
  if (typeof body.title === "string" && body.title) return body.title;
  if (body.fields && body.fields.text) {
    return body.fields.text.stringValue || body.fields.text || "";
  }
  return "";
};

// Helper to extract completed status
const extractCompleted = (body) => {
  if (!body) return undefined;
  if (typeof body.completed === "boolean") return body.completed;
  if (body.fields && body.fields.completed) {
    return body.fields.completed.booleanValue;
  }
  return undefined;
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await taskService.getAllTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const text = extractText(req.body);
    if (!text) {
      return res.status(400).json({ message: "Task text is required" });
    }

    const newTask = await taskService.createTask(text);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const id = req.params.id;
    const text = extractText(req.body);
    const completed = extractCompleted(req.body);

    const updatedTask = await taskService.updateTask(id, text, completed);
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const id = req.params.id;
    const success = await taskService.deleteTask(id);
    if (!success) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};