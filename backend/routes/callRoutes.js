const express = require('express');
const {
  scheduleCall,
  getMyCalls,
  getCallStats,
  getCallById,
  updateCallStatus,
  submitCallFeedback,
  cancelCall,
  getAllCalls
} = require('../controllers/callController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// Validation for scheduling a call
const validateScheduleCall = [
  body('decisionMakerId')
    .isMongoId()
    .withMessage('Invalid decision maker ID'),
  body('scheduledAt')
    .isISO8601()
    .withMessage('Please provide a valid date and time')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Cannot schedule call in the past');
      }
      return true;
    }),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('Duration must be between 15 and 120 minutes'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors
];

// Validation for call status update
const validateStatusUpdate = [
  body('status')
    .isIn(['in_progress', 'completed', 'cancelled', 'no_show'])
    .withMessage('Invalid status'),
  body('actualStartTime')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start time'),
  body('actualEndTime')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end time'),
  body('connectionQuality')
    .optional()
    .isIn(['excellent', 'good', 'fair', 'poor'])
    .withMessage('Invalid connection quality'),
  handleValidationErrors
];

// Validation for call feedback
const validateCallFeedback = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Feedback cannot exceed 500 characters'),
  body('outcome')
    .optional()
    .isIn(['interested', 'not_interested', 'follow_up_needed', 'closed_deal', 'no_decision'])
    .withMessage('Invalid outcome'),
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid follow-up date'),
  body('dealValue')
    .optional()
    .isNumeric()
    .withMessage('Deal value must be a number'),
  handleValidationErrors
];

// All routes require authentication
router.use(protect);

// Routes accessible by both sales reps and decision makers
router.get('/', getMyCalls);
router.get('/stats', getCallStats);
router.get('/:id', validateObjectId, getCallById);
router.put('/:id/status', validateObjectId, validateStatusUpdate, updateCallStatus);
router.post('/:id/feedback', validateObjectId, validateCallFeedback, submitCallFeedback);
router.delete('/:id', validateObjectId, cancelCall);

// Sales rep only routes
router.post('/', authorize('sales_rep'), validateScheduleCall, scheduleCall);

// Admin only routes
router.get('/admin/all', authorize('admin'), getAllCalls);

module.exports = router;