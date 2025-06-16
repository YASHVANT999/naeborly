import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { 
  getAuthUrl, 
  setCredentials, 
  oauth2Client,
  getCalendarEvents,
  createCalendarEvent,
  getAvailableSlots,
  updateCalendarEvent,
  deleteCalendarEvent
} from "./google-calendar";
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

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    signupUserId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Public endpoint for subscription plans (for landing page)
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      res.status(500).json({ message: "Failed to get subscription plans" });
    }
  });

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
      
      console.log('LinkedIn verification request:', { linkedinUrl });
      
      if (!linkedinUrl) {
        return res.status(400).json({ 
          verified: false, 
          message: "LinkedIn URL is required" 
        });
      }
      
      if (!linkedinUrl.includes("linkedin.com")) {
        return res.status(400).json({ 
          verified: false, 
          message: "Invalid LinkedIn URL - must be a LinkedIn profile" 
        });
      }
      
      // Enhanced LinkedIn URL validation
      const urlPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-._]+\/?(\?.*)?$/;
      if (!urlPattern.test(linkedinUrl)) {
        return res.status(400).json({ 
          verified: false, 
          message: "Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/your-profile)" 
        });
      }
      
      // Additional checks for common LinkedIn URL formats
      const cleanUrl = linkedinUrl.toLowerCase().trim();
      
      // Check for valid LinkedIn profile path
      if (!cleanUrl.includes('/in/')) {
        return res.status(400).json({ 
          verified: false, 
          message: "LinkedIn URL must be a profile link (containing '/in/')" 
        });
      }
      
      // Extract profile identifier
      const profileMatch = cleanUrl.match(/\/in\/([a-zA-Z0-9-._]+)/);
      if (!profileMatch || profileMatch[1].length < 3) {
        return res.status(400).json({ 
          verified: false, 
          message: "LinkedIn profile identifier is too short or invalid" 
        });
      }
      
      console.log('LinkedIn verification successful for:', profileMatch[1]);
      
      // Verification successful
      res.json({ 
        verified: true, 
        message: "LinkedIn profile verified successfully",
        profileId: profileMatch[1]
      });
      
    } catch (error) {
      console.error('LinkedIn verification error:', error);
      res.status(500).json({ 
        verified: false, 
        message: "LinkedIn verification failed due to server error" 
      });
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

  // ===== SUPER ADMIN ROUTES =====
  
  // Create Super Admin (development only)
  app.post("/api/create-super-admin", async (req, res) => {
    try {
      const email = 'superadmin@naeberly.com';
      const password = 'SuperAdmin123!';
      
      // Check if super admin already exists
      const existingAdmin = await storage.getUserByEmail(email);
      if (existingAdmin) {
        return res.json({ message: "Super admin already exists", email });
      }
      
      // Create super admin user
      const superAdmin = await storage.createUser({
        email,
        password, // Will be hashed in storage
        role: 'super_admin',
        firstName: 'Super',
        lastName: 'Admin',
        isActive: true,
        packageType: 'premium',
        standing: 'excellent'
      });
      
      res.json({ 
        success: true, 
        message: "Super admin created successfully", 
        email,
        temporaryPassword: password 
      });
    } catch (error) {
      console.error('Error creating super admin:', error);
      res.status(500).json({ message: "Failed to create super admin" });
    }
  });
  
  // Super Admin Authentication
  app.post("/api/super-admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Super admin login attempt:', { email, password: '***' });
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== 'super_admin') {
        console.log('Super admin not found or wrong role:', user?.role);
        return res.status(401).json({ message: "Invalid super admin credentials" });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        console.log('Invalid super admin password');
        return res.status(401).json({ message: "Invalid super admin credentials" });
      }
      
      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;
      
      console.log('Super admin login successful:', email);
      res.json({ 
        success: true, 
        message: "Super admin login successful", 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        } 
      });
    } catch (error) {
      console.error('Super admin login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Authentication middleware
  const requireAuthentication = (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    next();
  };

  // Super Admin middleware
  const requireSuperAdmin = (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    const userRole = req.session?.userRole;
    
    if (!userId || userRole !== 'super_admin') {
      return res.status(403).json({ message: "Super admin access required" });
    }
    
    next();
  };

  // Enterprise Admin middleware
  const requireEnterpriseAdmin = async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    const userRole = req.session?.userRole;
    
    if (!userId || userRole !== 'enterprise_admin') {
      return res.status(403).json({ message: "Enterprise admin access required" });
    }

    // Verify domain access
    try {
      const user = await storage.getUser(userId);
      if (!user?.companyDomain || !user?.domainVerified) {
        return res.status(403).json({ message: "Domain verification required for enterprise access" });
      }
      
      // Add user info to request for use in handlers
      req.enterpriseUser = user;
      next();
    } catch (error) {
      return res.status(500).json({ message: "Failed to verify enterprise access" });
    }
  };

  // User Management Routes
  app.get("/api/super-admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const role = req.query.role as string;
      const search = req.query.search as string;
      
      let filters: any = {};
      if (role) filters.role = role;
      if (search) {
        filters.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      const result = await storage.getUsersWithPagination(page, limit, filters);
      res.json(result);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.put("/api/super-admin/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Log activity
      await storage.createActivityLog({
        userId: (req.session as any).userId,
        action: 'UPDATE_USER',
        entityType: 'user',
        entityId: id,
        details: `Updated user: ${JSON.stringify(updates)}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/super-admin/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Log activity
      await storage.createActivityLog({
        userId: (req.session as any).userId,
        action: 'DELETE_USER',
        entityType: 'user',
        entityId: id,
        details: `Deleted user with ID: ${id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Subscription Plan Management Routes
  app.get("/api/super-admin/subscription-plans", requireSuperAdmin, async (req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      res.status(500).json({ message: "Failed to get subscription plans" });
    }
  });

  app.post("/api/super-admin/subscription-plans", requireSuperAdmin, async (req, res) => {
    try {
      const planData = req.body;
      
      // Log activity
      await storage.createActivityLog({
        userId: (req.session as any).userId,
        action: 'CREATE_SUBSCRIPTION_PLAN',
        entityType: 'subscription_plan',
        details: `Created plan: ${planData.name}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      const plan = await storage.createSubscriptionPlan(planData);
      res.json({ success: true, plan });
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      res.status(500).json({ message: "Failed to create subscription plan" });
    }
  });

  app.put("/api/super-admin/subscription-plans/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Log activity
      await storage.createActivityLog({
        userId: (req.session as any).userId,
        action: 'UPDATE_SUBSCRIPTION_PLAN',
        entityType: 'subscription_plan',
        entityId: id,
        details: `Updated plan: ${JSON.stringify(updates)}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      const plan = await storage.updateSubscriptionPlan(id, updates);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      res.json({ success: true, plan });
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      res.status(500).json({ message: "Failed to update subscription plan" });
    }
  });

  app.delete("/api/super-admin/subscription-plans/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Log activity
      await storage.createActivityLog({
        userId: (req.session as any).userId,
        action: 'DELETE_SUBSCRIPTION_PLAN',
        entityType: 'subscription_plan',
        entityId: id,
        details: `Deleted plan with ID: ${id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      const deleted = await storage.deleteSubscriptionPlan(id);
      if (!deleted) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      res.json({ success: true, message: "Subscription plan deleted successfully" });
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      res.status(500).json({ message: "Failed to delete subscription plan" });
    }
  });

  // Analytics Routes
  app.get("/api/super-admin/analytics/users", requireSuperAdmin, async (req, res) => {
    try {
      const analytics = await storage.getUserAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error getting user analytics:', error);
      res.status(500).json({ message: "Failed to get user analytics" });
    }
  });

  app.get("/api/super-admin/analytics/calls", requireSuperAdmin, async (req, res) => {
    try {
      const analytics = await storage.getCallAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error getting call analytics:', error);
      res.status(500).json({ message: "Failed to get call analytics" });
    }
  });

  app.get("/api/super-admin/analytics/subscriptions", requireSuperAdmin, async (req, res) => {
    try {
      const analytics = await storage.getSubscriptionAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      res.status(500).json({ message: "Failed to get subscription analytics" });
    }
  });

  app.get("/api/super-admin/activity-logs", requireSuperAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const result = await storage.getActivityLogs(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Error getting activity logs:', error);
      res.status(500).json({ message: "Failed to get activity logs" });
    }
  });

  // ===== GOOGLE CALENDAR INTEGRATION ROUTES =====

  // Initiate Google Calendar OAuth
  app.get("/api/auth/google/connect", requireAuthentication, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const authUrl = getAuthUrl(userId);
      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating Google auth URL:', error);
      res.status(500).json({ message: "Failed to generate authorization URL" });
    }
  });

  // Google Calendar OAuth callback
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, state: userId } = req.query;

      if (!code || !userId) {
        return res.status(400).json({ message: "Missing authorization code or user ID" });
      }

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Store tokens in user record
      await storage.updateUser(userId as string, {
        googleCalendarTokens: tokens,
        calendarIntegrationEnabled: true
      });

      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/sales-dashboard?calendar=connected`);
    } catch (error) {
      console.error('Error in Google Calendar callback:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/sales-dashboard?calendar=error`);
    }
  });

  // Get calendar integration status
  app.get("/api/calendar/status", requireAuthentication, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      
      res.json({
        connected: user?.calendarIntegrationEnabled || false,
        hasTokens: !!(user?.googleCalendarTokens?.access_token)
      });
    } catch (error) {
      console.error('Error getting calendar status:', error);
      res.status(500).json({ message: "Failed to get calendar status" });
    }
  });

  // Get available time slots for a decision maker
  app.get("/api/calendar/availability/:decisionMakerId", requireAuthentication, async (req, res) => {
    try {
      const { decisionMakerId } = req.params;
      const { startDate, endDate, duration = 30 } = req.query;

      // Get decision maker's calendar tokens
      const decisionMaker = await storage.getUser(decisionMakerId);
      if (!decisionMaker?.googleCalendarTokens?.access_token) {
        return res.status(400).json({ message: "Decision maker calendar not connected" });
      }

      // Set credentials for the decision maker
      setCredentials(decisionMaker.googleCalendarTokens);

      // Get available slots
      const availableSlots = await getAvailableSlots(
        'primary',
        startDate as string,
        endDate as string,
        parseInt(duration as string)
      );

      res.json({ availableSlots });
    } catch (error) {
      console.error('Error getting availability:', error);
      res.status(500).json({ message: "Failed to get availability" });
    }
  });

  // Schedule a meeting
  app.post("/api/calendar/schedule", requireAuthentication, async (req, res) => {
    try {
      const salesRepId = (req.session as any).userId;
      const { 
        decisionMakerId, 
        startTime, 
        endTime, 
        title, 
        description,
        timeZone = 'UTC'
      } = req.body;

      // Get both users
      const salesRep = await storage.getUser(salesRepId);
      const decisionMaker = await storage.getUser(decisionMakerId);

      if (!salesRep || !decisionMaker) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!decisionMaker.googleCalendarTokens?.access_token) {
        return res.status(400).json({ message: "Decision maker calendar not connected" });
      }

      // Set credentials for the decision maker (event will be created in their calendar)
      setCredentials(decisionMaker.googleCalendarTokens);

      // Create calendar event
      const eventData = {
        summary: title || `Meeting with ${salesRep.firstName} ${salesRep.lastName}`,
        description: description || `Sales meeting scheduled through Naeberly platform.`,
        start: { dateTime: startTime, timeZone },
        end: { dateTime: endTime, timeZone },
        attendees: [
          { 
            email: salesRep.email, 
            displayName: `${salesRep.firstName} ${salesRep.lastName}` 
          },
          { 
            email: decisionMaker.email, 
            displayName: `${decisionMaker.firstName} ${decisionMaker.lastName}` 
          }
        ]
      };

      const calendarEvent = await createCalendarEvent(eventData);

      // Store call in database
      const callData = {
        salesRepId,
        decisionMakerId,
        scheduledAt: new Date(startTime),
        endTime: new Date(endTime),
        googleEventId: calendarEvent.id,
        meetingLink: calendarEvent.hangoutLink,
        timeZone,
        status: 'scheduled'
      };

      const call = await storage.createCall(callData);

      res.json({ 
        success: true, 
        call,
        calendarEvent: {
          id: calendarEvent.id,
          link: calendarEvent.htmlLink,
          meetingLink: calendarEvent.hangoutLink
        }
      });
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      res.status(500).json({ message: "Failed to schedule meeting" });
    }
  });

  // ===== TEAM MANAGEMENT ROUTES =====

  // Get company users (sales reps)
  app.get("/api/company-users", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;

      // Get sales reps from the company domain
      const salesReps = await storage.getUsersByCompanyDomain(companyDomain);
      const filteredReps = salesReps.filter(user => user.role === 'sales_rep');

      // Format response with team-specific data
      const teamMembers = filteredReps.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        jobTitle: user.jobTitle,
        department: user.department,
        status: user.isActive ? 'active' : 'suspended',
        permissions: user.permissions || [],
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }));

      res.json(teamMembers);
    } catch (error) {
      console.error('Error getting company users:', error);
      res.status(500).json({ message: "Failed to get company users" });
    }
  });

  // Invite new sales rep
  app.post("/api/company-users/invite", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;
      const { email, firstName, lastName, jobTitle, department, permissions } = req.body;

      // Verify email domain matches company domain
      const emailDomain = email.split('@')[1];
      if (emailDomain !== companyDomain) {
        return res.status(400).json({ 
          message: `Email domain must match company domain: ${companyDomain}` 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create invitation/user record
      const userData = {
        email,
        firstName,
        lastName,
        role: 'sales_rep',
        jobTitle: jobTitle || '',
        department: department || '',
        companyDomain,
        domainVerified: true,
        isActive: false, // Will be activated when they accept invitation
        packageType: 'enterprise',
        standing: 'good',
        permissions: permissions || [],
        password: 'TempPass123!', // Temporary password
        requirePasswordChange: true,
        invitationStatus: 'invited',
        invitedBy: enterpriseUser.id,
        invitedAt: new Date()
      };

      const newUser = await storage.createUser(userData);

      // Log activity
      await storage.createActivityLog({
        action: 'INVITE_SALES_REP',
        performedBy: enterpriseUser.id,
        targetUser: newUser.id,
        details: `Invited sales rep: ${email}`,
        companyDomain
      });

      res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        status: 'invited'
      });
    } catch (error) {
      console.error('Error inviting sales rep:', error);
      res.status(500).json({ message: "Failed to invite sales rep" });
    }
  });

  // Update company user status or permissions
  app.patch("/api/company-users/:userId", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const { userId } = req.params;
      const { status, permissions } = req.body;

      // Verify user belongs to same company domain
      const targetUser = await storage.getUser(userId);
      if (!targetUser || targetUser.companyDomain !== enterpriseUser.companyDomain) {
        return res.status(404).json({ message: "User not found or access denied" });
      }

      // Prepare updates
      const updates: any = {};
      if (status !== undefined) {
        updates.isActive = status === 'active';
        if (status === 'active') {
          updates.invitationStatus = 'accepted';
        }
      }
      if (permissions !== undefined) {
        updates.permissions = permissions;
      }

      // Update user
      const updatedUser = await storage.updateUser(userId, updates);

      // Log activity
      const action = status ? 'UPDATE_USER_STATUS' : 'UPDATE_USER_PERMISSIONS';
      const details = status ? 
        `${status === 'active' ? 'Activated' : 'Suspended'} user: ${targetUser.email}` :
        `Updated permissions for: ${targetUser.email}`;

      await storage.createActivityLog({
        action,
        performedBy: enterpriseUser.id,
        targetUser: userId,
        details,
        companyDomain: enterpriseUser.companyDomain
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating company user:', error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Remove company user
  app.delete("/api/company-users/:userId", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const { userId } = req.params;

      // Verify user belongs to same company domain
      const targetUser = await storage.getUser(userId);
      if (!targetUser || targetUser.companyDomain !== enterpriseUser.companyDomain) {
        return res.status(404).json({ message: "User not found or access denied" });
      }

      // Remove user
      const removed = await storage.deleteUser(userId);
      if (!removed) {
        return res.status(500).json({ message: "Failed to remove user" });
      }

      // Log activity
      await storage.createActivityLog({
        action: 'REMOVE_SALES_REP',
        performedBy: enterpriseUser.id,
        targetUser: userId,
        details: `Removed sales rep: ${targetUser.email}`,
        companyDomain: enterpriseUser.companyDomain
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error removing company user:', error);
      res.status(500).json({ message: "Failed to remove user" });
    }
  });

  // Get decision makers for permissions assignment
  app.get("/api/enterprise-admin/decision-makers", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;

      // Get decision makers from the company domain
      const allUsers = await storage.getUsersByCompanyDomain(companyDomain);
      const decisionMakers = allUsers.filter(user => user.role === 'decision_maker');

      // Format response
      const dms = decisionMakers.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        jobTitle: user.jobTitle,
        company: user.company || companyDomain
      }));

      res.json(dms);
    } catch (error) {
      console.error('Error getting decision makers:', error);
      res.status(500).json({ message: "Failed to get decision makers" });
    }
  });

  // ===== ENTERPRISE ADMIN ROUTES =====

  // Get enterprise analytics
  app.get("/api/enterprise-admin/analytics", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = req.enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;

      // Get company users analytics
      const companyUsers = await storage.getUsersByCompanyDomain(companyDomain);
      const totalUsers = companyUsers.length;
      const salesReps = companyUsers.filter(u => u.role === 'sales_rep').length;
      const decisionMakers = companyUsers.filter(u => u.role === 'decision_maker').length;
      const activeUsers = companyUsers.filter(u => u.isActive).length;

      // Get current month data
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const newUsersThisMonth = companyUsers.filter(u => 
        new Date(u.createdAt) >= currentMonth
      ).length;

      // Get meeting analytics for company
      const companyUserIds = companyUsers.map(u => u.id);
      const allCalls = await storage.getAllCalls();
      const companyCalls = allCalls.filter(call => 
        companyUserIds.includes(call.salesRepId) || companyUserIds.includes(call.decisionMakerId)
      );

      const monthlyMeetings = companyCalls.filter(call => 
        new Date(call.createdAt) >= currentMonth
      ).length;

      const scheduledMeetings = companyCalls.filter(call => call.status === 'scheduled').length;
      const completedMeetings = companyCalls.filter(call => call.status === 'completed').length;
      const completionRate = companyCalls.length > 0 ? 
        Math.round((completedMeetings / companyCalls.length) * 100) : 0;

      res.json({
        totalUsers,
        salesReps,
        decisionMakers,
        activeUsers,
        activeSalesReps: salesReps,
        newUsersThisMonth,
        monthlyMeetings,
        scheduledMeetings,
        totalInvitations: await storage.getCompanyInvitationsCount(companyDomain),
        meetingTrend: 15, // Mock trend data
        salesRepGrowth: 8,
        completionRate
      });
    } catch (error) {
      console.error('Error getting enterprise analytics:', error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // Get company users
  app.get("/api/enterprise-admin/users", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = req.enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;

      const users = await storage.getUsersByCompanyDomain(companyDomain);
      
      // Filter out sensitive information
      const filteredUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        jobTitle: user.jobTitle,
        department: user.department,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }));

      res.json(filteredUsers);
    } catch (error) {
      console.error('Error getting company users:', error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Create enterprise user
  app.post("/api/enterprise-admin/create-user", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = req.enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;
      const { email, firstName, lastName, role, jobTitle, department } = req.body;

      // Verify email domain matches company domain
      const emailDomain = email.split('@')[1];
      if (emailDomain !== companyDomain) {
        return res.status(400).json({ 
          message: `Email domain must match company domain: ${companyDomain}` 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create user with enterprise settings
      const userData = {
        email,
        firstName,
        lastName,
        role,
        jobTitle: jobTitle || '',
        department: department || '',
        companyDomain,
        domainVerified: true,
        isActive: true,
        packageType: 'enterprise',
        standing: 'excellent',
        password: 'TempPass123!', // Temporary password - should be changed on first login
        requirePasswordChange: true
      };

      const newUser = await storage.createUser(userData);

      // Log enterprise activity
      await storage.createActivityLog({
        action: 'CREATE_ENTERPRISE_USER',
        performedBy: enterpriseUser.id,
        targetUser: newUser.id,
        details: `Created enterprise user: ${email}`,
        companyDomain
      });

      res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        temporaryPassword: 'TempPass123!' // Return temp password for setup
      });
    } catch (error) {
      console.error('Error creating enterprise user:', error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user status
  app.patch("/api/enterprise-admin/users/:userId/status", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = req.enterpriseUser;
      const { userId } = req.params;
      const { isActive } = req.body;

      // Verify user belongs to same company domain
      const targetUser = await storage.getUser(userId);
      if (!targetUser || targetUser.companyDomain !== enterpriseUser.companyDomain) {
        return res.status(404).json({ message: "User not found or access denied" });
      }

      // Update user status
      const updatedUser = await storage.updateUser(userId, { isActive });

      // Log enterprise activity
      await storage.createActivityLog({
        action: 'UPDATE_USER_STATUS',
        performedBy: enterpriseUser.id,
        targetUser: userId,
        details: `${isActive ? 'Activated' : 'Deactivated'} user: ${targetUser.email}`,
        companyDomain: enterpriseUser.companyDomain
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Get domain settings
  app.get("/api/enterprise-admin/domain-settings", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = req.enterpriseUser;
      
      res.json({
        verifiedDomain: enterpriseUser.companyDomain,
        autoApproveUsers: true,
        domainRestrictions: true,
        verificationDate: enterpriseUser.domainVerifiedAt || new Date(),
        settings: {
          requireMFA: false,
          sessionTimeout: 8, // hours
          allowGuestAccess: false
        }
      });
    } catch (error) {
      console.error('Error getting domain settings:', error);
      res.status(500).json({ message: "Failed to get domain settings" });
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
      
      console.log('Login attempt:', { email, password: password ? '***' : 'missing' });
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      console.log('User found:', user ? { id: user.id, email: user.email, role: user.role, isActive: user.isActive } : 'NOT FOUND');
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check if account is active (completed signup)
      if (!user.isActive) {
        console.log('User account inactive');
        return res.status(401).json({ message: "Please complete your signup process first" });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isPasswordValid);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Store user session
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;
      
      console.log('Login successful for:', user.email);
      
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

  // ===== SALES REP DASHBOARD ROUTES =====

  // Get sales rep's invitations
  app.get("/api/sales-rep/invitations", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const invitations = await storage.getInvitationsByUserId(userId);
      res.json(invitations);
    } catch (error: any) {
      console.error('Get invitations error:', error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Get sales rep's calls
  app.get("/api/sales-rep/calls", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const calls = await storage.getCallsByUserId(userId);
      res.json(calls);
    } catch (error: any) {
      console.error('Get calls error:', error);
      res.status(500).json({ message: "Failed to fetch calls" });
    }
  });

  // Get sales rep's metrics
  app.get("/api/sales-rep/metrics", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const invitations = await storage.getInvitationsByUserId(userId);
      const calls = await storage.getCallsByUserId(userId);

      // Calculate metrics
      const totalInvitations = invitations.length;
      const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted').length;
      const pendingInvitations = invitations.filter(inv => inv.status === 'pending').length;
      const completedCalls = calls.filter(call => call.status === 'completed').length;
      const upcomingCalls = calls.filter(call => call.status === 'scheduled').length;
      
      // Calculate success rate
      const successRate = completedCalls > 0 ? Math.round((completedCalls / calls.length) * 100) : 0;
      
      // Package limits based on user's package type
      const packageLimits = {
        'free': { dmLimit: 1, callCredits: 1 },
        'pro': { dmLimit: 10, callCredits: 10 },
        'pro-team': { dmLimit: 50, callCredits: 50 },
        'enterprise': { dmLimit: 500, callCredits: 500 }
      };

      const limits = packageLimits[user.packageType as keyof typeof packageLimits] || packageLimits['free'];

      const metrics = {
        callCredits: limits.callCredits - completedCalls,
        maxCallCredits: limits.callCredits,
        dmInvitations: totalInvitations,
        maxDmInvitations: limits.dmLimit,
        acceptedInvitations,
        pendingInvitations,
        upcomingCalls,
        completedCalls,
        successRate: completedCalls > 0 ? successRate : null,
        packageType: user.packageType,
        standing: user.standing || 'good',
        databaseUnlocked: acceptedInvitations > 0
      };

      res.json(metrics);
    } catch (error: any) {
      console.error('Get metrics error:', error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // ===== DECISION MAKER DASHBOARD ROUTES =====

  // Get decision maker's calls
  app.get("/api/decision-maker/calls", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const calls = await storage.getCallsByUserId(userId);
      res.json(calls);
    } catch (error: any) {
      console.error('Get decision maker calls error:', error);
      res.status(500).json({ message: "Failed to fetch calls" });
    }
  });

  // Get decision maker's metrics
  app.get("/api/decision-maker/metrics", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const calls = await storage.getCallsByUserId(userId);

      // Calculate metrics
      const completedCalls = calls.filter(call => call.status === 'completed');
      const upcomingCalls = calls.filter(call => call.status === 'scheduled');
      const totalCalls = calls.length;
      
      // Calculate average rating
      const ratedCalls = completedCalls.filter(call => call.rating);
      const avgRating = ratedCalls.length > 0 
        ? (ratedCalls.reduce((sum, call) => sum + call.rating, 0) / ratedCalls.length).toFixed(1)
        : null;

      // Package limits based on user's package type
      const packageLimits = {
        'basic': { callLimit: 3 },
        'premium': { callLimit: 10 },
        'enterprise': { callLimit: 50 }
      };

      const limits = packageLimits[user.packageType as keyof typeof packageLimits] || packageLimits['basic'];
      const remainingCalls = Math.max(0, limits.callLimit - completedCalls.length);
      const completionPercentage = limits.callLimit > 0 ? Math.round((completedCalls.length / limits.callLimit) * 100) : 0;

      // Calculate quality score based on ratings and completion rate
      const qualityScore = avgRating && totalCalls > 0 
        ? Math.round((parseFloat(avgRating) / 5) * 100)
        : null;

      const metrics = {
        completedCalls: completedCalls.length,
        remainingCalls,
        totalCallLimit: limits.callLimit,
        upcomingCalls: upcomingCalls.length,
        avgRating: avgRating ? parseFloat(avgRating) : null,
        qualityScore,
        completionPercentage,
        packageType: user.packageType,
        standing: user.standing || 'good'
      };

      res.json(metrics);
    } catch (error: any) {
      console.error('Get decision maker metrics error:', error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Rate a call
  app.post("/api/decision-maker/calls/:callId/rate", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const { callId } = req.params;
      const { rating, feedback } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      const updatedCall = await storage.updateCall(callId, {
        rating: parseInt(rating),
        feedback: feedback || '',
        status: 'completed'
      });

      if (!updatedCall) {
        return res.status(404).json({ message: "Call not found" });
      }

      res.json({ success: true, message: "Call rated successfully", call: updatedCall });
    } catch (error: any) {
      console.error('Rate call error:', error);
      res.status(500).json({ message: "Failed to rate call" });
    }
  });

  // ===== ADMIN PANEL ROUTES =====

  // Get admin statistics
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      
      if (!userId || userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Get all users
      const allUsers = await storage.getAllUsers();
      const allCalls = await storage.getAllCalls();
      const allInvitations = await storage.getAllInvitations();

      // Calculate statistics
      const totalUsers = allUsers.length;
      const activeSalesReps = allUsers.filter(user => user.role === 'sales_rep' && user.isActive).length;
      const totalCalls = allCalls.length;
      const completedCalls = allCalls.filter(call => call.status === 'completed').length;
      const scheduledCalls = allCalls.filter(call => call.status === 'scheduled').length;
      
      // Calculate average rating
      const completedCallsWithRating = allCalls.filter((call: any) => call.rating && call.rating > 0);
      const avgRating = completedCallsWithRating.length > 0 
        ? (completedCallsWithRating.reduce((sum: number, call: any) => sum + call.rating, 0) / completedCallsWithRating.length).toFixed(1)
        : '0';

      // Calculate revenue based on package types
      const totalRevenue = allUsers.reduce((sum: number, user: any) => {
        if (user.packageType === 'pro-team') return sum + 199;
        if (user.packageType === 'enterprise') return sum + 499;
        if (user.packageType === 'starter') return sum + 99;
        return sum;
      }, 0);

      const stats = {
        totalUsers,
        activeSalesReps,
        totalCalls,
        completedCalls,
        scheduledCalls,
        avgRating: parseFloat(avgRating),
        totalRevenue
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin statistics' });
    }
  });

  // Get all users for admin
  app.get('/api/admin/users', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      
      if (!userId || userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users for admin:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Get all calls for admin
  app.get('/api/admin/calls', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      
      if (!userId || userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const calls = await storage.getAllCalls();
      res.json(calls);
    } catch (error) {
      console.error('Error fetching calls for admin:', error);
      res.status(500).json({ message: 'Failed to fetch calls' });
    }
  });

  // Get all invitations for admin
  app.get('/api/admin/invitations', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      
      if (!userId || userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const invitations = await storage.getAllInvitations();
      res.json(invitations);
    } catch (error) {
      console.error('Error fetching invitations for admin:', error);
      res.status(500).json({ message: 'Failed to fetch invitations' });
    }
  });

  // Update user status
  app.patch('/api/admin/users/:userId/status', async (req, res) => {
    try {
      const adminUserId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      
      if (!adminUserId || userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { userId } = req.params;
      const { status } = req.body;

      const isActive = status === 'active';
      const updatedUser = await storage.updateUser(userId, { isActive });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Failed to update user status' });
    }
  });

  // Delete user
  app.delete('/api/admin/users/:userId', async (req, res) => {
    try {
      const adminUserId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;
      
      if (!adminUserId || userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { userId } = req.params;
      
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
