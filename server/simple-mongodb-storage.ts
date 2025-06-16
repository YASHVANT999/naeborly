import { User, Invitation, Call, SubscriptionPlan, UserFlag, FlagHistory, FlagRule, connectToMongoDB } from './mongodb';
import type { IStorage } from './storage';
import bcrypt from 'bcrypt';

export class SimpleMongoDBStorage implements IStorage {
  async getUser(id: string): Promise<any | undefined> {
    try {
      const user = await User.findById(id);
      return user ? this.toPlainObject(user) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    // MongoDB doesn't have username field, use email instead
    return this.getUserByEmail(username);
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    try {
      const user = await User.findOne({ email });
      return user ? this.toPlainObject(user) : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      // Hash password if not already hashed
      if (userData.password && !userData.password.startsWith('$2b$')) {
        const saltRounds = 10;
        userData.password = await bcrypt.hash(userData.password, saltRounds);
      }
      
      const user = new User(userData);
      await user.save();
      return this.toPlainObject(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: any): Promise<any | undefined> {
    try {
      const user = await User.findByIdAndUpdate(id, updates, { new: true });
      return user ? this.toPlainObject(user) : undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async getInvitationsByUserId(userId: string): Promise<any[]> {
    try {
      const invitations = await Invitation.find({ salesRepId: userId });
      return invitations.map(inv => this.toPlainObject(inv));
    } catch (error) {
      console.error('Error getting invitations:', error);
      return [];
    }
  }

  async createInvitation(invitationData: any): Promise<any> {
    try {
      const invitation = new Invitation(invitationData);
      await invitation.save();
      return this.toPlainObject(invitation);
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  async updateInvitationStatus(id: string, status: string): Promise<any | undefined> {
    try {
      const invitation = await Invitation.findByIdAndUpdate(id, { status }, { new: true });
      return invitation ? this.toPlainObject(invitation) : undefined;
    } catch (error) {
      console.error('Error updating invitation status:', error);
      return undefined;
    }
  }

  async getCallsByUserId(userId: string): Promise<any[]> {
    try {
      const calls = await Call.find({
        $or: [
          { salesRepId: userId },
          { decisionMakerId: userId }
        ]
      });
      return calls.map(call => this.toPlainObject(call));
    } catch (error) {
      console.error('Error getting calls:', error);
      return [];
    }
  }

  async createCall(callData: any): Promise<any> {
    try {
      const call = new Call(callData);
      await call.save();
      return this.toPlainObject(call);
    } catch (error) {
      console.error('Error creating call:', error);
      throw error;
    }
  }

  async updateCall(id: string, updates: any): Promise<any | undefined> {
    try {
      const call = await Call.findByIdAndUpdate(id, updates, { new: true });
      return call ? this.toPlainObject(call) : undefined;
    } catch (error) {
      console.error('Error updating call:', error);
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await connectToMongoDB();
      const result = await User.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      await connectToMongoDB();
      const users = await User.find({}).sort({ createdAt: -1 });
      return users.map(user => this.toPlainObject(user));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getAllInvitations(): Promise<any[]> {
    try {
      await connectToMongoDB();
      const invitations = await Invitation.find({}).sort({ createdAt: -1 });
      
      // Populate sales rep names
      const populatedInvitations = [];
      for (const invitation of invitations) {
        const salesRep = await User.findById(invitation.salesRepId);
        const invitationObj = this.toPlainObject(invitation);
        invitationObj.salesRepName = salesRep ? `${salesRep.firstName} ${salesRep.lastName}` : 'Unknown';
        populatedInvitations.push(invitationObj);
      }
      
      return populatedInvitations;
    } catch (error) {
      console.error('Error getting all invitations:', error);
      return [];
    }
  }

  async getAllCalls(): Promise<any[]> {
    try {
      await connectToMongoDB();
      const calls = await Call.find({}).sort({ createdAt: -1 });
      
      // Populate user names
      const populatedCalls = [];
      for (const call of calls) {
        const salesRep = await User.findById(call.salesRepId);
        const decisionMaker = await User.findById(call.decisionMakerId);
        const callObj = this.toPlainObject(call);
        callObj.salesRepName = salesRep ? `${salesRep.firstName} ${salesRep.lastName}` : 'Unknown';
        callObj.decisionMakerName = decisionMaker ? `${decisionMaker.firstName} ${decisionMaker.lastName}` : 'Unknown';
        populatedCalls.push(callObj);
      }
      
      return populatedCalls;
    } catch (error) {
      console.error('Error getting all calls:', error);
      return [];
    }
  }

  // Super Admin methods
  async getUsersByRole(role: string): Promise<any[]> {
    try {
      await connectToMongoDB();
      const users = await User.find({ role }).sort({ createdAt: -1 });
      return users.map(user => this.toPlainObject(user));
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  async getUsersWithPagination(page: number, limit: number, filters?: any): Promise<{users: any[], total: number}> {
    try {
      await connectToMongoDB();
      const skip = (page - 1) * limit;
      const query = filters || {};
      
      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await User.countDocuments(query);
      
      return {
        users: users.map(user => this.toPlainObject(user)),
        total
      };
    } catch (error) {
      console.error('Error getting users with pagination:', error);
      return { users: [], total: 0 };
    }
  }

  // Subscription Plan CRUD methods
  async getAllSubscriptionPlans(): Promise<any[]> {
    try {
      await connectToMongoDB();
      const plans = await SubscriptionPlan.find({ isActive: true }).sort({ createdAt: 1 });
      return plans.map(plan => ({
        id: plan._id.toString(),
        name: plan.name,
        description: plan.description,
        price: plan.price,
        billingInterval: plan.billingInterval,
        features: plan.features,
        maxCallCredits: plan.maxCallCredits,
        maxInvitations: plan.maxInvitations,
        prioritySupport: plan.prioritySupport,
        bestSeller: plan.bestSeller,
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }));
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      return [];
    }
  }

  async getSubscriptionPlan(id: string): Promise<any | undefined> {
    try {
      await connectToMongoDB();
      const plan = await SubscriptionPlan.findById(id);
      if (plan) {
        return {
          id: plan._id.toString(),
          name: plan.name,
          description: plan.description,
          price: plan.price,
          billingInterval: plan.billingInterval,
          features: plan.features,
          maxCallCredits: plan.maxCallCredits,
          maxInvitations: plan.maxInvitations,
          prioritySupport: plan.prioritySupport,
          bestSeller: plan.bestSeller,
          isActive: plan.isActive,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error getting subscription plan:', error);
      return undefined;
    }
  }

  async createSubscriptionPlan(planData: any): Promise<any> {
    try {
      await connectToMongoDB();
      
      // If this plan is marked as best seller, remove best seller from all other plans
      if (planData.bestSeller) {
        await SubscriptionPlan.updateMany({}, { $set: { bestSeller: false } });
      }
      
      const plan = new SubscriptionPlan(planData);
      const savedPlan = await plan.save();
      
      return {
        id: savedPlan._id.toString(),
        name: savedPlan.name,
        description: savedPlan.description,
        price: savedPlan.price,
        billingInterval: savedPlan.billingInterval,
        features: savedPlan.features,
        maxCallCredits: savedPlan.maxCallCredits,
        maxInvitations: savedPlan.maxInvitations,
        prioritySupport: savedPlan.prioritySupport,
        bestSeller: savedPlan.bestSeller,
        isActive: savedPlan.isActive,
        createdAt: savedPlan.createdAt,
        updatedAt: savedPlan.updatedAt
      };
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      throw error;
    }
  }

  async updateSubscriptionPlan(id: string, updates: any): Promise<any | undefined> {
    try {
      await connectToMongoDB();
      
      // If this plan is being marked as best seller, remove best seller from all other plans
      if (updates.bestSeller === true) {
        await SubscriptionPlan.updateMany({ _id: { $ne: id } }, { $set: { bestSeller: false } });
      }
      
      const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
      
      if (updatedPlan) {
        return {
          id: updatedPlan._id.toString(),
          name: updatedPlan.name,
          description: updatedPlan.description,
          price: updatedPlan.price,
          billingInterval: updatedPlan.billingInterval,
          features: updatedPlan.features,
          maxCallCredits: updatedPlan.maxCallCredits,
          maxInvitations: updatedPlan.maxInvitations,
          prioritySupport: updatedPlan.prioritySupport,
          bestSeller: updatedPlan.bestSeller,
          isActive: updatedPlan.isActive,
          createdAt: updatedPlan.createdAt,
          updatedAt: updatedPlan.updatedAt
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  }

  async deleteSubscriptionPlan(id: string): Promise<boolean> {
    try {
      await connectToMongoDB();
      const result = await SubscriptionPlan.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      return false;
    }
  }

  // Activity Log methods (using console for now, can be extended to database)
  async createActivityLog(log: any): Promise<any> {
    console.log('Activity Log:', log);
    return { ...log, id: Date.now().toString(), createdAt: new Date() };
  }

  async getActivityLogs(page: number, limit: number, filters?: any): Promise<{logs: any[], total: number}> {
    // For now, return empty logs (in real system, would fetch from database)
    return { logs: [], total: 0 };
  }

  // Analytics methods
  async getUserAnalytics(): Promise<any> {
    try {
      await connectToMongoDB();
      
      const totalUsers = await User.countDocuments();
      const salesReps = await User.countDocuments({ role: 'sales_rep' });
      const decisionMakers = await User.countDocuments({ role: 'decision_maker' });
      const activeUsers = await User.countDocuments({ isActive: true });
      const inactiveUsers = await User.countDocuments({ isActive: false });
      
      // Get user growth over time (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      return {
        totalUsers,
        salesReps,
        decisionMakers,
        activeUsers,
        inactiveUsers,
        newUsersThisMonth,
        userGrowthRate: totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return {
        totalUsers: 0,
        salesReps: 0,
        decisionMakers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        newUsersThisMonth: 0,
        userGrowthRate: 0
      };
    }
  }

  async getCallAnalytics(): Promise<any> {
    try {
      await connectToMongoDB();
      
      const totalCalls = await Call.countDocuments();
      const completedCalls = await Call.countDocuments({ status: 'completed' });
      const scheduledCalls = await Call.countDocuments({ status: 'scheduled' });
      const cancelledCalls = await Call.countDocuments({ status: 'cancelled' });
      
      // Get calls this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const callsThisMonth = await Call.countDocuments({
        createdAt: { $gte: thisMonth }
      });
      
      // Calculate average rating
      const callsWithRating = await Call.find({ rating: { $exists: true, $ne: null } });
      const averageRating = callsWithRating.length > 0 
        ? (callsWithRating.reduce((sum, call) => sum + (call.rating || 0), 0) / callsWithRating.length).toFixed(1)
        : 0;
      
      return {
        totalCalls,
        completedCalls,
        scheduledCalls,
        cancelledCalls,
        callsThisMonth,
        averageRating,
        completionRate: totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting call analytics:', error);
      return {
        totalCalls: 0,
        completedCalls: 0,
        scheduledCalls: 0,
        cancelledCalls: 0,
        callsThisMonth: 0,
        averageRating: 0,
        completionRate: 0
      };
    }
  }

  async getSubscriptionAnalytics(): Promise<any> {
    try {
      await connectToMongoDB();
      
      const freeUsers = await User.countDocuments({ packageType: 'free' });
      const basicUsers = await User.countDocuments({ packageType: 'basic' });
      const premiumUsers = await User.countDocuments({ packageType: 'premium' });
      const totalUsers = await User.countDocuments();
      
      return {
        freeUsers,
        basicUsers,
        premiumUsers,
        totalUsers,
        freePercentage: totalUsers > 0 ? ((freeUsers / totalUsers) * 100).toFixed(1) : 0,
        basicPercentage: totalUsers > 0 ? ((basicUsers / totalUsers) * 100).toFixed(1) : 0,
        premiumPercentage: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      return {
        freeUsers: 0,
        basicUsers: 0,
        premiumUsers: 0,
        totalUsers: 0,
        freePercentage: 0,
        basicPercentage: 0,
        premiumPercentage: 0
      };
    }
  }

  // Calendar integration methods
  async getCallById(id: string): Promise<any | undefined> {
    try {
      await connectToMongoDB();
      const call = await Call.findById(id);
      return call ? this.toPlainObject(call) : undefined;
    } catch (error) {
      console.error('Error getting call by ID:', error);
      return undefined;
    }
  }

  // Flag system methods
  async getUserFlag(userId: string): Promise<any | undefined> {
    try {
      await connectToMongoDB();
      const userFlag = await UserFlag.findOne({ userId });
      return userFlag ? this.toPlainObject(userFlag) : undefined;
    } catch (error) {
      console.error('Error getting user flag:', error);
      return undefined;
    }
  }

  async updateUserFlag(userId: string, flagData: any): Promise<any> {
    try {
      await connectToMongoDB();
      const userFlag = await UserFlag.findOneAndUpdate(
        { userId },
        { ...flagData, lastCalculated: new Date() },
        { new: true, upsert: true }
      );
      return this.toPlainObject(userFlag);
    } catch (error) {
      console.error('Error updating user flag:', error);
      throw error;
    }
  }

  async createFlagHistory(historyData: any): Promise<any> {
    try {
      await connectToMongoDB();
      const history = new FlagHistory(historyData);
      await history.save();
      return this.toPlainObject(history);
    } catch (error) {
      console.error('Error creating flag history:', error);
      throw error;
    }
  }

  async getFlagRules(userType?: string): Promise<any[]> {
    try {
      await connectToMongoDB();
      const query: any = { isActive: true };
      if (userType) query.userType = userType;
      
      const rules = await FlagRule.find(query);
      return rules.map(rule => this.toPlainObject(rule));
    } catch (error) {
      console.error('Error getting flag rules:', error);
      return [];
    }
  }

  async getFlagHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      await connectToMongoDB();
      const history = await FlagHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
      return history.map(h => this.toPlainObject(h));
    } catch (error) {
      console.error('Error getting flag history:', error);
      return [];
    }
  }

  async initializeUserFlag(userId: string, userType: string): Promise<any> {
    try {
      await connectToMongoDB();
      const existingFlag = await UserFlag.findOne({ userId });
      if (existingFlag) {
        return this.toPlainObject(existingFlag);
      }

      const userFlag = new UserFlag({
        userId,
        userType,
        currentFlag: 'green',
        flagSeverity: 'low',
        lastCalculated: new Date(),
        violations: [],
        metrics: {
          missedFollowups: 0,
          invalidLeads: 0,
          responseTime: 0,
          complianceScore: 100,
          callsScheduled: 0,
          callsCompleted: 0,
          invitationsSent: 0,
          invitationsAccepted: 0
        }
      });
      
      await userFlag.save();
      return this.toPlainObject(userFlag);
    } catch (error) {
      console.error('Error initializing user flag:', error);
      throw error;
    }
  }

  async calculateUserRisk(userId: string, userType: string): Promise<any> {
    try {
      await connectToMongoDB();
      
      // Get current metrics from various sources
      const metrics = await this.calculateUserMetrics(userId, userType);
      const rules = await this.getFlagRules(userType);
      
      let newFlag = 'green';
      let flagReason = 'All metrics within acceptable ranges';
      let flagSeverity = 'low';
      
      // Check each rule against metrics
      for (const rule of rules) {
        const metricValue = metrics[rule.metric] || 0;
        
        if (metricValue >= rule.thresholds.red) {
          newFlag = 'red';
          flagReason = `${rule.description} (${metricValue} >= ${rule.thresholds.red})`;
          flagSeverity = 'high';
          break;
        } else if (metricValue >= rule.thresholds.amber && newFlag !== 'red') {
          newFlag = 'amber';
          flagReason = `${rule.description} (${metricValue} >= ${rule.thresholds.amber})`;
          flagSeverity = 'medium';
        }
      }
      
      // Get current flag
      const currentUserFlag = await this.getUserFlag(userId);
      const previousFlag = currentUserFlag?.currentFlag || 'green';
      
      // Update user flag
      const updatedFlag = await this.updateUserFlag(userId, {
        userType,
        currentFlag: newFlag,
        flagReason,
        flagSeverity,
        metrics
      });
      
      // Create history record if flag changed
      if (previousFlag !== newFlag) {
        await this.createFlagHistory({
          userId,
          userType,
          previousFlag,
          newFlag,
          reason: flagReason,
          severity: flagSeverity,
          autoGenerated: true,
          metadata: { metrics, triggeredRules: rules.filter(r => metrics[r.metric] >= r.thresholds.amber) }
        });
      }
      
      return {
        ...updatedFlag,
        previousFlag,
        flagChanged: previousFlag !== newFlag
      };
    } catch (error) {
      console.error('Error calculating user risk:', error);
      throw error;
    }
  }

  private async calculateUserMetrics(userId: string, userType: string): Promise<any> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const metrics = {
        missedFollowups: 0,
        invalidLeads: 0,
        responseTime: 24, // hours
        complianceScore: 100,
        callsScheduled: 0,
        callsCompleted: 0,
        invitationsSent: 0,
        invitationsAccepted: 0
      };
      
      if (userType === 'sales_rep') {
        // Calculate sales rep specific metrics
        const invitations = await Invitation.find({
          salesRepId: userId,
          createdAt: { $gte: thirtyDaysAgo }
        });
        
        const calls = await Call.find({
          salesRepId: userId,
          createdAt: { $gte: thirtyDaysAgo }
        });
        
        metrics.invitationsSent = invitations.length;
        metrics.invitationsAccepted = invitations.filter(inv => inv.status === 'accepted').length;
        metrics.callsScheduled = calls.length;
        metrics.callsCompleted = calls.filter(call => call.status === 'completed').length;
        
        // Calculate compliance score based on performance
        const acceptanceRate = metrics.invitationsSent > 0 ? (metrics.invitationsAccepted / metrics.invitationsSent) * 100 : 100;
        const completionRate = metrics.callsScheduled > 0 ? (metrics.callsCompleted / metrics.callsScheduled) * 100 : 100;
        
        metrics.complianceScore = Math.round((acceptanceRate + completionRate) / 2);
        
        // Demo violations for testing
        if (metrics.invitationsSent > 20) metrics.missedFollowups = Math.floor(metrics.invitationsSent * 0.1);
        if (metrics.complianceScore < 70) metrics.invalidLeads = Math.floor(metrics.invitationsSent * 0.05);
        
      } else if (userType === 'decision_maker') {
        // Calculate decision maker specific metrics
        const receivedInvitations = await Invitation.find({
          decisionMakerEmail: { $exists: true },
          createdAt: { $gte: thirtyDaysAgo }
        });
        
        const participatedCalls = await Call.find({
          decisionMakerId: userId,
          createdAt: { $gte: thirtyDaysAgo }
        });
        
        // Demo calculations for decision makers
        const responseRate = receivedInvitations.length > 0 ? 
          (receivedInvitations.filter(inv => inv.status !== 'pending').length / receivedInvitations.length) * 100 : 100;
        
        metrics.complianceScore = Math.round(responseRate);
        
        if (responseRate < 50) metrics.missedFollowups = receivedInvitations.length - receivedInvitations.filter(inv => inv.status !== 'pending').length;
      }
      
      return metrics;
    } catch (error) {
      console.error('Error calculating user metrics:', error);
      return {
        missedFollowups: 0,
        invalidLeads: 0,
        responseTime: 24,
        complianceScore: 100,
        callsScheduled: 0,
        callsCompleted: 0,
        invitationsSent: 0,
        invitationsAccepted: 0
      };
    }
  }

  private toPlainObject(mongooseDoc: any): any {
    const obj = mongooseDoc.toObject();
    // Convert MongoDB _id to id for consistency
    if (obj._id) {
      obj.id = obj._id.toString();
    }
    return obj;
  }
}