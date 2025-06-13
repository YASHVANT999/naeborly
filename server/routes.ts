import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertInvitationSchema, 
  insertCallSchema, 
  salesRepPersonalInfoSchema, 
  salesRepProfessionalSchema, 
  salesRepInvitesSchema, 
  salesRepPackageSchema,
  decisionMakerPersonalInfoSchema,
  decisionMakerProfessionalSchema,
  decisionMakerAvailabilitySchema,
  decisionMakerNominationSchema,
  decisionMakerPackageSchema
} from "@shared/schema";
import bcrypt from "bcrypt";

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    signupUserId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user (mock endpoint)
  app.get("/api/user", async (req, res) => {
    // For demo purposes, return a mock sales rep user
    const user = await storage.getUser("1");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  // Get invitations for current user
  app.get("/api/invitations", async (req, res) => {
    try {
      // For demo purposes, get invitations for user ID 1 (sales rep)
      const invitations = await storage.getInvitationsByUserId("1");
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Create new invitation
  app.post("/api/invitations", async (req, res) => {
    try {
      const validatedData = insertInvitationSchema.parse({
        ...req.body,
        salesRepId: 1 // Mock current user ID
      });
      
      const invitation = await storage.createInvitation(validatedData);
      res.status(201).json(invitation);
    } catch (error) {
      res.status(400).json({ message: "Invalid invitation data" });
    }
  });

  // Update invitation status
  app.patch("/api/invitations/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const invitation = await storage.updateInvitationStatus(id, status);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update invitation" });
    }
  });

  // Get calls for current user
  app.get("/api/calls", async (req, res) => {
    try {
      // For demo purposes, get calls for user ID 1 or 2
      const userId = req.query.userId ? req.query.userId as string : "1";
      const calls = await storage.getCallsByUserId(userId);
      res.json(calls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calls" });
    }
  });

  // Create new call
  app.post("/api/calls", async (req, res) => {
    try {
      const validatedData = insertCallSchema.parse(req.body);
      const call = await storage.createCall(validatedData);
      res.status(201).json(call);
    } catch (error) {
      res.status(400).json({ message: "Invalid call data" });
    }
  });

  // Update call
  app.patch("/api/calls/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const call = await storage.updateCall(id, updates);
      if (!call) {
        return res.status(404).json({ message: "Call not found" });
      }
      
      res.json(call);
    } catch (error) {
      res.status(500).json({ message: "Failed to update call" });
    }
  });

  // Sales Rep Signup API Routes
  
  // LinkedIn verification endpoint
  app.post("/api/verify-linkedin", async (req, res) => {
    try {
      const { linkedinUrl } = req.body;
      
      if (!linkedinUrl || !linkedinUrl.includes("linkedin.com")) {
        return res.status(400).json({ message: "Invalid LinkedIn URL" });
      }
      
      // Basic LinkedIn URL validation
      const urlPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
      if (!urlPattern.test(linkedinUrl)) {
        return res.status(400).json({ message: "Please provide a valid LinkedIn profile URL" });
      }
      
      // Simulate verification process
      res.json({ verified: true, message: "LinkedIn profile verified successfully" });
    } catch (error) {
      res.status(500).json({ message: "LinkedIn verification failed" });
    }
  });

  // Save personal information
  app.post("/api/sales-rep/personal-info", async (req, res) => {
    try {
      console.log('Received signup request:', req.body);
      const validatedData = salesRepPersonalInfoSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        console.log('Email already exists:', validatedData.email);
        return res.status(400).json({ message: "Email address is already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Save user data temporarily in session or create incomplete user record
      const userData = {
        email: validatedData.email,
        password: hashedPassword,
        role: "sales_rep",
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        linkedinUrl: validatedData.linkedinUrl,
        linkedinVerified: req.body.linkedinVerified || false,
        isActive: false // Mark as inactive until signup is complete
      };
      
      console.log('Creating user with data:', userData);
      const user = await storage.createUser(userData);
      console.log('User created successfully:', user.id);
      
      // Store user ID in session for multi-step process
      (req.session as any).signupUserId = user.id;
      
      res.json({ success: true, message: "Personal information saved", userId: user.id });
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save personal information", error: error.message });
    }
  });

  // Save professional background
  app.post("/api/sales-rep/professional-info", async (req, res) => {
    try {
      const validatedData = salesRepProfessionalSchema.parse(req.body);
      
      // Get user ID from session
      const userId = (req.session as any)?.signupUserId;
      if (!userId) {
        return res.status(400).json({ message: "Please complete personal information first" });
      }
      
      // Update user with professional information
      const updatedUser = await storage.updateUser(userId, {
        jobTitle: validatedData.jobTitle,
        company: validatedData.company,
        industry: validatedData.industry,
        companySize: validatedData.companySize,
        yearsInRole: validatedData.yearsInRole,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true, message: "Professional information saved" });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save professional information" });
    }
  });

  // Save decision maker invitations
  app.post("/api/sales-rep/invites", async (req, res) => {
    try {
      const validatedData = salesRepInvitesSchema.parse(req.body);
      
      // Get user ID from session
      const userId = (req.session as any)?.signupUserId;
      if (!userId) {
        return res.status(400).json({ message: "Please complete previous steps first" });
      }
      
      // Create invitations for each decision maker
      const invitations = [];
      if (validatedData.decisionMakers) {
        for (const dm of validatedData.decisionMakers) {
          if (dm.name && dm.email) {
            const invitation = await storage.createInvitation({
              salesRepId: userId,
              decisionMakerEmail: dm.email,
              decisionMakerName: dm.name,
              status: "pending"
            });
            invitations.push(invitation);
          }
        }
      }
      
      res.json({ success: true, message: "Invitations saved", invitations });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save invitations" });
    }
  });

  // Complete signup with package selection
  app.post("/api/sales-rep/package", async (req, res) => {
    try {
      const validatedData = salesRepPackageSchema.parse(req.body);
      
      // Get user ID from session
      const userId = (req.session as any)?.signupUserId;
      if (!userId) {
        return res.status(400).json({ message: "Please complete previous steps first" });
      }
      
      // Update user with package selection and activate account
      const updatedUser = await storage.updateUser(userId, {
        packageType: validatedData.packageType,
        isActive: true
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Clear signup session
      delete (req.session as any).signupUserId;
      
      res.json({ 
        success: true, 
        message: "Signup completed successfully", 
        user: updatedUser 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to complete signup" });
    }
  });

  // ===== DECISION MAKER SIGNUP ROUTES =====

  // Save decision maker personal information
  app.post("/api/decision-maker/personal-info", async (req, res) => {
    try {
      console.log('Received decision maker signup request:', req.body);
      const validatedData = decisionMakerPersonalInfoSchema.parse(req.body);
      console.log('Validated decision maker data:', validatedData);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        console.log('Email already exists:', validatedData.email);
        return res.status(400).json({ message: "Email address is already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Save decision maker data
      const userData = {
        email: validatedData.email,
        password: hashedPassword,
        role: "decision_maker",
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        linkedinUrl: validatedData.linkedinUrl,
        linkedinVerified: req.body.linkedinVerified || false,
        isActive: false // Mark as inactive until signup is complete
      };
      
      console.log('Creating decision maker with data:', userData);
      const user = await storage.createUser(userData);
      console.log('Decision maker created successfully:', user.id);
      
      // Store user ID in session for multi-step process
      (req.session as any).signupUserId = user.id;
      
      res.json({ success: true, message: "Personal information saved", userId: user.id });
    } catch (error: any) {
      console.error('Decision maker signup error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save personal information", error: error.message });
    }
  });

  // Save decision maker professional background
  app.post("/api/decision-maker/professional-info", async (req, res) => {
    try {
      const validatedData = decisionMakerProfessionalSchema.parse(req.body);
      
      // Get user ID from session
      const userId = (req.session as any)?.signupUserId;
      if (!userId) {
        return res.status(400).json({ message: "Please complete personal information first" });
      }
      
      // Update user with professional information
      const updatedUser = await storage.updateUser(userId, {
        jobTitle: validatedData.jobTitle,
        company: validatedData.company,
        industry: validatedData.industry,
        companySize: validatedData.companySize,
        yearsInRole: validatedData.yearsInRole,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true, message: "Professional information saved" });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save professional information" });
    }
  });

  // Save decision maker availability preferences
  app.post("/api/decision-maker/availability", async (req, res) => {
    try {
      const validatedData = decisionMakerAvailabilitySchema.parse(req.body);
      
      // Get user ID from session
      const userId = (req.session as any)?.signupUserId;
      if (!userId) {
        return res.status(400).json({ message: "Please complete previous steps first" });
      }
      
      // Store availability preferences (in a real app, this would go to a separate table)
      // For now, we'll store as JSON in user record or handle differently
      const updatedUser = await storage.updateUser(userId, {
        // Store availability as additional fields or JSON
        availabilityData: JSON.stringify(validatedData)
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true, message: "Availability preferences saved" });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save availability preferences" });
    }
  });

  // Save decision maker nominations
  app.post("/api/decision-maker/nominate", async (req, res) => {
    try {
      const validatedData = decisionMakerNominationSchema.parse(req.body);
      
      // Get user ID from session
      const userId = (req.session as any)?.signupUserId;
      if (!userId) {
        return res.status(400).json({ message: "Please complete previous steps first" });
      }
      
      // Store nominations (in a real app, this would create nomination records)
      // For now, we'll store as JSON or handle differently
      const nominations = [];
      if (validatedData.nominatedSalesReps) {
        for (const rep of validatedData.nominatedSalesReps) {
          if (rep.name && rep.email) {
            nominations.push({
              nominatorId: userId,
              name: rep.name,
              email: rep.email,
              company: rep.company,
              referralReason: rep.referralReason,
              status: "pending"
            });
          }
        }
      }
      
      res.json({ 
        success: true, 
        message: "Nominations saved", 
        nominations: nominations 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save nominations" });
    }
  });

  // Complete decision maker signup with package selection
  app.post("/api/decision-maker/package", async (req, res) => {
    try {
      const validatedData = decisionMakerPackageSchema.parse(req.body);
      
      // Get user ID from session
      const userId = (req.session as any)?.signupUserId;
      if (!userId) {
        return res.status(400).json({ message: "Please complete previous steps first" });
      }
      
      // Update user with package selection and activate account
      const updatedUser = await storage.updateUser(userId, {
        packageType: validatedData.packageType,
        isActive: true
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Clear signup session
      delete (req.session as any).signupUserId;
      
      res.json({ 
        success: true, 
        message: "Signup completed successfully", 
        user: updatedUser 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to complete signup" });
    }
  });

  // ===== LOGIN ROUTE =====
  
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check if account is active (completed signup)
      if (!user.isActive) {
        return res.status(401).json({ message: "Please complete your signup process first" });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Store user session
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;
      
      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        message: "Login successful",
        user: userWithoutPassword
      });
      
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed", error: error.message });
    }
  });

  // ===== LOGOUT ROUTE =====
  
  app.post("/api/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ success: true, message: "Logout successful" });
      });
    } catch (error: any) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // ===== GET CURRENT USER ROUTE =====
  
  app.get("/api/current-user", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
      
    } catch (error: any) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
