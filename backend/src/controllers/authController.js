const authService = require("../services/authService");
const { eventBus, EVENTS } = require("../events/eventBus");

/**
 * Register a new user
 * POST /auth/register
 * Publishes USER_REGISTERED event to EventBus (triggers async welcome email & audit log)
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, gender } = req.validatedUser || req.body;
    const result = await authService.registerUser({ name, email, password, gender });

    // Publish domain event asynchronously
    eventBus.publish(EVENTS.USER_REGISTERED, { user: result.user });

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
 * Publishes USER_LOGGED_IN event to EventBus (triggers async audit log)
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedCredentials || req.body;
    const result = await authService.loginUser({ email, password });

    // Publish login event
    eventBus.publish(EVENTS.USER_LOGGED_IN, { user: result.user });

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
