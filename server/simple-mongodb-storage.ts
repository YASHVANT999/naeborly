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

  private toPlainObject(mongooseDoc: any): any {
    const obj = mongooseDoc.toObject();
    // Convert MongoDB _id to id for consistency
    if (obj._id) {
      obj.id = obj._id.toString();
    }
    return obj;
  }
}