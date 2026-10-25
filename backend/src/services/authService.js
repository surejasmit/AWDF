const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_development_change_in_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

/**
 * Generate a signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id ? user._id.toString() : user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Register a new user in MongoDB
 */
const registerUser = async ({ name, email, password, gender }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("A user with this email address already exists.");
    error.status = 400;
    throw error;
  }

  // Create new user (password is automatically hashed via User pre-save hook)
  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    password,
    ...(gender ? { gender } : {}),
  });

  const savedUser = await user.save();
  const token = generateToken(savedUser);

  return {
    user: savedUser.toJSON(),
    token,
  };
};

/**
 * Authenticate existing user with email and password
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Find user by email
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  // Compare password with bcrypt
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Retrieve user profile by user ID
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.status = 404;
    throw error;
  }

  return user.toJSON();
};

module.exports = {
  generateToken,
  registerUser,
  loginUser,
  getUserProfile,
};
