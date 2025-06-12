const callService = require('../services/callService');
const { formatResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Schedule a new call (Sales Rep only)
 * @route POST /api/calls
 * @access Private/SalesRep
 */
const scheduleCall = asyncHandler(async (req, res) => {
  const call = await callService.scheduleCall(req.user._id, req.body);

  res.status(201).json(
    formatResponse(true, 'Call scheduled successfully', { call })
  );
});

/**
 * Get calls for current user
 * @route GET /api/calls
 * @access Private
 */
const getMyCalls = asyncHandler(async (req, res) => {
  const result = await callService.getCallsForUser(req.user._id, req.user.role, req.query);

  res.status(200).json(
    formatResponse(true, 'Calls retrieved successfully', result.calls, result.pagination)
  );
});

/**
 * Get call statistics for current user
 * @route GET /api/calls/stats
 * @access Private
 */
const getCallStats = asyncHandler(async (req, res) => {
  const stats = await callService.getCallStats(req.user._id, req.user.role);

  res.status(200).json(
    formatResponse(true, 'Call statistics retrieved successfully', stats)
  );
});

/**
 * Get specific call by ID
 * @route GET /api/calls/:id
 * @access Private
 */
const getCallById = asyncHandler(async (req, res) => {
  const call = await callService.getCallById(req.params.id, req.user._id);

  res.status(200).json(
    formatResponse(true, 'Call retrieved successfully', { call })
  );
});

/**
 * Update call status
 * @route PUT /api/calls/:id/status
 * @access Private
 */
const updateCallStatus = asyncHandler(async (req, res) => {
  const call = await callService.updateCallStatus(req.params.id, req.user._id, req.body);

  res.status(200).json(
    formatResponse(true, 'Call status updated successfully', { call })
  );
});

/**
 * Submit call feedback/evaluation
 * @route POST /api/calls/:id/feedback
 * @access Private
 */
const submitCallFeedback = asyncHandler(async (req, res) => {
  const call = await callService.submitCallFeedback(req.params.id, req.user._id, req.body);

  res.status(200).json(
    formatResponse(true, 'Call feedback submitted successfully', { call })
  );
});

/**
 * Cancel a call
 * @route DELETE /api/calls/:id
 * @access Private
 */
const cancelCall = asyncHandler(async (req, res) => {
  const call = await callService.cancelCall(req.params.id, req.user._id);

  res.status(200).json(
    formatResponse(true, 'Call cancelled successfully', { call })
  );
});

/**
 * Get all calls (Admin only)
 * @route GET /api/admin/calls
 * @access Private/Admin
 */
const getAllCalls = asyncHandler(async (req, res) => {
  const result = await callService.getAllCalls(req.query);

  res.status(200).json(
    formatResponse(true, 'All calls retrieved successfully', result.calls, result.pagination)
  );
});

module.exports = {
  scheduleCall,
  getMyCalls,
  getCallStats,
  getCallById,
  updateCallStatus,
  submitCallFeedback,
  cancelCall,
  getAllCalls
};