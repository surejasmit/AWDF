const express = require("express");
const router = express.Router();
const controller = require("../controller/Taskcontroller");

// Collection endpoints
router.route("/") 
  .get(controller.getAllTasks)
  .post(controller.createTask);

router.get("/all", controller.getAllTasks);
router.post("/save", controller.createTask);

// Single item endpoints
router.route("/:id")
  .get(controller.getTaskById)
  .put(controller.updateTask)
  .patch(controller.updateTask)
  .delete(controller.deleteTask);

router.put("/update/:id", controller.updateTask);
router.delete("/delete/:id", controller.deleteTask);

module.exports = router;