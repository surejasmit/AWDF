const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const { validateRegister, validateLogin } = require("../middleware/validate");

// Public endpoints
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);

// Protected endpoints
router.get("/me", authMiddleware, authController.getMe);

module.exports = router;
