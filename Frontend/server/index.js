// Entry point referencing server.js
const app = require("./server");

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Task Management API server running on port ${PORT}`);
  });
}

module.exports = app;
