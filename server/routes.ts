import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvitationSchema, insertCallSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, name, email, password, role, company, standing } = req.body;
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "User already exists" 
        });
      }

      const newUser = await storage.createUser({
        username,
        name,
        email,
        password,
        role: role || 'sales_rep',
        company: company || null,
        standing: standing || null
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: newUser,
          token: `jwt-token-${newUser.id}`
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Registration failed"
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user,
          token: `jwt-token-${user.id}`
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Login failed"
      });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(' ')[1];
      const userId = token.split('-')[2]; // Extract user ID from token
      
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = Array.from(storage['users'].values());
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch users"
      });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const users = Array.from(storage['users'].values());
      const invitations = Array.from(storage['invitations'].values());
      const calls = Array.from(storage['calls'].values());

      const stats = {
        totalUsers: users.length,
        salesReps: users.filter(u => u.role === 'sales_rep').length,
        decisionMakers: users.filter(u => u.role === 'decision_maker').length,
        admins: users.filter(u => u.role === 'admin').length,
        totalInvitations: invitations.length,
        pendingInvitations: invitations.filter(i => i.status === 'pending').length,
        totalCalls: calls.length,
        completedCalls: calls.filter(c => c.status === 'completed').length
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch stats"
      });
    }
  });

  // Get current user (legacy endpoint)
  app.get("/api/user", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
