const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const healthRoutes = require("./routes/healthRoutes");
const jobRoutes = require("./routes/jobRoutes");
const activityRoutes = require("./routes/activityRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { registerAllSubscribers } = require("./events/subscribers");

// Initialize Event-Driven Architecture subscribers
registerAllSubscribers();

const app = express();

// CORS configuration
const allowedOrigin = process.env.CLIENT_URL || "*";
app.use(
  cors({
    origin: allowedOrigin === "*" ? true : [allowedOrigin, "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Route handlers
app.use("/", healthRoutes);
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/task", taskRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/jobs", jobRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/activities", activityRoutes);
app.use("/api/activities", activityRoutes);
app.use("/ai", aiRoutes);
app.use("/api/ai", aiRoutes);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
