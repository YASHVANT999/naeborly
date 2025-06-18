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

  // Onboarding API endpoints
  app.post('/api/sales-rep/onboarding', async (req, res) => {
    try {
      const {
        firstName, lastName, email, linkedinUrl, company, jobTitle, industry,
        companySize, yearsInRole, icpDescription, productType, salesRegion,
        targetIndustries, linkedinVerified, packageType
      } = req.body;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const userData = {
        email, password: 'tempPassword123!', firstName, lastName, linkedinUrl,
        linkedinVerified: linkedinVerified || false, company, jobTitle, industry,
        companySize, yearsInRole, icpDescription, productType, salesRegion,
        targetIndustries, role: 'sales_rep', packageType: packageType || 'free',
        isActive: true, standing: 'good', calendarIntegrationEnabled: false,
        invitationStatus: 'pending', domainVerified: false, requirePasswordChange: true,
        permissions: [], createdAt: new Date(), updatedAt: new Date()
      };

      const newUser = await storage.createUser(userData);
      (req.session as any).userId = newUser.id || newUser._id;

      res.status(201).json({
        success: true,
        message: 'Sales rep onboarding completed successfully',
        user: { id: newUser.id || newUser._id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName, role: newUser.role }
      });
    } catch (error) {
      console.error('Sales rep onboarding error:', error);
      res.status(500).json({ success: false, message: 'Failed to complete onboarding', error: (error as Error).message });
    }
  });

  app.post('/api/decision-maker/onboarding', async (req, res) => {
    try {
      const {
        firstName, lastName, email, phone, company, jobTitle, industry, companySize,
        yearsInRole, decisionAreas, preferredMeetingTimes, timezone, meetingDuration,
        meetingPreference, acceptTerms, acceptPrivacy
      } = req.body;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const userData = {
        email, password: 'tempPassword123!', firstName, lastName, phone: phone || '',
        company, jobTitle, industry, companySize, yearsInRole, decisionAreas,
        preferredMeetingTimes: preferredMeetingTimes || [], timezone, meetingDuration,
        meetingPreference, acceptTerms: acceptTerms || false, acceptPrivacy: acceptPrivacy || false,
        role: 'decision_maker', isActive: true, standing: 'good', calendarIntegrationEnabled: false,
        invitationStatus: 'accepted', engagementScore: 50, domainVerified: false,
        requirePasswordChange: true, permissions: [], createdAt: new Date(), updatedAt: new Date()
      };

      const newUser = await storage.createUser(userData);
      (req.session as any).userId = newUser.id || newUser._id;

      res.status(201).json({
        success: true,
        message: 'Decision maker onboarding completed successfully',
        user: { id: newUser.id || newUser._id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName, role: newUser.role }
      });
    } catch (error) {
      console.error('Decision maker onboarding error:', error);
      res.status(500).json({ success: false, message: 'Failed to complete onboarding', error: (error as Error).message });
    }
  });

  app.post('/api/sales-rep/invite-decision-makers', async (req, res) => {
    // Simple auth check
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    try {
      const { invites } = req.body;
      const salesRepId = (req.session as any).userId;

      if (!invites || !Array.isArray(invites) || invites.length < 3) {
        return res.status(400).json({ message: 'At least 3 invites are required' });
      }

      const results = [];
      let successCount = 0;

      for (const invite of invites) {
        try {
          const invitationData = {
            salesRepId, decisionMakerName: invite.name, decisionMakerEmail: invite.email,
            status: 'pending', createdAt: new Date(), updatedAt: new Date()
          };

          const newInvitation = await storage.createInvitation(invitationData);
          results.push({ ...invite, status: 'sent', invitationId: newInvitation.id || newInvitation._id });
          successCount++;

          await storage.createActivityLog({
            userId: salesRepId, action: 'SEND_INVITATION', entityType: 'invitation',
            entityId: newInvitation.id || newInvitation._id, details: `Invited ${invite.name} (${invite.email})`,
            ipAddress: req.ip, userAgent: req.get('User-Agent')
          });
        } catch (error) {
          results.push({ ...invite, status: 'failed', error: (error as Error).message });
        }
      }

      res.status(200).json({
        success: true, message: `Successfully sent ${successCount} invitations`,
        invitesSent: successCount, results
      });
    } catch (error) {
      console.error('Invite decision makers error:', error);
      res.status(500).json({ success: false, message: 'Failed to send invitations', error: (error as Error).message });
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

  // ===== CREDIT MANAGEMENT ROUTES =====

  // Get company credits summary
  app.get("/api/company-credits/summary", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;

      // Get or create company credits
      let credits = await storage.getCompanyCredits(companyDomain);
      
      if (!credits) {
        // Create initial credits record for the company
        const currentDate = new Date();
        const periodEnd = new Date(currentDate);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const creditsData = {
          companyDomain,
          planType: 'enterprise',
          monthlyCredits: 1000,
          usedCredits: 0,
          remainingCredits: 1000,
          currentPeriodStart: currentDate,
          currentPeriodEnd: periodEnd,
          perRepLimits: {
            maxCallsPerMonth: null,
            maxDMsPerMonth: null
          },
          repUsage: []
        };

        credits = await storage.createCompanyCredits(creditsData);
      }

      // Get all sales reps and populate their usage
      const salesReps = await storage.getUsersByCompanyDomain(companyDomain);
      const activeSalesReps = salesReps.filter(user => user.role === 'sales_rep' && user.isActive);

      // Get call logs and feedback for usage calculation
      const callLogs = await storage.getCallLogsByCompany(companyDomain);
      const feedbacks = await storage.getFeedbackByCompany(companyDomain);

      // Calculate per-rep usage
      const repUsageMap = new Map();
      
      // Initialize all active reps
      activeSalesReps.forEach(rep => {
        repUsageMap.set(rep.id, {
          repId: rep.id,
          repEmail: rep.email,
          repName: `${rep.firstName} ${rep.lastName}`,
          callsBooked: 0,
          dmsUnlocked: 0,
          creditsUsed: 0,
          feedbacksReceived: 0,
          flagsReceived: 0,
          averageRating: 0
        });
      });

      // Calculate usage from call logs
      callLogs.forEach(log => {
        const repId = log.salesRepId?._id || log.salesRepId;
        if (repUsageMap.has(repId)) {
          const usage = repUsageMap.get(repId);
          usage.callsBooked += 1;
          usage.creditsUsed += log.creditsUsed || 1;
          
          if (log.status === 'completed') {
            usage.dmsUnlocked += 1;
          }
        }
      });

      // Calculate feedback statistics
      const repFeedbackStats = new Map();
      feedbacks.forEach(feedback => {
        const repId = feedback.salesRepId?._id || feedback.salesRepId;
        if (!repFeedbackStats.has(repId)) {
          repFeedbackStats.set(repId, { total: 0, sum: 0, flags: 0 });
        }
        const stats = repFeedbackStats.get(repId);
        stats.total += 1;
        stats.sum += feedback.rating;
        if (feedback.flags && feedback.flags.length > 0) {
          stats.flags += feedback.flags.length;
        }
      });

      // Update rep usage with feedback stats
      repFeedbackStats.forEach((stats, repId) => {
        if (repUsageMap.has(repId)) {
          const usage = repUsageMap.get(repId);
          usage.feedbacksReceived = stats.total;
          usage.flagsReceived = stats.flags;
          usage.averageRating = stats.total > 0 ? (stats.sum / stats.total) : 0;
        }
      });

      const repUsageArray = Array.from(repUsageMap.values());

      // Calculate totals
      const totalCreditsUsed = repUsageArray.reduce((sum, rep) => sum + rep.creditsUsed, 0);
      const totalCallsBooked = repUsageArray.reduce((sum, rep) => sum + rep.callsBooked, 0);
      const totalDMsUnlocked = repUsageArray.reduce((sum, rep) => sum + rep.dmsUnlocked, 0);

      const summary = {
        planType: credits.planType,
        monthlyCredits: credits.monthlyCredits,
        usedCredits: totalCreditsUsed,
        remainingCredits: credits.monthlyCredits - totalCreditsUsed,
        utilizationRate: credits.monthlyCredits > 0 ? ((totalCreditsUsed / credits.monthlyCredits) * 100) : 0,
        currentPeriodStart: credits.currentPeriodStart,
        currentPeriodEnd: credits.currentPeriodEnd,
        perRepLimits: credits.perRepLimits,
        totalCallsBooked,
        totalDMsUnlocked,
        activeReps: activeSalesReps.length,
        repUsage: repUsageArray
      };

      res.json(summary);
    } catch (error) {
      console.error('Error getting company credits summary:', error);
      res.status(500).json({ message: "Failed to get credits summary" });
    }
  });

  // Update per-rep credit limits
  app.patch("/api/company-credits/rep-limit", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;
      const { maxCallsPerMonth, maxDMsPerMonth } = req.body;

      const updates = {
        'perRepLimits.maxCallsPerMonth': maxCallsPerMonth || null,
        'perRepLimits.maxDMsPerMonth': maxDMsPerMonth || null
      };

      const updatedCredits = await storage.updateCompanyCredits(companyDomain, updates);

      if (!updatedCredits) {
        return res.status(404).json({ message: "Company credits not found" });
      }

      // Log activity
      await storage.createActivityLog({
        action: 'UPDATE_CREDIT_LIMITS',
        performedBy: enterpriseUser.id,
        details: `Updated per-rep limits: ${maxCallsPerMonth} calls, ${maxDMsPerMonth} DMs`,
        companyDomain
      });

      res.json({ 
        success: true, 
        perRepLimits: updatedCredits.perRepLimits 
      });
    } catch (error) {
      console.error('Error updating rep credit limits:', error);
      res.status(500).json({ message: "Failed to update credit limits" });
    }
  });

  // Reset monthly credits (for testing or manual reset)
  app.post("/api/company-credits/reset", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;

      const currentDate = new Date();
      const periodEnd = new Date(currentDate);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const updates = {
        usedCredits: 0,
        remainingCredits: 1000,
        currentPeriodStart: currentDate,
        currentPeriodEnd: periodEnd,
        repUsage: []
      };

      const updatedCredits = await storage.updateCompanyCredits(companyDomain, updates);

      // Log activity
      await storage.createActivityLog({
        action: 'RESET_CREDITS',
        performedBy: enterpriseUser.id,
        details: 'Reset monthly credits and usage statistics',
        companyDomain
      });

      res.json({ success: true, credits: updatedCredits });
    } catch (error) {
      console.error('Error resetting credits:', error);
      res.status(500).json({ message: "Failed to reset credits" });
    }
  });

  // ===== DM TRACKING ROUTES =====

  // Get company DMs
  app.get("/api/company-dms", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;

      const companyDMs = await storage.getCompanyDMs(companyDomain);
      
      // Calculate engagement scores and additional metrics
      const enrichedDMs = await Promise.all(companyDMs.map(async (dm) => {
        const flags = await storage.getDMFlags(dm.dmId.id || dm.dmId);
        const callLogs = await storage.getCallLogsByCompany(companyDomain);
        const dmCallLogs = callLogs.filter(log => 
          (log.decisionMakerId?.id || log.decisionMakerId) === (dm.dmId.id || dm.dmId)
        );

        // Calculate engagement score based on interactions
        let engagementScore = 0;
        if (dmCallLogs.length > 0) {
          const completedCalls = dmCallLogs.filter(log => log.status === 'completed').length;
          const totalCalls = dmCallLogs.length;
          const completionRate = completedCalls / totalCalls;
          const avgRating = dmCallLogs
            .filter(log => log.feedback?.rating)
            .reduce((sum, log) => sum + log.feedback.rating, 0) / dmCallLogs.length || 0;
          
          engagementScore = Math.round((completionRate * 40) + (avgRating * 12) + (Math.min(completedCalls, 5) * 10));
        }

        return {
          id: dm.id,
          dmId: dm.dmId.id || dm.dmId,
          name: `${dm.dmId.firstName} ${dm.dmId.lastName}`,
          email: dm.dmId.email,
          title: dm.dmId.jobTitle || 'N/A',
          company: dm.dmId.company || companyDomain,
          linkedinUrl: dm.dmId.linkedinUrl,
          verificationStatus: dm.verificationStatus,
          flagCount: flags.filter(f => f.status === 'open').length,
          totalFlags: flags.length,
          engagementScore,
          totalInteractions: dmCallLogs.length,
          lastInteraction: dm.lastInteraction,
          linkedRep: {
            id: dm.linkedRepId.id || dm.linkedRepId,
            name: `${dm.linkedRepId.firstName} ${dm.linkedRepId.lastName}`,
            email: dm.linkedRepId.email
          },
          referralDate: dm.referralDate,
          removalRequested: dm.removalRequested,
          removalReason: dm.removalReason,
          status: dm.status,
          flags: flags.slice(0, 3) // Recent flags
        };
      }));

      res.json(enrichedDMs);
    } catch (error) {
      console.error('Error getting company DMs:', error);
      res.status(500).json({ message: "Failed to get company DMs" });
    }
  });

  // Request DM removal
  app.post("/api/company-dms/remove", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const { dmId, reason } = req.body;

      if (!dmId || !reason) {
        return res.status(400).json({ message: "DM ID and reason are required" });
      }

      const result = await storage.requestDMRemoval(dmId, reason, enterpriseUser.id);

      if (!result) {
        return res.status(404).json({ message: "DM not found" });
      }

      // Log activity
      await storage.createActivityLog({
        action: 'REQUEST_DM_REMOVAL',
        performedBy: enterpriseUser.id,
        targetUser: dmId,
        details: `Requested DM removal: ${reason}`,
        companyDomain: enterpriseUser.companyDomain
      });

      res.json({ success: true, dm: result });
    } catch (error) {
      console.error('Error requesting DM removal:', error);
      res.status(500).json({ message: "Failed to request DM removal" });
    }
  });

  // Replace suspended DM
  app.post("/api/company-dms/replace", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const { originalDMId, replacementDMId } = req.body;

      if (!originalDMId || !replacementDMId) {
        return res.status(400).json({ message: "Original and replacement DM IDs are required" });
      }

      // Verify replacement DM exists and is available
      const replacementDM = await storage.getUser(replacementDMId);
      if (!replacementDM || replacementDM.role !== 'decision_maker') {
        return res.status(400).json({ message: "Invalid replacement DM" });
      }

      const result = await storage.replaceDM(originalDMId, replacementDMId, enterpriseUser.id);

      if (!result) {
        return res.status(404).json({ message: "Original DM not found" });
      }

      // Log activity
      await storage.createActivityLog({
        action: 'REPLACE_DM',
        performedBy: enterpriseUser.id,
        targetUser: originalDMId,
        details: `Replaced DM with ${replacementDM.email}`,
        companyDomain: enterpriseUser.companyDomain
      });

      res.json({ success: true, result });
    } catch (error) {
      console.error('Error replacing DM:', error);
      res.status(500).json({ message: "Failed to replace DM" });
    }
  });

  // Flag a DM for quality issues
  app.post("/api/company-dms/flag", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const { dmId, flagType, description, severity } = req.body;

      if (!dmId || !flagType || !description) {
        return res.status(400).json({ message: "DM ID, flag type, and description are required" });
      }

      const flagData = {
        dmId,
        flaggedBy: enterpriseUser.id,
        companyDomain: enterpriseUser.companyDomain,
        flagType,
        description,
        severity: severity || 'medium',
        status: 'open'
      };

      const flag = await storage.createDMFlag(flagData);

      // Log activity
      await storage.createActivityLog({
        action: 'FLAG_DM',
        performedBy: enterpriseUser.id,
        targetUser: dmId,
        details: `Flagged DM for: ${flagType} - ${description}`,
        companyDomain: enterpriseUser.companyDomain
      });

      res.status(201).json({ success: true, flag });
    } catch (error) {
      console.error('Error flagging DM:', error);
      res.status(500).json({ message: "Failed to flag DM" });
    }
  });

  // Update DM verification status
  app.patch("/api/company-dms/:dmId/verification", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const { dmId } = req.params;
      const { verificationStatus } = req.body;

      const validStatuses = ['pending', 'verified', 'rejected', 'suspended'];
      if (!validStatuses.includes(verificationStatus)) {
        return res.status(400).json({ message: "Invalid verification status" });
      }

      const result = await storage.updateCompanyDM(dmId, { verificationStatus });

      if (!result) {
        return res.status(404).json({ message: "DM not found" });
      }

      // Log activity
      await storage.createActivityLog({
        action: 'UPDATE_DM_VERIFICATION',
        performedBy: enterpriseUser.id,
        targetUser: dmId,
        details: `Updated DM verification status to: ${verificationStatus}`,
        companyDomain: enterpriseUser.companyDomain
      });

      res.json({ success: true, dm: result });
    } catch (error) {
      console.error('Error updating DM verification:', error);
      res.status(500).json({ message: "Failed to update DM verification" });
    }
  });

  // Get DM flags
  app.get("/api/company-dms/:dmId/flags", requireEnterpriseAdmin, async (req, res) => {
    try {
      const { dmId } = req.params;
      const flags = await storage.getDMFlags(dmId);
      res.json(flags);
    } catch (error) {
      console.error('Error getting DM flags:', error);
      res.status(500).json({ message: "Failed to get DM flags" });
    }
  });

  // ===== CALL ACTIVITY LOG ROUTES =====

  // Get company call logs with filtering
  app.get("/api/company-calls", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;
      const { rep, dm, outcome, startDate, endDate, search } = req.query;

      let callLogs = await storage.getCallLogsByCompany(companyDomain);

      // Apply filters
      if (rep) {
        callLogs = callLogs.filter(log => 
          (log.salesRepId?.id || log.salesRepId?.toString()) === rep ||
          (log.salesRepId?.email && log.salesRepId.email.includes(rep as string))
        );
      }

      if (dm) {
        callLogs = callLogs.filter(log => 
          (log.decisionMakerId?.id || log.decisionMakerId?.toString()) === dm ||
          (log.decisionMakerId?.email && log.decisionMakerId.email.includes(dm as string))
        );
      }

      if (outcome) {
        callLogs = callLogs.filter(log => log.status === outcome);
      }

      if (startDate) {
        const start = new Date(startDate as string);
        callLogs = callLogs.filter(log => new Date(log.scheduledAt) >= start);
      }

      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999); // End of day
        callLogs = callLogs.filter(log => new Date(log.scheduledAt) <= end);
      }

      if (search) {
        const searchTerm = (search as string).toLowerCase();
        callLogs = callLogs.filter(log => 
          (log.salesRepId?.firstName && log.salesRepId.firstName.toLowerCase().includes(searchTerm)) ||
          (log.salesRepId?.lastName && log.salesRepId.lastName.toLowerCase().includes(searchTerm)) ||
          (log.salesRepId?.email && log.salesRepId.email.toLowerCase().includes(searchTerm)) ||
          (log.decisionMakerId?.firstName && log.decisionMakerId.firstName.toLowerCase().includes(searchTerm)) ||
          (log.decisionMakerId?.lastName && log.decisionMakerId.lastName.toLowerCase().includes(searchTerm)) ||
          (log.decisionMakerId?.email && log.decisionMakerId.email.toLowerCase().includes(searchTerm)) ||
          (log.feedback?.summary && log.feedback.summary.toLowerCase().includes(searchTerm)) ||
          (log.notes && log.notes.toLowerCase().includes(searchTerm))
        );
      }

      // Enrich call logs with additional data
      const enrichedCallLogs = callLogs.map(log => {
        const repName = log.salesRepId ? 
          `${log.salesRepId.firstName} ${log.salesRepId.lastName}` : 
          'Unknown Rep';
        const dmName = log.decisionMakerId ? 
          `${log.decisionMakerId.firstName} ${log.decisionMakerId.lastName}` : 
          'Unknown DM';

        return {
          id: log.id,
          repToDM: `${repName} ↔ ${dmName}`,
          repDetails: {
            id: log.salesRepId?.id || log.salesRepId,
            name: repName,
            email: log.salesRepId?.email || 'N/A',
            company: log.salesRepId?.company || companyDomain
          },
          dmDetails: {
            id: log.decisionMakerId?.id || log.decisionMakerId,
            name: dmName,
            email: log.decisionMakerId?.email || 'N/A',
            title: log.decisionMakerId?.jobTitle || 'N/A',
            company: log.decisionMakerId?.company || 'N/A'
          },
          scheduledAt: log.scheduledAt,
          completedAt: log.completedAt,
          duration: log.duration,
          status: log.status,
          outcome: log.outcome || log.status,
          feedback: {
            rating: log.feedback?.rating,
            summary: log.feedback?.summary || log.feedback?.notes || 'No feedback provided',
            nextSteps: log.feedback?.nextSteps,
            followUpRequired: log.feedback?.followUpRequired
          },
          notes: log.notes,
          flagged: log.flagged || false,
          flagReason: log.flagReason,
          meetingUrl: log.meetingUrl,
          recordingUrl: log.recordingUrl
        };
      });

      // Sort by scheduled date (most recent first)
      enrichedCallLogs.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

      res.json(enrichedCallLogs);
    } catch (error) {
      console.error('Error getting company call logs:', error);
      res.status(500).json({ message: "Failed to get company call logs" });
    }
  });

  // Get call analytics for dashboard
  app.get("/api/company-calls/analytics", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;

      const callLogs = await storage.getCallLogsByCompany(companyDomain);

      const analytics = {
        totalCalls: callLogs.length,
        completedCalls: callLogs.filter(log => log.status === 'completed').length,
        missedCalls: callLogs.filter(log => log.status === 'missed' || log.status === 'cancelled').length,
        flaggedCalls: callLogs.filter(log => log.flagged).length,
        averageRating: 0,
        callsByOutcome: {
          completed: callLogs.filter(log => log.status === 'completed').length,
          missed: callLogs.filter(log => log.status === 'missed').length,
          cancelled: callLogs.filter(log => log.status === 'cancelled').length,
          scheduled: callLogs.filter(log => log.status === 'scheduled').length
        },
        recentActivity: callLogs
          .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
          .slice(0, 5)
          .map(log => ({
            rep: log.salesRepId ? `${log.salesRepId.firstName} ${log.salesRepId.lastName}` : 'Unknown',
            dm: log.decisionMakerId ? `${log.decisionMakerId.firstName} ${log.decisionMakerId.lastName}` : 'Unknown',
            status: log.status,
            scheduledAt: log.scheduledAt
          }))
      };

      // Calculate average rating
      const ratedCalls = callLogs.filter(log => log.feedback?.rating);
      if (ratedCalls.length > 0) {
        analytics.averageRating = ratedCalls.reduce((sum, log) => sum + log.feedback.rating, 0) / ratedCalls.length;
      }

      res.json(analytics);
    } catch (error) {
      console.error('Error getting call analytics:', error);
      res.status(500).json({ message: "Failed to get call analytics" });
    }
  });

  // Flag a call for review
  app.post("/api/company-calls/:callId/flag", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const { callId } = req.params;
      const { reason, severity } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Flag reason is required" });
      }

      const result = await storage.updateCallLog(callId, {
        flagged: true,
        flagReason: reason,
        flagSeverity: severity || 'medium',
        flaggedBy: enterpriseUser.id,
        flaggedAt: new Date()
      });

      if (!result) {
        return res.status(404).json({ message: "Call not found" });
      }

      // Log activity
      await storage.createActivityLog({
        action: 'FLAG_CALL',
        performedBy: enterpriseUser.id,
        targetUser: result.salesRepId?.id || result.salesRepId,
        details: `Flagged call for review: ${reason}`,
        companyDomain: enterpriseUser.companyDomain
      });

      res.json({ success: true, call: result });
    } catch (error) {
      console.error('Error flagging call:', error);
      res.status(500).json({ message: "Failed to flag call" });
    }
  });

  // ===== PERFORMANCE ANALYTICS ROUTES =====

  // Get comprehensive company analytics
  app.get("/api/company-analytics", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;

      // Get all data sources
      const [callLogs, feedback, companyUsers, companyDMs] = await Promise.all([
        storage.getCallLogsByCompany(companyDomain),
        storage.getFeedbackByCompany(companyDomain),
        storage.getUsersByCompanyDomain(companyDomain),
        storage.getCompanyDMs(companyDomain)
      ]);

      const salesReps = companyUsers.filter(user => user.role === 'sales_rep');

      // Calculate average rep feedback score
      const repFeedbackScores = {};
      feedback.forEach(fb => {
        const repId = fb.salesRepId?.id || fb.salesRepId;
        if (!repFeedbackScores[repId]) {
          repFeedbackScores[repId] = { total: 0, count: 0 };
        }
        if (fb.rating) {
          repFeedbackScores[repId].total += fb.rating;
          repFeedbackScores[repId].count += 1;
        }
      });

      const avgRepFeedbackScore = Object.values(repFeedbackScores).length > 0 ?
        Object.values(repFeedbackScores).reduce((sum, rep) => 
          sum + (rep.count > 0 ? rep.total / rep.count : 0), 0
        ) / Object.values(repFeedbackScores).length : 0;

      // Calculate average DM engagement score
      const avgDMEngagementScore = companyDMs.length > 0 ?
        companyDMs.reduce((sum, dm) => sum + (dm.engagementScore || 0), 0) / companyDMs.length : 0;

      // Calculate no-show rate
      const totalScheduledCalls = callLogs.filter(log => 
        ['scheduled', 'completed', 'missed', 'cancelled'].includes(log.status)
      ).length;
      const noShowCalls = callLogs.filter(log => 
        log.status === 'missed' || log.outcome === 'no_show'
      ).length;
      const noShowRate = totalScheduledCalls > 0 ? (noShowCalls / totalScheduledCalls) * 100 : 0;

      // Calculate top performers
      const repPerformance = salesReps.map(rep => {
        const repId = rep.id;
        const repCalls = callLogs.filter(log => 
          (log.salesRepId?.id || log.salesRepId) === repId
        );
        const repFeedback = feedback.filter(fb => 
          (fb.salesRepId?.id || fb.salesRepId) === repId
        );
        const repDMs = companyDMs.filter(dm => 
          (dm.linkedRepId?.id || dm.linkedRepId) === repId
        );

        const completedCalls = repCalls.filter(call => call.status === 'completed').length;
        const avgFeedback = repFeedback.length > 0 ?
          repFeedback.filter(fb => fb.rating).reduce((sum, fb) => sum + fb.rating, 0) / 
          repFeedback.filter(fb => fb.rating).length : 0;

        return {
          id: repId,
          name: `${rep.firstName} ${rep.lastName}`,
          email: rep.email,
          totalCalls: repCalls.length,
          completedCalls,
          avgFeedback: avgFeedback || 0,
          dmInvites: repDMs.length,
          successRate: repCalls.length > 0 ? (completedCalls / repCalls.length) * 100 : 0
        };
      });

      // Sort top performers by different metrics
      const topPerformersByCalls = [...repPerformance]
        .sort((a, b) => b.completedCalls - a.completedCalls)
        .slice(0, 5);

      const topPerformersByFeedback = [...repPerformance]
        .sort((a, b) => b.avgFeedback - a.avgFeedback)
        .slice(0, 5);

      const topPerformersByDMInvites = [...repPerformance]
        .sort((a, b) => b.dmInvites - a.dmInvites)
        .slice(0, 5);

      // Monthly performance trends (last 6 months)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);

        const monthCalls = callLogs.filter(log => {
          const callDate = new Date(log.scheduledAt);
          return callDate >= monthStart && callDate <= monthEnd;
        });

        const monthFeedback = feedback.filter(fb => {
          const fbDate = new Date(fb.createdAt);
          return fbDate >= monthStart && fbDate <= monthEnd;
        });

        const avgRating = monthFeedback.length > 0 ?
          monthFeedback.filter(fb => fb.rating).reduce((sum, fb) => sum + fb.rating, 0) / 
          monthFeedback.filter(fb => fb.rating).length : 0;

        monthlyData.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          totalCalls: monthCalls.length,
          completedCalls: monthCalls.filter(call => call.status === 'completed').length,
          avgFeedback: avgRating || 0,
          successRate: monthCalls.length > 0 ? 
            (monthCalls.filter(call => call.status === 'completed').length / monthCalls.length) * 100 : 0
        });
      }

      // Call outcome distribution
      const outcomeDistribution = {
        completed: callLogs.filter(log => log.status === 'completed').length,
        missed: callLogs.filter(log => log.status === 'missed').length,
        cancelled: callLogs.filter(log => log.status === 'cancelled').length,
        scheduled: callLogs.filter(log => log.status === 'scheduled').length
      };

      // DM verification status distribution
      const dmVerificationDistribution = {
        verified: companyDMs.filter(dm => dm.verificationStatus === 'verified').length,
        pending: companyDMs.filter(dm => dm.verificationStatus === 'pending').length,
        rejected: companyDMs.filter(dm => dm.verificationStatus === 'rejected').length,
        suspended: companyDMs.filter(dm => dm.verificationStatus === 'suspended').length
      };

      const analytics = {
        overview: {
          avgRepFeedbackScore: Number(avgRepFeedbackScore.toFixed(2)),
          avgDMEngagementScore: Number(avgDMEngagementScore.toFixed(1)),
          noShowRate: Number(noShowRate.toFixed(1)),
          totalCalls: callLogs.length,
          totalDMs: companyDMs.length,
          totalReps: salesReps.length,
          completionRate: totalScheduledCalls > 0 ? 
            Number(((callLogs.filter(log => log.status === 'completed').length / totalScheduledCalls) * 100).toFixed(1)) : 0
        },
        topPerformers: {
          byCalls: topPerformersByCalls,
          byFeedback: topPerformersByFeedback,
          byDMInvites: topPerformersByDMInvites
        },
        trends: {
          monthly: monthlyData
        },
        distributions: {
          callOutcomes: outcomeDistribution,
          dmVerification: dmVerificationDistribution
        },
        repPerformance: repPerformance
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error getting company analytics:', error);
      res.status(500).json({ message: "Failed to get company analytics" });
    }
  });

  // Export analytics data as CSV
  app.get("/api/company-analytics/export", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;
      const { type = 'overview' } = req.query;

      // Get all data sources
      const [callLogs, feedback, companyUsers, companyDMs] = await Promise.all([
        storage.getCallLogsByCompany(companyDomain),
        storage.getFeedbackByCompany(companyDomain),
        storage.getUsersByCompanyDomain(companyDomain),
        storage.getCompanyDMs(companyDomain)
      ]);

      let csvData = '';
      const timestamp = new Date().toISOString().split('T')[0];

      if (type === 'rep_performance') {
        // Export rep performance data
        const salesReps = companyUsers.filter(user => user.role === 'sales_rep');
        
        csvData = 'Rep Name,Email,Total Calls,Completed Calls,Success Rate (%),Avg Feedback,DM Invites,Last Activity\n';
        
        salesReps.forEach(rep => {
          const repId = rep.id;
          const repCalls = callLogs.filter(log => 
            (log.salesRepId?.id || log.salesRepId) === repId
          );
          const repFeedback = feedback.filter(fb => 
            (fb.salesRepId?.id || fb.salesRepId) === repId
          );
          const repDMs = companyDMs.filter(dm => 
            (dm.linkedRepId?.id || dm.linkedRepId) === repId
          );

          const completedCalls = repCalls.filter(call => call.status === 'completed').length;
          const successRate = repCalls.length > 0 ? (completedCalls / repCalls.length) * 100 : 0;
          const avgFeedback = repFeedback.length > 0 ?
            repFeedback.filter(fb => fb.rating).reduce((sum, fb) => sum + fb.rating, 0) / 
            repFeedback.filter(fb => fb.rating).length : 0;
          
          const lastActivity = repCalls.length > 0 ? 
            new Date(Math.max(...repCalls.map(call => new Date(call.scheduledAt)))).toLocaleDateString() : 
            'N/A';

          csvData += `"${rep.firstName} ${rep.lastName}","${rep.email}",${repCalls.length},${completedCalls},${successRate.toFixed(1)},${avgFeedback.toFixed(1)},${repDMs.length},"${lastActivity}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="rep_performance_${timestamp}.csv"`);
      } 
      else if (type === 'call_logs') {
        // Export call logs data
        csvData = 'Date,Time,Sales Rep,Decision Maker,Duration (min),Status,Outcome,Rating,Feedback Summary\n';
        
        callLogs.forEach(log => {
          const scheduledDate = new Date(log.scheduledAt);
          const repName = log.salesRepId ? `${log.salesRepId.firstName} ${log.salesRepId.lastName}` : 'Unknown';
          const dmName = log.decisionMakerId ? `${log.decisionMakerId.firstName} ${log.decisionMakerId.lastName}` : 'Unknown';
          const rating = log.feedback?.rating || '';
          const summary = (log.feedback?.summary || '').replace(/"/g, '""'); // Escape quotes in CSV

          csvData += `"${scheduledDate.toLocaleDateString()}","${scheduledDate.toLocaleTimeString()}","${repName}","${dmName}",${log.duration || 0},"${log.status}","${log.outcome || ''}","${rating}","${summary}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="call_logs_${timestamp}.csv"`);
      }
      else {
        // Export overview analytics
        csvData = 'Metric,Value\n';
        csvData += `Total Calls,${callLogs.length}\n`;
        csvData += `Completed Calls,${callLogs.filter(log => log.status === 'completed').length}\n`;
        csvData += `Missed Calls,${callLogs.filter(log => log.status === 'missed').length}\n`;
        csvData += `Total Decision Makers,${companyDMs.length}\n`;
        csvData += `Verified DMs,${companyDMs.filter(dm => dm.verificationStatus === 'verified').length}\n`;
        csvData += `Total Sales Reps,${companyUsers.filter(user => user.role === 'sales_rep').length}\n`;
        
        const totalScheduled = callLogs.filter(log => 
          ['scheduled', 'completed', 'missed', 'cancelled'].includes(log.status)
        ).length;
        const noShows = callLogs.filter(log => log.status === 'missed').length;
        const noShowRate = totalScheduled > 0 ? (noShows / totalScheduled) * 100 : 0;
        
        csvData += `No-Show Rate (%),${noShowRate.toFixed(1)}\n`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics_overview_${timestamp}.csv"`);
      }

      res.send(csvData);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      res.status(500).json({ message: "Failed to export analytics" });
    }
  });

  // ===== ACCOUNT SETTINGS ROUTES =====

  // Get company settings and plan information
  app.get("/api/company-settings", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const companyDomain = enterpriseUser.companyDomain;

      // Get company users to find admin contact
      const companyUsers = await storage.getUsersByCompanyDomain(companyDomain);
      const adminUser = companyUsers.find(user => user.role === 'enterprise_admin') || enterpriseUser;

      // Get company analytics for usage metrics
      const [callLogs, companyDMs] = await Promise.all([
        storage.getCallLogsByCompany(companyDomain),
        storage.getCompanyDMs(companyDomain)
      ]);

      // Calculate usage metrics
      const currentDate = new Date();
      const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const currentMonthCalls = callLogs.filter(log => 
        new Date(log.scheduledAt) >= currentMonthStart
      ).length;

      // Company information
      const companySettings = {
        company: {
          name: companyDomain.split('.')[0].replace(/^\w/, c => c.toUpperCase()) + " Corp",
          domain: companyDomain,
          verifiedDomain: companyDomain,
          adminContact: {
            name: `${adminUser.firstName} ${adminUser.lastName}`,
            email: adminUser.email,
            role: adminUser.role,
            joinedDate: adminUser.createdAt || currentDate
          },
          totalUsers: companyUsers.length,
          salesReps: companyUsers.filter(user => user.role === 'sales_rep').length,
          decisionMakers: companyDMs.length
        },
        plan: {
          type: "Enterprise Pro",
          status: "active",
          billingCycle: "monthly",
          currentPeriodStart: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
          currentPeriodEnd: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
          renewalDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
          features: [
            "Unlimited sales reps",
            "Advanced analytics dashboard",
            "DM tracking and verification",
            "Call activity monitoring",
            "Performance analytics",
            "CSV data export",
            "Priority customer support",
            "Team management tools",
            "Credit usage monitoring"
          ],
          limits: {
            monthlyCallCredits: 1000,
            dmReferrals: 100,
            analyticsRetention: "12 months",
            supportLevel: "Priority"
          },
          pricing: {
            basePrice: 199,
            currency: "USD",
            perUser: false
          }
        },
        usage: {
          currentMonth: {
            calls: currentMonthCalls,
            dmsReferred: companyDMs.filter(dm => 
              new Date(dm.referralDate) >= currentMonthStart
            ).length,
            creditUsage: currentMonthCalls,
            remainingCredits: Math.max(0, 1000 - currentMonthCalls)
          },
          billingHistory: [
            {
              date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
              amount: 199,
              status: "paid",
              description: "Enterprise Pro - Monthly"
            },
            {
              date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
              amount: 199,
              status: "paid", 
              description: "Enterprise Pro - Monthly"
            },
            {
              date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1),
              amount: 199,
              status: "paid",
              description: "Enterprise Pro - Monthly"
            }
          ]
        },
        support: {
          contactEmail: "support@naeberly.com",
          helpCenterUrl: "https://help.naeberly.com",
          statusPageUrl: "https://status.naeberly.com",
          prioritySupport: true,
          accountManager: {
            name: "Sarah Johnson",
            email: "sarah.johnson@naeberly.com",
            phone: "+1 (555) 123-4567"
          }
        }
      };

      res.json(companySettings);
    } catch (error) {
      console.error('Error getting company settings:', error);
      res.status(500).json({ message: "Failed to get company settings" });
    }
  });

  // Get Stripe billing portal link
  app.get("/api/billing-portal-link", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      
      // In a real implementation, you would:
      // 1. Get the customer's Stripe customer ID from your database
      // 2. Create a billing portal session using Stripe API
      // 3. Return the portal URL
      
      // For demo purposes, we'll return a mock portal link
      const portalLink = {
        url: "https://billing.stripe.com/p/login/test_demo_portal",
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        customerId: "cus_demo_customer_id"
      };

      // Log activity
      await storage.createActivityLog({
        action: 'ACCESS_BILLING_PORTAL',
        performedBy: enterpriseUser.id,
        details: 'Accessed Stripe billing portal',
        companyDomain: enterpriseUser.companyDomain
      });

      res.json(portalLink);
    } catch (error) {
      console.error('Error creating billing portal link:', error);
      res.status(500).json({ message: "Failed to create billing portal link" });
    }
  });

  // Update company settings
  app.patch("/api/company-settings", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const { companyName, adminContact } = req.body;

      // In a real implementation, you would update the company record
      // For now, we'll just log the activity and return success
      
      await storage.createActivityLog({
        action: 'UPDATE_COMPANY_SETTINGS',
        performedBy: enterpriseUser.id,
        details: `Updated company settings: ${companyName ? 'company name, ' : ''}${adminContact ? 'admin contact' : ''}`,
        companyDomain: enterpriseUser.companyDomain
      });

      res.json({ 
        success: true, 
        message: "Company settings updated successfully" 
      });
    } catch (error) {
      console.error('Error updating company settings:', error);
      res.status(500).json({ message: "Failed to update company settings" });
    }
  });

  // Contact support
  app.post("/api/contact-support", requireEnterpriseAdmin, async (req, res) => {
    try {
      const enterpriseUser = (req as any).enterpriseUser;
      const { subject, message, priority, category } = req.body;

      if (!subject || !message) {
        return res.status(400).json({ message: "Subject and message are required" });
      }

      // In a real implementation, you would:
      // 1. Create a support ticket in your helpdesk system
      // 2. Send email notification to support team
      // 3. Send confirmation email to user

      const supportTicket = {
        id: `TICKET-${Date.now()}`,
        subject,
        message,
        priority: priority || 'medium',
        category: category || 'general',
        status: 'open',
        submittedBy: {
          name: `${enterpriseUser.firstName} ${enterpriseUser.lastName}`,
          email: enterpriseUser.email,
          company: enterpriseUser.companyDomain
        },
        submittedAt: new Date(),
        estimatedResponse: priority === 'high' ? '2 hours' : priority === 'medium' ? '8 hours' : '24 hours'
      };

      // Log activity
      await storage.createActivityLog({
        action: 'CONTACT_SUPPORT',
        performedBy: enterpriseUser.id,
        details: `Submitted support ticket: ${subject}`,
        companyDomain: enterpriseUser.companyDomain
      });

      res.status(201).json({ 
        success: true, 
        ticket: supportTicket,
        message: "Support ticket submitted successfully" 
      });
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      res.status(500).json({ message: "Failed to submit support ticket" });
    }
  });

  // ===== CALENDAR & BOOKING ROUTES =====

  // Get DM availability for calendar view
  app.get("/api/calendar/dm-availability/:dmId", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const { dmId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Get DM availability slots
      const dm = await storage.getUserById(dmId);
      if (!dm || dm.role !== 'decision_maker') {
        return res.status(404).json({ message: "Decision maker not found" });
      }

      // Generate availability slots for the date range
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const availabilitySlots = [];
      const bookedSlots = await storage.getCallsByDateRange(dmId, start, end);

      // Generate time slots for each day (9 AM to 5 PM, 30-minute intervals)
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        // Skip weekends for business meetings
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        for (let hour = 9; hour < 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const slotStart = new Date(date);
            slotStart.setHours(hour, minute, 0, 0);
            
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotEnd.getMinutes() + 30);

            // Check if slot is already booked
            const isBooked = bookedSlots.some(booking => {
              const bookingStart = new Date(booking.scheduledAt);
              return Math.abs(bookingStart.getTime() - slotStart.getTime()) < 30 * 60 * 1000;
            });

            availabilitySlots.push({
              id: `${dmId}-${slotStart.getTime()}`,
              dmId,
              dmName: `${dm.firstName} ${dm.lastName}`,
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              available: !isBooked,
              booked: isBooked,
              bookingId: isBooked ? bookedSlots.find(b => 
                Math.abs(new Date(b.scheduledAt).getTime() - slotStart.getTime()) < 30 * 60 * 1000
              )?.id : null
            });
          }
        }
      }

      res.json({
        dmId,
        dmName: `${dm.firstName} ${dm.lastName}`,
        dmTitle: dm.jobTitle,
        dmCompany: dm.company,
        availabilitySlots
      });
    } catch (error) {
      console.error('Error getting DM availability:', error);
      res.status(500).json({ message: "Failed to get DM availability" });
    }
  });

  // Get all available DMs for calendar selection
  app.get("/api/calendar/available-dms", async (req, res) => {
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const currentUser = await storage.getUserById((req.session as any).userId);
      console.log('Current user role:', currentUser.role);
      
      let availableDMs;
      if (currentUser.role === 'sales_rep') {
        // Sales reps can see all active decision makers for calendar booking
        const allDMs = await storage.getUsersByRole('decision_maker');
        console.log('All DMs found:', allDMs.length);
        console.log('Sample DM:', allDMs[0] ? { id: allDMs[0].id, role: allDMs[0].role, isActive: allDMs[0].isActive, invitationStatus: allDMs[0].invitationStatus } : 'None');
        
        availableDMs = allDMs.filter(dm => dm.isActive);
        console.log('Filtered available DMs:', availableDMs.length);
      } else {
        // Enterprise admins can see all DMs in their company
        availableDMs = await storage.getUsersByRole('decision_maker');
        if (currentUser.companyDomain) {
          availableDMs = availableDMs.filter(dm => dm.companyDomain === currentUser.companyDomain);
        }
      }

      const dmsWithDetails = availableDMs.filter(dm => dm).map(dm => ({
        id: dm.id || dm._id,
        name: `${dm.firstName} ${dm.lastName}`,
        email: dm.email,
        title: dm.jobTitle,
        company: dm.company,
        industry: dm.industry,
        department: dm.department,
        profileImage: dm.profileImageUrl || null
      }));

      console.log('Final DMs with details:', dmsWithDetails.length);
      res.json(dmsWithDetails);
    } catch (error) {
      console.error('Error getting available DMs:', error);
      res.status(500).json({ message: "Failed to get available DMs" });
    }
  });

  // Book a meeting slot
  app.post("/api/calendar/book-slot", async (req, res) => {
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const currentUser = await storage.getUserById((req.session as any).userId);
      const { dmId, startTime, endTime, agenda, notes } = req.body;

      // Validate DM exists and is available
      const dm = await storage.getUserById(dmId);
      if (!dm || dm.role !== 'decision_maker') {
        return res.status(404).json({ message: "Decision maker not found" });
      }

      // Check if slot is still available
      const existingBooking = await storage.getCallByTime(dmId, new Date(startTime));
      if (existingBooking) {
        return res.status(409).json({ message: "This time slot is no longer available" });
      }

      // Create the meeting booking
      const booking = await storage.createCall({
        salesRepId: currentUser.id,
        decisionMakerId: dmId,
        scheduledAt: new Date(startTime),
        endTime: new Date(endTime),
        status: 'scheduled',
        agenda: agenda || 'Business discussion',
        notes: notes || '',
        company: dm.company,
        platform: 'calendar_booking'
      });

      // Log the booking activity
      await storage.createActivityLog({
        userId: currentUser.id,
        action: 'BOOK_MEETING',
        entityType: 'call',
        entityId: booking.id,
        details: `Booked meeting with ${dm.firstName} ${dm.lastName} for ${startTime}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        booking: {
          id: booking.id,
          dmName: `${dm.firstName} ${dm.lastName}`,
          startTime,
          endTime,
          status: 'scheduled',
          agenda,
          confirmationCode: `MTG-${booking.id.slice(-6).toUpperCase()}`
        },
        message: "Meeting booked successfully"
      });
    } catch (error) {
      console.error('Error booking meeting slot:', error);
      res.status(500).json({ message: "Failed to book meeting slot" });
    }
  });

  // Cancel a booked meeting
  app.delete("/api/calendar/cancel-booking/:bookingId", async (req, res) => {
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;
      const currentUser = await storage.getUserById((req.session as any).userId);

      const booking = await storage.getCallById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify user can cancel this booking
      if (booking.salesRepId !== currentUser.id && currentUser.role !== 'enterprise_admin') {
        return res.status(403).json({ message: "You don't have permission to cancel this booking" });
      }

      // Update booking status
      await storage.updateCall(bookingId, {
        status: 'cancelled',
        cancellationReason: reason || 'Cancelled by user',
        cancelledAt: new Date(),
        cancelledBy: currentUser.id
      });

      // Log the cancellation
      await storage.createActivityLog({
        userId: currentUser.id,
        action: 'CANCEL_MEETING',
        entityType: 'call',
        entityId: bookingId,
        details: `Cancelled meeting: ${reason || 'No reason provided'}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: "Meeting cancelled successfully"
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Get user's flag count
  app.get("/api/user/flags-count", async (req, res) => {
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const currentUser = await storage.getUserById((req.session as any).userId);
      
      let flagCount = 0;
      if (currentUser.role === 'decision_maker') {
        // Get flags raised against this DM
        const flags = await storage.getDMFlags(currentUser.id);
        flagCount = flags.filter(flag => flag.status === 'open' || flag.status === 'pending').length;
      } else if (currentUser.role === 'sales_rep') {
        // Get flags raised against this sales rep (could be from performance issues, complaints, etc.)
        const flags = await storage.getFlagsByCompany(currentUser.companyDomain || currentUser.company);
        flagCount = flags.filter(flag => 
          flag.flaggedUserId === currentUser.id && 
          (flag.status === 'open' || flag.status === 'pending')
        ).length;
      }
      
      res.json({ flags: flagCount });
    } catch (error) {
      console.error('Error getting user flag count:', error);
      res.status(500).json({ message: "Failed to get flag count" });
    }
  });

  // Get user's upcoming meetings
  app.get("/api/calendar/my-meetings", async (req, res) => {
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const currentUser = await storage.getUserById((req.session as any).userId);
      const { startDate, endDate } = req.query;

      let meetings;
      if (currentUser.role === 'sales_rep') {
        meetings = await storage.getCallsByUserId(currentUser.id);
      } else if (currentUser.role === 'decision_maker') {
        meetings = await storage.getCallsByDMId(currentUser.id);
      } else {
        // Enterprise admin can see all company meetings
        meetings = await storage.getCallLogsByCompany(currentUser.companyDomain);
      }

      // Filter by date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        meetings = meetings.filter(meeting => {
          const meetingDate = new Date(meeting.scheduledAt);
          return meetingDate >= start && meetingDate <= end;
        });
      }

      // Enhance meetings with participant details
      const enhancedMeetings = await Promise.all(
        meetings.map(async (meeting) => {
          const [salesRep, dm] = await Promise.all([
            storage.getUserById(meeting.salesRepId),
            storage.getUserById(meeting.decisionMakerId)
          ]);

          return {
            id: meeting.id,
            title: meeting.agenda || 'Business Meeting',
            startTime: meeting.scheduledAt,
            endTime: meeting.endTime,
            status: meeting.status,
            salesRep: salesRep ? {
              id: salesRep.id,
              name: `${salesRep.firstName} ${salesRep.lastName}`,
              email: salesRep.email
            } : null,
            decisionMaker: dm ? {
              id: dm.id,
              name: `${dm.firstName} ${dm.lastName}`,
              email: dm.email,
              title: dm.jobTitle
            } : null,
            notes: meeting.notes,
            platform: meeting.platform || 'in-person',
            confirmationCode: `MTG-${meeting.id.slice(-6).toUpperCase()}`
          };
        })
      );

      res.json(enhancedMeetings);
    } catch (error) {
      console.error('Error getting user meetings:', error);
      res.status(500).json({ message: "Failed to get meetings" });
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

  // =============================================================================
  // FLAGS MANAGEMENT ENDPOINTS
  // =============================================================================

  // Get flags based on user role
  app.get("/api/flags", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let flags = [];

      if (user.role === 'sales_rep') {
        // Sales reps can see flags they created
        flags = await storage.getFlagsByRep(userId);
      } else if (user.role === 'decision_maker') {
        // Decision makers can see flags against them
        flags = await storage.getDMFlags(userId);
      } else if (user.role === 'enterprise_admin') {
        // Enterprise admins can see flags for their company
        const userDomain = user.email.split('@')[1];
        flags = await storage.getFlagsByCompany(userDomain);
      } else if (user.role === 'super_admin') {
        // Super admins can see all flags
        flags = await storage.getAllFlags();
      }

      res.json(flags);
    } catch (error: any) {
      console.error("Error fetching flags:", error);
      res.status(500).json({ message: "Failed to fetch flags" });
    }
  });

  // Create a new flag
  app.post("/api/flags", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only sales reps can create flags
      if (user.role !== 'sales_rep') {
        return res.status(403).json({ message: "Only sales representatives can create flags" });
      }

      const { dmId, reason, description, priority, flagType } = req.body;

      if (!dmId || !reason || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const flagData = {
        dmId,
        flaggedBy: userId,
        flaggedByRole: user.role,
        reason,
        description,
        priority: priority || 'medium',
        flagType: flagType || 'behavior',
        status: 'open',
        reportedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const flag = await storage.createDMFlag(flagData);
      res.json({ success: true, flag });
    } catch (error: any) {
      console.error("Error creating flag:", error);
      res.status(500).json({ message: "Failed to create flag" });
    }
  });

  // Update flag status
  app.put("/api/flags/:flagId", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only admins can update flag status
      if (!['enterprise_admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { flagId } = req.params;
      const { status, resolution } = req.body;

      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = user.email;
        if (resolution) {
          updateData.resolution = resolution;
        }
      }

      const updatedFlag = await storage.updateFlagStatus(flagId, status, resolution, user.email);
      res.json({ success: true, flag: updatedFlag });
    } catch (error: any) {
      console.error("Error updating flag:", error);
      res.status(500).json({ message: "Failed to update flag" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
