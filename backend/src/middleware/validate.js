const mongoose = require("mongoose");

const emailRegex = /^\S+@\S+\.\S+$/;

/**
 * Validate User Registration Payload
 */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: Name is required and cannot be empty.",
    });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: Name must be at least 2 characters long.",
    });
  }

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: Email is required.",
    });
  }

  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: Invalid email format.",
    });
  }

  if (!password || typeof password !== "string") {
    return res.status(400).json({
      success: false,
      message: "Validation Error: Password is required.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: Password must be at least 6 characters long.",
    });
  }

  req.validatedUser = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  };

  next();
};

/**
 * Validate User Login Payload
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: Email is required.",
    });
  }

  if (!password || typeof password !== "string") {
    return res.status(400).json({
      success: false,
      message: "Validation Error: Password is required.",
    });
  }

  req.validatedCredentials = {
    email: email.toLowerCase().trim(),
    password,
  };

  next();
};

/**
 * Validate Task Creation Payload
 */
const validateTask = (req, res, next) => {
  const body = req.body || {};
  const rawTitle = body.title !== undefined ? body.title : body.text;

  if (rawTitle === undefined || rawTitle === null || typeof rawTitle !== "string" || !rawTitle.trim()) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: Task title is required and cannot be empty.",
    });
  }

  if (rawTitle.trim().length > 500) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: Task title cannot exceed 500 characters.",
    });
  }

  req.validatedTitle = rawTitle.trim();
  next();
};

/**
 * Validate Task Update Payload
 */
const validateTaskUpdate = (req, res, next) => {
  const body = req.body || {};
  const hasTitle = body.title !== undefined || body.text !== undefined;
  const hasCompleted = body.completed !== undefined;

  if (!hasTitle && !hasCompleted) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: At least one field (title or completed) must be provided to update.",
    });
  }

  if (hasTitle) {
    const rawTitle = body.title !== undefined ? body.title : body.text;
    if (typeof rawTitle !== "string" || !rawTitle.trim()) {
      return res.status(400).json({
        success: false,
        message: "Validation Error: Updated task title cannot be empty.",
      });
    }
    if (rawTitle.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Validation Error: Task title cannot exceed 500 characters.",
      });
    }
    req.validatedTitle = rawTitle.trim();
  }

  if (hasCompleted) {
    if (typeof body.completed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Validation Error: Completed status must be a boolean value (true or false).",
      });
    }
    req.validatedCompleted = body.completed;
  }

  next();
};

/**
 * Validate MongoDB ObjectId in request params
 */
const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Invalid resource ID '${id}'.`,
      });
    }
    next();
  };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateTask,
  validateTaskUpdate,
  validateObjectId,
};
