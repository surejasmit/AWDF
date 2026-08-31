const express = require("express");
const router = express.Router();
const authController = require("../controller/AuthController");
const { validateRegister, validateLogin } = require("../middleware/validate");
const authMiddleware = require("../middleware/auth");

// Public endpoints
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);

// Protected endpoints
router.get("/me", authMiddleware, authController.getMe);

module.exports = router;
