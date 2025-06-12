const crypto = require('crypto');

/**
 * Generate random string
 * @param {Number} length - Length of the string
 * @returns {String} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate random token for password reset, email verification, etc.
 * @returns {String} Random token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create hash from string
 * @param {String} string - String to hash
 * @returns {String} Hashed string
 */
const createHash = (string) => {
  return crypto.createHash('sha256').update(string).digest('hex');
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object} Validation result
 */
const validatePassword = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);

  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
    message: password.length < minLength 
      ? `Password must be at least ${minLength} characters long`
      : !hasUpperCase 
      ? 'Password must contain at least one uppercase letter'
      : !hasLowerCase 
      ? 'Password must contain at least one lowercase letter'
      : !hasNumbers 
      ? 'Password must contain at least one number'
      : 'Password is valid'
  };
};

/**
 * Sanitize user input
 * @param {String} input - Input to sanitize
 * @returns {String} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Format response for API
 * @param {Boolean} success - Success status
 * @param {String} message - Response message
 * @param {Object} data - Response data
 * @param {Object} meta - Additional metadata
 * @returns {Object} Formatted response
 */
const formatResponse = (success, message, data = null, meta = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;

  return response;
};

/**
 * Calculate pagination
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @param {Number} total - Total items
 * @returns {Object} Pagination info
 */
const calculatePagination = (page = 1, limit = 10, total = 0) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const skip = (currentPage - 1) * limit;

  return {
    currentPage,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    skip
  };
};

module.exports = {
  generateRandomString,
  generateToken,
  createHash,
  isValidEmail,
  validatePassword,
  sanitizeInput,
  formatResponse,
  calculatePagination
};