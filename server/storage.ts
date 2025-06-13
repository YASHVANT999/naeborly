import { 
  users, 
  invitations, 
  calls, 
  type User, 
  type InsertUser,
  type Invitation,
  type InsertInvitation,
  type Call,
  type InsertCall
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Invitation methods
  getInvitationsByUserId(userId: number): Promise<Invitation[]>;
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  updateInvitationStatus(id: number, status: string): Promise<Invitation | undefined>;
  
  // Call methods
  getCallsByUserId(userId: number): Promise<Call[]>;
  createCall(call: InsertCall): Promise<Call>;
  updateCall(id: number, updates: Partial<Call>): Promise<Call | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private invitations: Map<number, Invitation>;
  private calls: Map<number, Call>;
  private currentUserId: number;
  private currentInvitationId: number;
  private currentCallId: number;

  constructor() {
    this.users = new Map();
    this.invitations = new Map();
    this.calls = new Map();
    this.currentUserId = 1;
    this.currentInvitationId = 1;
    this.currentCallId = 1;
    
    // Initialize with some mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create mock users
    const salesRep: User = {
      id: 1,
      username: "john_sales",
      password: "password",
      email: "john@example.com",
      role: "sales_rep",
      name: "John Doe",
      company: "TechCorp",
      standing: "good"
    };
    
    const decisionMaker: User = {
      id: 2,
      username: "sarah_dm",
      password: "password", 
      email: "sarah@example.com",
      role: "decision_maker",
      name: "Sarah Johnson",
      company: "CloudScale Inc",
      standing: "excellent"
    };

    this.users.set(1, salesRep);
    this.users.set(2, decisionMaker);
    this.currentUserId = 3;

    // Create mock invitations
    const invitation1: Invitation = {
      id: 1,
      salesRepId: 1,
      decisionMakerEmail: "sarah@techcorp.com",
      decisionMakerName: "Sarah Chen",
      status: "pending",
      createdAt: new Date()
    };

    const invitation2: Invitation = {
      id: 2,
      salesRepId: 1, 
      decisionMakerEmail: "michael@leadflow.com",
      decisionMakerName: "Michael Rodriguez",
      status: "accepted",
      createdAt: new Date()
    };

    this.invitations.set(1, invitation1);
    this.invitations.set(2, invitation2);
    this.currentInvitationId = 3;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => `${user.firstName} ${user.lastName}` === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getInvitationsByUserId(userId: number): Promise<Invitation[]> {
    return Array.from(this.invitations.values()).filter(
      (invitation) => invitation.salesRepId === userId
    );
  }

  async createInvitation(insertInvitation: InsertInvitation): Promise<Invitation> {
    const id = this.currentInvitationId++;
    const invitation: Invitation = { 
      ...insertInvitation, 
      id,
      createdAt: new Date()
    };
    this.invitations.set(id, invitation);
    return invitation;
  }

  async updateInvitationStatus(id: number, status: string): Promise<Invitation | undefined> {
    const invitation = this.invitations.get(id);
    if (invitation) {
      invitation.status = status;
      this.invitations.set(id, invitation);
      return invitation;
    }
    return undefined;
  }

  async getCallsByUserId(userId: number): Promise<Call[]> {
    return Array.from(this.calls.values()).filter(
      (call) => call.salesRepId === userId || call.decisionMakerId === userId
    );
  }

  async createCall(insertCall: InsertCall): Promise<Call> {
    const id = this.currentCallId++;
    const call: Call = { ...insertCall, id };
    this.calls.set(id, call);
    return call;
  }

  async updateCall(id: number, updates: Partial<Call>): Promise<Call | undefined> {
    const call = this.calls.get(id);
    if (call) {
      Object.assign(call, updates);
      this.calls.set(id, call);
      return call;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
