const authService = require("../services/authService");
const emailService = require("../services/emailService");

/**
 * Register a new user
 * POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.validatedUser || req.body;
    const result = await authService.registerUser({ name, email, password });

    // Send welcome email asynchronously to the new user
    emailService.sendWelcomeEmail(result.user).catch((err) => {
      console.warn("Welcome email async error:", err.message);
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login existing user
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedCredentials || req.body;
    const result = await authService.loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
