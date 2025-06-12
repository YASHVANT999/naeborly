const invitationService = require('../services/invitationService');
const { formatResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Create new invitation (Sales Rep only)
 * @route POST /api/invitations
 * @access Private/SalesRep
 */
const createInvitation = asyncHandler(async (req, res) => {
  const invitation = await invitationService.createInvitation(req.user._id, req.body);

  res.status(201).json(
    formatResponse(true, 'Invitation sent successfully', { invitation })
  );
});

/**
 * Get invitations for current sales rep
 * @route GET /api/invitations
 * @access Private/SalesRep
 */
const getMyInvitations = asyncHandler(async (req, res) => {
  const result = await invitationService.getInvitationsBySalesRep(req.user._id, req.query);

  res.status(200).json(
    formatResponse(true, 'Invitations retrieved successfully', result.invitations, result.pagination)
  );
});

/**
 * Get invitation statistics for current sales rep
 * @route GET /api/invitations/stats
 * @access Private/SalesRep
 */
const getInvitationStats = asyncHandler(async (req, res) => {
  const stats = await invitationService.getInvitationStats(req.user._id);

  res.status(200).json(
    formatResponse(true, 'Invitation statistics retrieved successfully', stats)
  );
});

/**
 * Cancel invitation (Sales Rep only)
 * @route DELETE /api/invitations/:id
 * @access Private/SalesRep
 */
const cancelInvitation = asyncHandler(async (req, res) => {
  await invitationService.cancelInvitation(req.params.id, req.user._id);

  res.status(200).json(
    formatResponse(true, 'Invitation cancelled successfully')
  );
});

/**
 * Get invitation by token (Public for decision makers)
 * @route GET /api/invitations/token/:token
 * @access Public
 */
const getInvitationByToken = asyncHandler(async (req, res) => {
  const invitation = await invitationService.getInvitationByToken(req.params.token);

  res.status(200).json(
    formatResponse(true, 'Invitation details retrieved successfully', { invitation })
  );
});

/**
 * Accept invitation and create decision maker account
 * @route POST /api/invitations/accept/:token
 * @access Public
 */
const acceptInvitation = asyncHandler(async (req, res) => {
  const result = await invitationService.acceptInvitation(req.params.token, req.body);

  res.status(201).json(
    formatResponse(true, 'Invitation accepted and account created successfully', result)
  );
});

/**
 * Reject invitation
 * @route POST /api/invitations/reject/:token
 * @access Public
 */
const rejectInvitation = asyncHandler(async (req, res) => {
  await invitationService.rejectInvitation(req.params.token);

  res.status(200).json(
    formatResponse(true, 'Invitation rejected successfully')
  );
});

/**
 * Get all invitations (Admin only)
 * @route GET /api/admin/invitations
 * @access Private/Admin
 */
const getAllInvitations = asyncHandler(async (req, res) => {
  const result = await invitationService.getAllInvitations(req.query);

  res.status(200).json(
    formatResponse(true, 'All invitations retrieved successfully', result.invitations, result.pagination)
  );
});

module.exports = {
  createInvitation,
  getMyInvitations,
  getInvitationStats,
  cancelInvitation,
  getInvitationByToken,
  acceptInvitation,
  rejectInvitation,
  getAllInvitations
};