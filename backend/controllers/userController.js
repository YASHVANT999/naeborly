const userService = require('../services/userService');
const { formatResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all users (Admin only)
 * @route GET /api/users
 * @access Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, sort, search } = req.query;
  
  const result = await userService.getAllUsers({ page, limit, sort, search });

  res.status(200).json(
    formatResponse(true, 'Users retrieved successfully', result.users, result.pagination)
  );
});

/**
 * Get user by ID (Admin only)
 * @route GET /api/users/:id
 * @access Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  res.status(200).json(
    formatResponse(true, 'User retrieved successfully', { user })
  );
});

/**
 * Update user role (Admin only)
 * @route PUT /api/users/:id/role
 * @access Private/Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  
  const user = await userService.updateUserRole(req.params.id, role);

  res.status(200).json(
    formatResponse(true, 'User role updated successfully', { user })
  );
});

/**
 * Delete user (Admin only)
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);

  res.status(200).json(
    formatResponse(true, 'User deleted successfully')
  );
});

/**
 * Get user statistics (Admin only)
 * @route GET /api/users/stats
 * @access Private/Admin
 */
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats();

  res.status(200).json(
    formatResponse(true, 'User statistics retrieved successfully', stats)
  );
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getUserStats
};