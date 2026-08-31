// Server-side validation middleware that rejects malformed requests before they reach the database

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

  next();
};

/**
 * Validate Task Creation Payload
 * Ensures title or text is provided and non-empty
 */
const validateTask = (req, res, next) => {
  const body = req.body || {};
  const title = body.title || body.text || (body.fields && body.fields.text && (body.fields.text.stringValue || body.fields.text));

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: Task title is required and cannot be empty.",
    });
  }

  req.validatedTitle = title.trim();
  next();
};

/**
 * Validate Task Update Payload
 */
const validateTaskUpdate = (req, res, next) => {
  const body = req.body || {};
  const hasTitle = body.title !== undefined || body.text !== undefined || (body.fields && body.fields.text !== undefined);
  const hasCompleted = body.completed !== undefined || (body.fields && body.fields.completed !== undefined);

  if (!hasTitle && !hasCompleted) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: At least one field (title/text or completed) must be provided to update.",
    });
  }

  if (hasTitle) {
    const title = body.title !== undefined ? body.title : body.text !== undefined ? body.text : (body.fields && body.fields.text && (body.fields.text.stringValue || body.fields.text));
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Validation Error: Updated task title cannot be empty.",
      });
    }
    req.validatedTitle = title.trim();
  }

  if (hasCompleted) {
    const completed = body.completed !== undefined ? body.completed : (body.fields && body.fields.completed && body.fields.completed.booleanValue);
    if (typeof completed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Validation Error: Completed status must be a boolean value.",
      });
    }
    req.validatedCompleted = completed;
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateTask,
  validateTaskUpdate,
};
