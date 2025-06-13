import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'sales_rep' or 'decision_maker'
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  linkedinUrl: text("linkedin_url"),
  linkedinVerified: boolean("linkedin_verified").default(false),
  jobTitle: text("job_title"),
  company: text("company"),
  industry: text("industry"),
  companySize: text("company_size"),
  yearsInRole: text("years_in_role"),
  packageType: text("package_type").default("free"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  standing: text("standing").default("good"), // 'good', 'excellent'
});

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  salesRepId: integer("sales_rep_id").notNull(),
  decisionMakerEmail: text("decision_maker_email").notNull(),
  decisionMakerName: text("decision_maker_name").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'declined'
  createdAt: timestamp("created_at").defaultNow(),
});

export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  salesRepId: integer("sales_rep_id").notNull(),
  decisionMakerId: integer("decision_maker_id").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'completed', 'cancelled'
  rating: integer("rating"), // 1-5 stars
  feedback: text("feedback"),
  company: text("company"),
  pitch: text("pitch"),
});

// Sales Rep signup validation schemas
export const salesRepPersonalInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").refine(
    (url) => url.includes("linkedin.com"),
    "URL must be a LinkedIn profile"
  ),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain uppercase, lowercase, number and special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const salesRepProfessionalSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  company: z.string().min(2, "Company name is required"),
  industry: z.string().min(1, "Please select an industry"),
  companySize: z.string().min(1, "Please select company size"),
  yearsInRole: z.string().optional(),
});

export const salesRepInvitesSchema = z.object({
  decisionMakers: z.array(z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
    email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  })).optional(),
});

export const salesRepPackageSchema = z.object({
  packageType: z.enum(["free", "basic", "premium", "pro-team"]),
});

// Decision Maker signup validation schemas
export const decisionMakerPersonalInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").refine(
    (url) => url.includes("linkedin.com"),
    "Must be a valid LinkedIn URL"
  ),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const decisionMakerProfessionalSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  company: z.string().min(2, "Company name is required"),
  industry: z.string().min(1, "Please select an industry"),
  companySize: z.string().min(1, "Please select company size"),
  yearsInRole: z.string().optional(),
});

export const decisionMakerAvailabilitySchema = z.object({
  availabilityType: z.enum(["flexible", "specific_times", "by_appointment"]),
  preferredDays: z.array(z.string()).optional(),
  preferredTimes: z.array(z.string()).optional(),
  timezone: z.string().min(1, "Please select your timezone"),
  callDuration: z.enum(["15", "30", "45"]).default("15"),
});

export const decisionMakerNominationSchema = z.object({
  nominatedSalesReps: z.array(z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
    email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
    company: z.string().optional().or(z.literal("")),
    referralReason: z.string().optional().or(z.literal("")),
  })).optional(),
});

export const decisionMakerPackageSchema = z.object({
  packageType: z.enum(["free", "basic", "premium"]),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  createdAt: true,
});

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitations.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;
