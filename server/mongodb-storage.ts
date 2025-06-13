import bcrypt from 'bcrypt';
import { User, Invitation, Call, type UserDocument, type InvitationDocument, type CallDocument } from './mongodb';
import type { IStorage } from './storage';

export interface InsertUser {
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  linkedinUrl?: string;
  linkedinVerified?: boolean;
  jobTitle?: string;
  company?: string;
  industry?: string;
  companySize?: string;
  yearsInRole?: string;
  packageType?: string;
  isActive?: boolean;
  standing?: string;
}

export interface InsertInvitation {
  salesRepId: string;
  decisionMakerEmail: string;
  decisionMakerName: string;
  status?: string;
}

export interface InsertCall {
  salesRepId: string;
  decisionMakerId: string;
  scheduledAt: Date;
  status?: string;
  rating?: number;
  feedback?: string;
  company?: string;
  pitch?: string;
}

export class MongoDBStorage implements IStorage {
  async getUser(id: string): Promise<UserDocument | undefined> {
    try {
      const user = await User.findById(id);
      return user || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<UserDocument | undefined> {
    // MongoDB doesn't have username field, use email instead
    return this.getUserByEmail(username);
  }

  async getUserByEmail(email: string): Promise<UserDocument | undefined> {
    try {
      const user = await User.findOne({ email });
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<UserDocument> {
    try {
      // Hash password before saving
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      await user.save();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<UserDocument>): Promise<UserDocument | undefined> {
    try {
      const user = await User.findByIdAndUpdate(id, updates, { new: true });
      return user || undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async getInvitationsByUserId(userId: string): Promise<InvitationDocument[]> {
    try {
      const invitations = await Invitation.find({ salesRepId: userId });
      return invitations;
    } catch (error) {
      console.error('Error getting invitations:', error);
      return [];
    }
  }

  async createInvitation(invitationData: InsertInvitation): Promise<InvitationDocument> {
    try {
      const invitation = new Invitation(invitationData);
      await invitation.save();
      return invitation;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  async updateInvitationStatus(id: string, status: string): Promise<InvitationDocument | undefined> {
    try {
      const invitation = await Invitation.findByIdAndUpdate(id, { status }, { new: true });
      return invitation || undefined;
    } catch (error) {
      console.error('Error updating invitation status:', error);
      return undefined;
    }
  }

  async getCallsByUserId(userId: string): Promise<CallDocument[]> {
    try {
      const calls = await Call.find({
        $or: [
          { salesRepId: userId },
          { decisionMakerId: userId }
        ]
      });
      return calls;
    } catch (error) {
      console.error('Error getting calls:', error);
      return [];
    }
  }

  async createCall(callData: InsertCall): Promise<CallDocument> {
    try {
      const call = new Call(callData);
      await call.save();
      return call;
    } catch (error) {
      console.error('Error creating call:', error);
      throw error;
    }
  }

  async updateCall(id: string, updates: Partial<CallDocument>): Promise<CallDocument | undefined> {
    try {
      const call = await Call.findByIdAndUpdate(id, updates, { new: true });
      return call || undefined;
    } catch (error) {
      console.error('Error updating call:', error);
      return undefined;
    }
  }
}