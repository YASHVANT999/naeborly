const Invitation = require('../models/Invitation');
const User = require('../models/User');
const { generateToken } = require('../utils/helpers');
const { calculatePagination } = require('../utils/helpers');

/**
 * Invitation Service - Business logic for invitation operations
 */
class InvitationService {
  
  /**
   * Create invitation from sales rep to decision maker
   * @param {String} salesRepId - Sales rep user ID
   * @param {Object} invitationData - Invitation details
   * @returns {Object} Created invitation
   */
  async createInvitation(salesRepId, invitationData) {
    const { decisionMakerEmail, decisionMakerName, message } = invitationData;

    // Verify sales rep exists and has correct role
    const salesRep = await User.findById(salesRepId);
    if (!salesRep || salesRep.role !== 'sales_rep') {
      throw new Error('Invalid sales representative');
    }

    // Check if decision maker already exists
    const existingDM = await User.findOne({ email: decisionMakerEmail });
    if (existingDM && existingDM.role === 'decision_maker') {
      throw new Error('Decision maker already registered');
    }

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      salesRepId,
      decisionMakerEmail,
      status: 'pending'
    });
    if (existingInvitation) {
      throw new Error('Pending invitation already exists for this email');
    }

    // Check sales rep's monthly DM limit
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyInvitations = await Invitation.countDocuments({
      salesRepId,
      createdAt: { $gte: currentMonth },
      status: { $ne: 'rejected' }
    });

    if (monthlyInvitations >= salesRep.monthlyDMLimit) {
      throw new Error('Monthly decision maker invitation limit reached');
    }

    // Generate invitation token
    const invitationToken = generateToken();

    const invitation = await Invitation.create({
      salesRepId,
      decisionMakerEmail,
      decisionMakerName,
      message,
      invitationToken
    });

    return await Invitation.findById(invitation._id).populate('salesRepId', 'name email company');
  }

  /**
   * Get invitations for a sales rep
   * @param {String} salesRepId - Sales rep user ID
   * @param {Object} options - Query options
   * @returns {Object} Invitations with pagination
   */
  async getInvitationsBySalesRep(salesRepId, options = {}) {
    const { page = 1, limit = 10, status } = options;

    const query = { salesRepId };
    if (status) query.status = status;

    const total = await Invitation.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    const invitations = await Invitation.find(query)
      .populate('salesRepId', 'name email company')
      .sort('-createdAt')
      .skip(pagination.skip)
      .limit(limit);

    return { invitations, pagination };
  }

  /**
   * Accept invitation and create decision maker account
   * @param {String} token - Invitation token
   * @param {Object} userData - User registration data
   * @returns {Object} Created user and token
   */
  async acceptInvitation(token, userData) {
    const invitation = await Invitation.findOne({
      invitationToken: token,
      status: 'pending'
    }).populate('salesRepId');

    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    if (invitation.isExpired) {
      invitation.status = 'expired';
      await invitation.save();
      throw new Error('Invitation has expired');
    }

    // Create decision maker account
    const decisionMaker = await User.create({
      ...userData,
      email: invitation.decisionMakerEmail,
      role: 'decision_maker',
      emailVerified: true
    });

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Generate JWT token
    const jwtToken = decisionMaker.getJWTToken();

    return {
      user: decisionMaker.profile,
      token: jwtToken,
      invitation: invitation
    };
  }

  /**
   * Reject invitation
   * @param {String} token - Invitation token
   * @returns {Boolean} Success status
   */
  async rejectInvitation(token) {
    const invitation = await Invitation.findOne({
      invitationToken: token,
      status: 'pending'
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    invitation.status = 'rejected';
    invitation.rejectedAt = new Date();
    await invitation.save();

    return true;
  }

  /**
   * Get invitation by token (for viewing invitation details)
   * @param {String} token - Invitation token
   * @returns {Object} Invitation details
   */
  async getInvitationByToken(token) {
    const invitation = await Invitation.findOne({
      invitationToken: token
    }).populate('salesRepId', 'name email company jobTitle');

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    return invitation;
  }

  /**
   * Get invitation statistics for sales rep
   * @param {String} salesRepId - Sales rep user ID
   * @returns {Object} Invitation statistics
   */
  async getInvitationStats(salesRepId) {
    const totalInvitations = await Invitation.countDocuments({ salesRepId });
    const pendingInvitations = await Invitation.countDocuments({ 
      salesRepId, 
      status: 'pending' 
    });
    const acceptedInvitations = await Invitation.countDocuments({ 
      salesRepId, 
      status: 'accepted' 
    });
    const rejectedInvitations = await Invitation.countDocuments({ 
      salesRepId, 
      status: 'rejected' 
    });

    // Monthly stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyInvitations = await Invitation.countDocuments({
      salesRepId,
      createdAt: { $gte: currentMonth }
    });

    return {
      totalInvitations,
      pendingInvitations,
      acceptedInvitations,
      rejectedInvitations,
      monthlyInvitations,
      acceptanceRate: totalInvitations > 0 ? (acceptedInvitations / totalInvitations * 100).toFixed(1) : 0
    };
  }

  /**
   * Cancel invitation (by sales rep)
   * @param {String} invitationId - Invitation ID
   * @param {String} salesRepId - Sales rep user ID
   * @returns {Boolean} Success status
   */
  async cancelInvitation(invitationId, salesRepId) {
    const invitation = await Invitation.findOne({
      _id: invitationId,
      salesRepId,
      status: 'pending'
    });

    if (!invitation) {
      throw new Error('Invitation not found or cannot be cancelled');
    }

    invitation.status = 'cancelled';
    await invitation.save();

    return true;
  }

  /**
   * Get all invitations (admin only)
   * @param {Object} options - Query options
   * @returns {Object} All invitations with pagination
   */
  async getAllInvitations(options = {}) {
    const { page = 1, limit = 10, status, search } = options;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { decisionMakerEmail: { $regex: search, $options: 'i' } },
        { decisionMakerName: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Invitation.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    const invitations = await Invitation.find(query)
      .populate('salesRepId', 'name email company')
      .sort('-createdAt')
      .skip(pagination.skip)
      .limit(limit);

    return { invitations, pagination };
  }
}

module.exports = new InvitationService();