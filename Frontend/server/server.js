const express = require("express");
const cors = require("cors");
const taskRoutes = require("./routes/taskroute");

const app = express();

app.use(cors());
app.use(express.json());

// Forward routes to controller via taskroute
app.use("/data/RRtc9VpCYGqGScXzitZ5", taskRoutes);
app.use("/data/RRtc9VpCYGqGScXzitZ5.json", taskRoutes);
app.use("/tasks", taskRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;