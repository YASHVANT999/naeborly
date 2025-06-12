const Call = require('../models/Call');
const User = require('../models/User');
const { calculatePagination } = require('../utils/helpers');

/**
 * Call Service - Business logic for call operations
 */
class CallService {
  
  /**
   * Schedule a new call between sales rep and decision maker
   * @param {String} salesRepId - Sales rep user ID
   * @param {Object} callData - Call details
   * @returns {Object} Created call
   */
  async scheduleCall(salesRepId, callData) {
    const { decisionMakerId, scheduledAt, duration, notes } = callData;

    // Verify users exist and have correct roles
    const salesRep = await User.findById(salesRepId);
    const decisionMaker = await User.findById(decisionMakerId);

    if (!salesRep || salesRep.role !== 'sales_rep') {
      throw new Error('Invalid sales representative');
    }

    if (!decisionMaker || decisionMaker.role !== 'decision_maker') {
      throw new Error('Invalid decision maker');
    }

    // Check if sales rep has call credits
    if (salesRep.callCredits <= 0) {
      throw new Error('Insufficient call credits');
    }

    // Validate scheduled time
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      throw new Error('Cannot schedule call in the past');
    }

    // Check for conflicting calls
    const conflictingCall = await Call.findOne({
      $or: [
        { salesRepId, scheduledAt: scheduledDate, status: 'scheduled' },
        { decisionMakerId, scheduledAt: scheduledDate, status: 'scheduled' }
      ]
    });

    if (conflictingCall) {
      throw new Error('Time slot already booked');
    }

    // Create call
    const call = await Call.create({
      salesRepId,
      decisionMakerId,
      scheduledAt: scheduledDate,
      duration: duration || 30,
      notes
    });

    // Deduct call credit from sales rep
    salesRep.callCredits -= 1;
    await salesRep.save();

