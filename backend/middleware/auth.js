const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { formatResponse } = require('../utils/helpers');

/**
 * Middleware to protect routes - requires authentication
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json(
        formatResponse(false, 'Access denied. No token provided.')
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json(
        formatResponse(false, 'Token is invalid. User not found.')
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json(
        formatResponse(false, 'Account has been deactivated.')
      );
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(
        formatResponse(false, 'Token is invalid.')
      );
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        formatResponse(false, 'Token has expired.')
      );
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json(
      formatResponse(false, 'Authentication failed.')
    );
  }
};

/**
 * Middleware to authorize specific roles
 * @param {...String} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        formatResponse(false, 'Access denied. Please log in.')
      );
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        formatResponse(false, 'Access denied. Insufficient permissions.')
      );
    }

    next();
  };
};

/**
 * Middleware for optional authentication
 * Sets req.user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  protect,
  authorize,
  optionalAuth
};