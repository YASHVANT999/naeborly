export interface IStorage {
  // User methods
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  getUserByEmail(email: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  updateUser(id: string, updates: any): Promise<any | undefined>;
  
  // Invitation methods
  getInvitationsByUserId(userId: string): Promise<any[]>;
  createInvitation(invitation: any): Promise<any>;
  updateInvitationStatus(id: string, status: string): Promise<any | undefined>;
  
  // Call methods
  getCallsByUserId(userId: string): Promise<any[]>;
  createCall(call: any): Promise<any>;
  updateCall(id: string, updates: any): Promise<any | undefined>;
}

// Import and use only MongoDB storage
import { SimpleMongoDBStorage } from './simple-mongodb-storage';

export const storage = new SimpleMongoDBStorage();