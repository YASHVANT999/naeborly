import { User, Invitation, Call, connectToMongoDB } from './mongodb';
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

  // Subscription Plan methods (using User collection for now, can be extended)
  async getAllSubscriptionPlans(): Promise<any[]> {
    // For now, return predefined plans. In a real system, these would be in a separate collection
    return [
      {
        id: 'free',
        name: 'Free Plan',
        description: 'Basic features for getting started',
        price: '$0',
        billingInterval: 'monthly',
        features: ['1 call credit per month', '3 invitations', 'Basic support'],
        maxCallCredits: 1,
        maxInvitations: 3,
        prioritySupport: false,
        isActive: true
      },
      {
        id: 'basic',
        name: 'Basic Plan',
        description: 'Perfect for small teams',
        price: '$29',
        billingInterval: 'monthly',
        features: ['10 call credits per month', '25 invitations', 'Email support'],
        maxCallCredits: 10,
        maxInvitations: 25,
        prioritySupport: false,
        isActive: true
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        description: 'Advanced features for power users',
        price: '$99',
        billingInterval: 'monthly',
        features: ['Unlimited calls', 'Unlimited invitations', 'Priority support', 'Advanced analytics'],
        maxCallCredits: -1,
        maxInvitations: -1,
        prioritySupport: true,
        isActive: true
      }
    ];
  }

  async getSubscriptionPlan(id: string): Promise<any | undefined> {
    const plans = await this.getAllSubscriptionPlans();
    return plans.find(plan => plan.id === id);
  }

  async createSubscriptionPlan(plan: any): Promise<any> {
    // For now, return the plan with generated ID
    return { ...plan, id: Date.now().toString() };
  }

  async updateSubscriptionPlan(id: string, updates: any): Promise<any | undefined> {
    // For now, return the updated plan
    const plan = await this.getSubscriptionPlan(id);
    return plan ? { ...plan, ...updates } : undefined;
  }

  async deleteSubscriptionPlan(id: string): Promise<boolean> {
    // For now, return true (in real system, would delete from database)
    return true;
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

  private toPlainObject(mongooseDoc: any): any {
    const obj = mongooseDoc.toObject();
    // Convert MongoDB _id to id for consistency
    if (obj._id) {
      obj.id = obj._id.toString();
    }
    return obj;
  }
}