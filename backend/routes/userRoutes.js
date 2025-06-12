const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getUserStats
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const {
  validateObjectId,
  validatePagination
} = require('../middleware/validation');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validate role update
const validateRoleUpdate = [
  body('role')
    .isIn(['admin', 'sales_rep', 'decision_maker'])
    .withMessage('Role must be admin, sales_rep, or decision_maker'),
  handleValidationErrors
];

// All routes are protected and require admin access
router.use(protect);
router.use(authorize('admin'));

// Routes
router.get('/stats', getUserStats);
router.get('/', validatePagination, getAllUsers);
router.get('/:id', validateObjectId, getUserById);
router.put('/:id/role', validateObjectId, validateRoleUpdate, updateUserRole);
router.delete('/:id', validateObjectId, deleteUser);

module.exports = router;