require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Fail fast in production if JWT_SECRET is missing or still the development default
if (NODE_ENV === "production") {
  const secret = process.env.JWT_SECRET || "";
  if (!secret || secret.includes("development")) {
    console.error(
      "❌ FATAL: JWT_SECRET must be set to a strong, unique value when NODE_ENV=production."
    );
    process.exit(1);
  }
}

// Connect to MongoDB
connectDB();

// Start HTTP Server (bound to all interfaces so it is reachable inside containers/pods)
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Task Management API server listening on http://0.0.0.0:${PORT} [${NODE_ENV}]`);
  console.log(`📡 Healthcheck available at: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
const handleShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log("🔌 HTTP server closed.");
    try {
      await mongoose.connection.close();
      console.log("📦 MongoDB connection closed.");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    }
    process.exit(0);
  });
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

module.exports = server;
