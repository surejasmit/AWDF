const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/auth");
const {
  validateTask,
  validateTaskUpdate,
  validateObjectId,
} = require("../middleware/validate");

// All task endpoints require valid JWT authentication
router.use(authMiddleware);

// Collection routes
router
  .route("/")
  .get(taskController.getAllTasks)
  .post(validateTask, taskController.createTask);

// RESTful Single Resource routes
router
  .route("/:id")
  .get(validateObjectId("id"), taskController.getTaskById)
  .put(validateObjectId("id"), validateTaskUpdate, taskController.updateTask)
  .patch(validateObjectId("id"), validateTaskUpdate, taskController.updateTask)
  .delete(validateObjectId("id"), taskController.deleteTask);

// Backwards compatibility convenience aliases
router.get("/all", taskController.getAllTasks);
router.post("/save", validateTask, taskController.createTask);
router.put("/update/:id", validateObjectId("id"), validateTaskUpdate, taskController.updateTask);
router.delete("/delete/:id", validateObjectId("id"), taskController.deleteTask);

module.exports = router;
