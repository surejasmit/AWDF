const express = require('express');
const cors = require('cors');
const taskService = require('./service/Taskservice');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const extractText = (body) => {
  if (!body) return "";
  if (typeof body.text === "string" && body.text) return body.text;
  if (typeof body.title === "string" && body.title) return body.title;
  if (body.fields && body.fields.text) {
    return body.fields.text.stringValue || body.fields.text || "";
  }
  return "";
};

const getAllTasks = async (req, res) => {
  try {
    const tasks = await taskService.getAllTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTask = async (req, res) => {
  try {
    const text = extractText(req.body);
    if (!text) return res.status(400).json({ message: "Task text is required" });
    const newTask = await taskService.createTask(text);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const text = extractText(req.body);
    const completed = typeof req.body.completed === "boolean" ? req.body.completed : undefined;
    const updated = await taskService.updateTask(req.params.id, text, completed);
    if (!updated) return res.status(404).json({ message: "Task not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const success = await taskService.deleteTask(req.params.id);
    if (!success) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.get('/tasks', getAllTasks);
app.post('/tasks', createTask);
app.get('/tasks/:id', getTaskById);
app.put('/tasks/:id', updateTask);
app.patch('/tasks/:id', updateTask);
app.delete('/tasks/:id', deleteTask);

app.get(['/data/RRtc9VpCYGqGScXzitZ5', '/data/RRtc9VpCYGqGScXzitZ5.json'], getAllTasks);
app.post(['/data/RRtc9VpCYGqGScXzitZ5', '/data/RRtc9VpCYGqGScXzitZ5.json'], createTask);
app.put(['/data/RRtc9VpCYGqGScXzitZ5/:id', '/data/RRtc9VpCYGqGScXzitZ5/:id.json'], updateTask);
app.patch(['/data/RRtc9VpCYGqGScXzitZ5/:id', '/data/RRtc9VpCYGqGScXzitZ5/:id.json'], updateTask);
app.delete(['/data/RRtc9VpCYGqGScXzitZ5/:id', '/data/RRtc9VpCYGqGScXzitZ5/:id.json'], deleteTask);

app.get('/task/all', getAllTasks);
app.get('/task/:id', getTaskById);
app.post('/task/save', createTask);
app.put('/task/update/:id', updateTask);
app.delete('/task/delete/:id', deleteTask);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (with Firebase sync)`);
});
