require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoute");
const taskRoutes = require("./routes/taskroute");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

// Protected Task Routes
app.use("/tasks", taskRoutes);
app.use("/task", taskRoutes);
app.use("/data/RRtc9VpCYGqGScXzitZ5", taskRoutes);
app.use("/data/RRtc9VpCYGqGScXzitZ5.json", taskRoutes);

// Root endpoint healthcheck
app.get("/", (req, res) => {
  res.json({
    name: "Task Management API",
    status: "online",
    auth: {
      register: "POST /auth/register",
      login: "POST /auth/login",
      profile: "GET /auth/me",
    },
    tasks: "ALL /tasks (protected with Bearer JWT)",
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;