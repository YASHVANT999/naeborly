const userService = require('../services/userService');
const { formatResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Register new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const result = await userService.createUser({ name, email, password, role });

  res.status(201).json(
    formatResponse(true, 'User registered successfully', result)
  );
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await userService.loginUser(email, password);

  res.status(200).json(
    formatResponse(true, 'Login successful', result)
  );
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user._id);

  res.status(200).json(
    formatResponse(true, 'User profile retrieved successfully', { user })
  );
});

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateUserProfile(req.user._id, req.body);

  res.status(200).json(
    formatResponse(true, 'Profile updated successfully', { user })
  );
});

/**
 * Change password
 * @route PUT /api/auth/password
 * @access Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await userService.changePassword(req.user._id, currentPassword, newPassword);

  res.status(200).json(
    formatResponse(true, 'Password changed successfully')
  );
});

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 * @access Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const resetToken = await userService.generatePasswordResetToken(email);

  // In production, send email with reset token
  // For development, return token in response
  const responseData = process.env.NODE_ENV === 'development' 
    ? { resetToken } 
    : null;

  res.status(200).json(
    formatResponse(
      true, 
      'Password reset instructions sent to email', 
      responseData
    )
  );
});

/**
 * Reset password
 * @route POST /api/auth/reset-password
 * @access Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  await userService.resetPassword(token, password);

  res.status(200).json(
    formatResponse(true, 'Password reset successfully')
  );
});

/**
 * Logout user (client-side token removal)
 * @route POST /api/auth/logout
 * @access Private
 */
const logout = asyncHandler(async (req, res) => {
  res.status(200).json(
    formatResponse(true, 'Logged out successfully')
  );
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout
};