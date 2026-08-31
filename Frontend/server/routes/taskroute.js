const express = require("express");
const router = express.Router();
const controller = require("../controller/Taskcontroller");
const authMiddleware = require("../middleware/auth");
const { validateTask, validateTaskUpdate } = require("../middleware/validate");

// Protect all task routes using authentication middleware
router.use(authMiddleware);

// Collection endpoints
router
  .route("/")
  .get(controller.getAllTasks)
  .post(validateTask, controller.createTask);

router.get("/all", controller.getAllTasks);
router.post("/save", validateTask, controller.createTask);

// Single item endpoints
router
  .route("/:id")
  .get(controller.getTaskById)
  .put(validateTaskUpdate, controller.updateTask)
  .patch(validateTaskUpdate, controller.updateTask)
  .delete(controller.deleteTask);

router.put("/update/:id", validateTaskUpdate, controller.updateTask);
router.delete("/delete/:id", controller.deleteTask);

module.exports = router;