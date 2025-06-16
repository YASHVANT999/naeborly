import mongoose from "mongoose";

export async function connectToMongoDB() {
  try {
    const mongoUrl =
      process.env.MONGODB_URI ||
      "mongodb+srv://yash6491:YASHVANT@cluster0.f3pmu6p.mongodb.net/biobridge?retryWrites=true&w=majority";
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB Atlas successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// User Schema
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["sales_rep", "decision_maker", "super_admin", "enterprise_admin"],
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    linkedinUrl: { type: String },
    linkedinVerified: { type: Boolean, default: false },
    jobTitle: { type: String },
    company: { type: String },
    industry: { type: String },
    companySize: { type: String },
    yearsInRole: { type: String },
    packageType: { type: String, default: "free" },
    isActive: { type: Boolean, default: true },
    standing: { type: String, default: "good" },
    // Enterprise admin fields
    companyDomain: { type: String },
    domainVerified: { type: Boolean, default: false },
    domainVerifiedAt: { type: Date },
    department: { type: String },
    requirePasswordChange: { type: Boolean, default: false },
    permissions: [{ type: String }], // Array of decision maker IDs
    invitationStatus: { type: String, enum: ["invited", "accepted", "declined"], default: "accepted" },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    invitedAt: { type: Date },
    lastLogin: { type: Date },
    // Google Calendar integration
    googleCalendarTokens: {
      access_token: { type: String },
      refresh_token: { type: String },
      scope: { type: String },
      token_type: { type: String },
      expiry_date: { type: Number }
    },
    googleCalendarId: { type: String },
    calendarIntegrationEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// Invitation Schema
const invitationSchema = new mongoose.Schema(
  {
    salesRepId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    decisionMakerEmail: { type: String, required: true },
    decisionMakerName: { type: String, required: true },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "accepted", "declined"],
    },
  },
  {
    timestamps: true,
  },
);

// Call Schema
const callSchema = new mongoose.Schema(
  {
    salesRepId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    decisionMakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduledAt: { type: Date, required: true },
    endTime: { type: Date },
    status: {
      type: String,
      default: "scheduled",
      enum: ["scheduled", "completed", "cancelled"],
    },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    company: { type: String },
    pitch: { type: String },
    // Google Calendar integration
    googleEventId: { type: String },
    salesRepCalendarId: { type: String },
    decisionMakerCalendarId: { type: String },
    meetingLink: { type: String },
    timeZone: { type: String, default: "UTC" },
  },
  {
    timestamps: true,
  },
);

// Subscription Plan Schema
const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: String, required: true },
    billingInterval: {
      type: String,
      required: true,
      enum: ["monthly", "yearly"],
      default: "monthly"
    },
    features: [{ type: String }],
    maxCallCredits: { type: Number, required: true },
    maxInvitations: { type: Number, required: true },
    prioritySupport: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
export const Invitation = mongoose.model("Invitation", invitationSchema);
export const Call = mongoose.model("Call", callSchema);
export const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

export type UserDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  role: "sales_rep" | "decision_maker";
  firstName: string;
  lastName: string;
  linkedinUrl?: string;
  linkedinVerified: boolean;
  jobTitle?: string;
  company?: string;
  industry?: string;
  companySize?: string;
  yearsInRole?: string;
  packageType: string;
  isActive: boolean;
  standing: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InvitationDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  salesRepId: mongoose.Types.ObjectId;
  decisionMakerEmail: string;
  decisionMakerName: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  updatedAt: Date;
};

export type CallDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  salesRepId: mongoose.Types.ObjectId;
  decisionMakerId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  status: "scheduled" | "completed" | "cancelled";
  rating?: number;
  feedback?: string;
  company?: string;
  pitch?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SubscriptionPlanDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: string;
  billingInterval: "monthly" | "yearly";
  features: string[];
  maxCallCredits: number;
  maxInvitations: number;
  prioritySupport: boolean;
  bestSeller: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
