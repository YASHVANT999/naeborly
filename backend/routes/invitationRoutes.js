const express = require('express');
const {
  createInvitation,
  getMyInvitations,
  getInvitationStats,
  cancelInvitation,
  getInvitationByToken,
  acceptInvitation,
  rejectInvitation,
  getAllInvitations
} = require('../controllers/invitationController');
const { protect, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { handleValidationErrors, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// Validation for creating invitation
const validateCreateInvitation = [
  body('decisionMakerEmail')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('decisionMakerName')
    .trim()
    .notEmpty()
    .withMessage('Decision maker name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
  handleValidationErrors
];

// Validation for accepting invitation
const validateAcceptInvitation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title cannot exceed 100 characters'),
  handleValidationErrors
];

// Validation for token parameter
const validateToken = [
  param('token')
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid token format'),
  handleValidationErrors
];

// Public routes (no authentication required)
router.get('/token/:token', validateToken, getInvitationByToken);
router.post('/accept/:token', validateToken, validateAcceptInvitation, acceptInvitation);
router.post('/reject/:token', validateToken, rejectInvitation);

// Protected routes (authentication required)
router.use(protect);

// Sales Rep only routes
router.post('/', authorize('sales_rep'), validateCreateInvitation, createInvitation);
router.get('/', authorize('sales_rep'), getMyInvitations);
router.get('/stats', authorize('sales_rep'), getInvitationStats);
router.delete('/:id', authorize('sales_rep'), validateObjectId, cancelInvitation);

// Admin only routes
router.get('/admin/all', authorize('admin'), getAllInvitations);

module.exports = router;