    return await Call.findById(call._id)
      .populate('salesRepId', 'name email company')
      .populate('decisionMakerId', 'name email company');
  }

  /**
   * Get calls for a user (sales rep or decision maker)
   * @param {String} userId - User ID
   * @param {String} userRole - User role
   * @param {Object} options - Query options
   * @returns {Object} Calls with pagination
   */
  async getCallsForUser(userId, userRole, options = {}) {
    const { page = 1, limit = 10, status, upcoming } = options;

    let query = {};
    if (userRole === 'sales_rep') {
      query.salesRepId = userId;
    } else if (userRole === 'decision_maker') {
      query.decisionMakerId = userId;
    } else {
      throw new Error('Invalid user role for call access');
    }

    if (status) query.status = status;
    if (upcoming === 'true') {
      query.scheduledAt = { $gt: new Date() };
      query.status = 'scheduled';
    }

    const total = await Call.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    const calls = await Call.find(query)
      .populate('salesRepId', 'name email company jobTitle')
      .populate('decisionMakerId', 'name email company jobTitle')
      .sort('-scheduledAt')
      .skip(pagination.skip)
      .limit(limit);

    return { calls, pagination };
  }

  /**
   * Update call status
   * @param {String} callId - Call ID
   * @param {String} userId - User ID making the update
   * @param {Object} updateData - Update data
   * @returns {Object} Updated call
   */
  async updateCallStatus(callId, userId, updateData) {
    const { status, actualStartTime, actualEndTime, connectionQuality } = updateData;

    const call = await Call.findOne({
      _id: callId,
      $or: [{ salesRepId: userId }, { decisionMakerId: userId }]
    });

    if (!call) {
      throw new Error('Call not found or access denied');
    }

    // Validate status transitions
    const validTransitions = {
      'scheduled': ['in_progress', 'cancelled', 'no_show'],
      'in_progress': ['completed'],
      'completed': [],
      'cancelled': [],
      'no_show': []
    };

    if (status && !validTransitions[call.status].includes(status)) {
      throw new Error(`Cannot change status from ${call.status} to ${status}`);
    }

    const updates = {};
    if (status) updates.status = status;
    if (actualStartTime) updates.actualStartTime = new Date(actualStartTime);
    if (actualEndTime) updates.actualEndTime = new Date(actualEndTime);
    if (connectionQuality) updates.connectionQuality = connectionQuality;

    const updatedCall = await Call.findByIdAndUpdate(
      callId,
      updates,
      { new: true, runValidators: true }
    ).populate('salesRepId', 'name email company')
     .populate('decisionMakerId', 'name email company');

    return updatedCall;
  }

  /**
   * Submit call evaluation/feedback
   * @param {String} callId - Call ID
   * @param {String} userId - User ID submitting feedback
   * @param {Object} feedback - Feedback data
   * @returns {Object} Updated call
   */
  async submitCallFeedback(callId, userId, feedback) {
    const call = await Call.findOne({
      _id: callId,
      $or: [{ salesRepId: userId }, { decisionMakerId: userId }],
      status: 'completed'
    });

    if (!call) {
      throw new Error('Call not found, access denied, or call not completed');
    }

    const updates = {};
    const user = await User.findById(userId);

    if (user.role === 'sales_rep' && call.salesRepId.toString() === userId) {
      if (feedback.rating) updates.salesRepRating = feedback.rating;
      if (feedback.feedback) updates.salesRepFeedback = feedback.feedback;
      if (feedback.outcome) updates.outcome = feedback.outcome;
      if (feedback.followUpDate) updates.followUpDate = new Date(feedback.followUpDate);
      if (feedback.dealValue) updates.dealValue = feedback.dealValue;
    } else if (user.role === 'decision_maker' && call.decisionMakerId.toString() === userId) {
      if (feedback.rating) updates.decisionMakerRating = feedback.rating;
      if (feedback.feedback) updates.decisionMakerFeedback = feedback.feedback;
    } else {
      throw new Error('Invalid user role or call participant');
    }

    const updatedCall = await Call.findByIdAndUpdate(
      callId,
      updates,
      { new: true, runValidators: true }
    ).populate('salesRepId', 'name email company')
     .populate('decisionMakerId', 'name email company');

    return updatedCall;
  }

  /**
   * Cancel a call
   * @param {String} callId - Call ID
   * @param {String} userId - User ID cancelling the call
   * @returns {Object} Updated call
   */
  async cancelCall(callId, userId) {
    const call = await Call.findOne({
      _id: callId,
      $or: [{ salesRepId: userId }, { decisionMakerId: userId }],
      status: 'scheduled'
    });

    if (!call) {
      throw new Error('Call not found, access denied, or cannot be cancelled');
    }

    // Refund call credit to sales rep if cancelled with sufficient notice
    const hoursUntilCall = (call.scheduledAt - new Date()) / (1000 * 60 * 60);
    if (hoursUntilCall >= 24) {
      const salesRep = await User.findById(call.salesRepId);
      salesRep.callCredits += 1;
      await salesRep.save();
    }

    call.status = 'cancelled';
    await call.save();

    return await Call.findById(callId)
      .populate('salesRepId', 'name email company')
      .populate('decisionMakerId', 'name email company');
  }

  /**
   * Get call statistics for user
   * @param {String} userId - User ID
   * @param {String} userRole - User role
   * @returns {Object} Call statistics
   */
  async getCallStats(userId, userRole) {
    let query = {};
    if (userRole === 'sales_rep') {
      query.salesRepId = userId;
    } else if (userRole === 'decision_maker') {
      query.decisionMakerId = userId;
    }

    const totalCalls = await Call.countDocuments(query);
    const completedCalls = await Call.countDocuments({ ...query, status: 'completed' });
    const cancelledCalls = await Call.countDocuments({ ...query, status: 'cancelled' });
    const noShowCalls = await Call.countDocuments({ ...query, status: 'no_show' });
    
    // Upcoming calls
    const upcomingCalls = await Call.countDocuments({
      ...query,
      status: 'scheduled',
      scheduledAt: { $gt: new Date() }
    });

    // This month's calls
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyCalls = await Call.countDocuments({
      ...query,
      createdAt: { $gte: currentMonth }
    });

    // Average rating (for completed calls with ratings)
    let averageRating = 0;
    if (userRole === 'sales_rep') {
      const ratingStats = await Call.aggregate([
        { $match: { ...query, status: 'completed', decisionMakerRating: { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$decisionMakerRating' } } }
      ]);
      averageRating = ratingStats.length > 0 ? ratingStats[0].avgRating : 0;
    } else {
      const ratingStats = await Call.aggregate([
        { $match: { ...query, status: 'completed', salesRepRating: { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$salesRepRating' } } }
      ]);
      averageRating = ratingStats.length > 0 ? ratingStats[0].avgRating : 0;
    }

    return {
      totalCalls,
      completedCalls,
      cancelledCalls,
      noShowCalls,
      upcomingCalls,
      monthlyCalls,
      averageRating: Math.round(averageRating * 10) / 10,
      completionRate: totalCalls > 0 ? (completedCalls / totalCalls * 100).toFixed(1) : 0
    };
  }

  /**
   * Get all calls (admin only)
   * @param {Object} options - Query options
   * @returns {Object} All calls with pagination
   */
  async getAllCalls(options = {}) {
    const { page = 1, limit = 10, status, outcome } = options;

    const query = {};
    if (status) query.status = status;
    if (outcome) query.outcome = outcome;

    const total = await Call.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    const calls = await Call.find(query)
      .populate('salesRepId', 'name email company')
      .populate('decisionMakerId', 'name email company')
      .sort('-scheduledAt')
      .skip(pagination.skip)
      .limit(limit);

    return { calls, pagination };
  }

  /**
   * Get call by ID
   * @param {String} callId - Call ID
   * @param {String} userId - User ID requesting the call
   * @returns {Object} Call details
   */
  async getCallById(callId, userId) {
    const call = await Call.findOne({
      _id: callId,
      $or: [{ salesRepId: userId }, { decisionMakerId: userId }]
    }).populate('salesRepId', 'name email company jobTitle')
     .populate('decisionMakerId', 'name email company jobTitle');

    if (!call) {
      throw new Error('Call not found or access denied');
    }

    return call;
  }
}

module.exports = new CallService();