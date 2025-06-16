const mongoose = require("mongoose");

// MongoDB connection string
const MONGODB_URI = "mongodb+srv://yash6491:YASHVANT@cluster0.f3pmu6p.mongodb.net/biobridge?retryWrites=true&w=majority";

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["sales_rep", "decision_maker", "super_admin", "enterprise_admin"], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  linkedinUrl: String,
  linkedinVerified: { type: Boolean, default: false },
  jobTitle: String,
  company: String,
  companyDomain: String,
  domainVerified: { type: Boolean, default: false },
  domainVerifiedAt: Date,
  industry: String,
  companySize: String,
  yearsInRole: String,
  packageType: { type: String, default: "free" },
  isActive: { type: Boolean, default: true },
  standing: { type: String, default: "good" },
  department: String,
  requirePasswordChange: { type: Boolean, default: false }
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);

async function createEnterpriseAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const enterpriseAdminData = {
      email: "admin@techize.com",
      password: "EnterpriseAdmin123!",
      role: "enterprise_admin",
      firstName: "Enterprise",
      lastName: "Admin",
      company: "Techize",
      companyDomain: "techize.com",
      domainVerified: true,
      domainVerifiedAt: new Date(),
      jobTitle: "Enterprise Administrator",
      department: "IT Administration",
      packageType: "enterprise",
      isActive: true,
      standing: "excellent"
    };

    // Check if enterprise admin already exists
    const existingAdmin = await User.findOne({ email: enterpriseAdminData.email });
    if (existingAdmin) {
      console.log("Enterprise admin already exists:", enterpriseAdminData.email);
      return;
    }

    const enterpriseAdmin = new User(enterpriseAdminData);
    await enterpriseAdmin.save();

    console.log("Enterprise admin created successfully!");
    console.log("Email:", enterpriseAdminData.email);
    console.log("Password:", enterpriseAdminData.password);
    console.log("Company Domain:", enterpriseAdminData.companyDomain);
    console.log("Role:", enterpriseAdminData.role);

  } catch (error) {
    console.error("Error creating enterprise admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createEnterpriseAdmin();