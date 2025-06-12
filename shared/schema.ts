import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // 'sales_rep' or 'decision_maker'
  name: text("name").notNull(),
  company: text("company"),
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
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
