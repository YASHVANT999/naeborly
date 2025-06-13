import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvitationSchema, insertCallSchema, salesRepPersonalInfoSchema, salesRepProfessionalSchema, salesRepInvitesSchema, salesRepPackageSchema } from "@shared/schema";
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
    const user = await storage.getUser(1);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  // Get invitations for current user
  app.get("/api/invitations", async (req, res) => {
    try {
      // For demo purposes, get invitations for user ID 1 (sales rep)
      const invitations = await storage.getInvitationsByUserId(1);
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
      
      const invitation = await storage.updateInvitationStatus(parseInt(id), status);
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
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1;
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
      
      const call = await storage.updateCall(parseInt(id), updates);
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
      const validatedData = salesRepPersonalInfoSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
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
      
      const user = await storage.createUser(userData);
      
      // Store user ID in session for multi-step process
      (req.session as any).signupUserId = user.id;
      
      res.json({ success: true, message: "Personal information saved", userId: user.id });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save personal information" });
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
  app.post("/api/sales-rep/invitations", async (req, res) => {
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
  app.post("/api/sales-rep/complete-signup", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
