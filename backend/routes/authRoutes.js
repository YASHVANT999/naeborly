const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validatePasswordResetRequest,
  validatePasswordReset
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validatePasswordResetRequest, forgotPassword);
router.post('/reset-password', validatePasswordReset, resetPassword);

// Protected routes
router.use(protect); // All routes below this middleware are protected

router.get('/me', getMe);
router.put('/profile', validateUpdateProfile, updateProfile);
router.put('/password', validateChangePassword, changePassword);
router.post('/logout', logout);

module.exports = router;