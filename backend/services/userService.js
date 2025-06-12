const User = require('../models/User');
const { generateToken, createHash } = require('../utils/helpers');
const { calculatePagination } = require('../utils/helpers');

/**
 * User Service - Contains all business logic for user operations
 */
class UserService {
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Object} Created user and token
   */
  async createUser(userData) {
    const { name, email, password, role = 'user' } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // Generate JWT token
    const token = user.getJWTToken();

    return {
      user: user.profile,
      token
    };
  }

  /**
   * Authenticate user login
   * @param {String} email - User email
   * @param {String} password - User password
   * @returns {Object} User and token
   */
  async loginUser(email, password) {
    // Find user with password field
    const user = await User.findWithPassword({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account has been deactivated');
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = user.getJWTToken();

    return {
      user: user.profile,
      token
    };
  }

  /**
   * Get user by ID
   * @param {String} userId - User ID
   * @returns {Object} User data
   */
  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.profile;
  }

  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user
   */
  async updateUserProfile(userId, updateData) {
    const allowedUpdates = ['name', 'email', 'avatar'];
    const updates = {};

    // Filter allowed updates
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    // Check if email is being updated and is unique
    if (updates.email) {
      const existingUser = await User.findOne({ 
        email: updates.email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        throw new Error('Email is already in use');
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user.profile;
  }

  /**
   * Change user password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Boolean} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findWithPassword({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return true;
  }

  /**
   * Get all users with pagination
   * @param {Object} options - Query options
   * @returns {Object} Users list with pagination
   */
  async getAllUsers(options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt', search = '' } = options;

    // Build query
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await User.countDocuments(query);
    
    // Calculate pagination
    const pagination = calculatePagination(page, limit, total);

    // Get users
    const users = await User.find(query)
      .sort(sort)
      .skip(pagination.skip)
      .limit(limit)
      .select('-password');

    return {
      users: users.map(user => user.profile),
      pagination
    };
  }

  /**
   * Delete user (soft delete)
   * @param {String} userId - User ID
   * @returns {Boolean} Success status
   */
  async deleteUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return true;
  }

  /**
   * Update user role (Admin only)
   * @param {String} userId - User ID
   * @param {String} role - New role
   * @returns {Object} Updated user
   */
  async updateUserRole(userId, role) {
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role specified');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user.profile;
  }

  /**
   * Generate password reset token
   * @param {String} email - User email
   * @returns {String} Reset token
   */
  async generatePasswordResetToken(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('No user found with this email');
    }

    // Generate reset token
    const resetToken = generateToken();
    const resetTokenHash = createHash(resetToken);

    // Save hashed token and expiration
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    return resetToken;
  }

  /**
   * Reset password using token
   * @param {String} token - Reset token
   * @param {String} password - New password
   * @returns {Boolean} Success status
   */
  async resetPassword(token, password) {
    // Hash the token to compare with stored hash
    const resetTokenHash = createHash(token);

    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('Token is invalid or has expired');
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return true;
  }

  /**
   * Get user statistics (Admin only)
   * @returns {Object} User statistics
   */
  async getUserStats() {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      recentUsers: recentUsers,
      inactiveUsers: totalUsers - activeUsers
    };
  }
}

module.exports = new UserService();