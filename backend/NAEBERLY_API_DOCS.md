# Naeberly Clone API Documentation

## Overview
Complete backend API for Naeberly clone - a sales enablement platform that connects sales representatives with decision makers through warm introductions and scheduled calls.

## Base URL
```
http://localhost:3001/api
```

## User Roles
- **admin**: Platform administrators with full access
- **sales_rep**: Sales representatives who invite decision makers and schedule calls
- **decision_maker**: Decision makers who accept invitations and participate in calls

## Authentication
JWT token required for protected endpoints:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication Endpoints

### POST /api/auth/register
Register new user with role-specific setup.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@company.com",
  "password": "SecurePass123",
  "role": "sales_rep",
  "packageType": "premium",
  "company": "TechCorp Inc",
  "jobTitle": "Senior Sales Manager",
  "industry": "Technology",
  "companySize": "51-200 employees",
  "linkedinUrl": "https://linkedin.com/in/johnsmith"
}
```

**Sales Rep Package Types:**
- `free`: 1 call credit, 1 DM per month
- `basic`: 5 call credits, 3 DMs per month  
- `premium`: 15 call credits, 10 DMs per month
- `pro-team`: 50 call credits, 25 DMs per month

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Smith",
      "email": "john@company.com",
      "role": "sales_rep",
      "packageType": "premium",
      "callCredits": 15,
      "monthlyDMLimit": 10,
      "company": "TechCorp Inc",
      "jobTitle": "Senior Sales Manager"
    },
    "token": "jwt_token"
  }
}
```

### POST /api/auth/login
```json
{
  "email": "john@company.com",
  "password": "SecurePass123"
}
```

---

## Invitation System

### POST /api/invitations
**Role:** Sales Rep only
Create invitation to decision maker.

```json
{
  "decisionMakerEmail": "sarah@targetcompany.com",
  "decisionMakerName": "Sarah Johnson",
  "message": "I'd love to discuss how our solution can help your team"
}
```

### GET /api/invitations
**Role:** Sales Rep only
Get my sent invitations with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (pending, accepted, rejected, expired)

### GET /api/invitations/stats
**Role:** Sales Rep only
Get invitation statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalInvitations": 25,
    "pendingInvitations": 8,
    "acceptedInvitations": 12,
    "rejectedInvitations": 3,
    "monthlyInvitations": 8,
    "acceptanceRate": "48.0"
  }
}
```

### GET /api/invitations/token/:token
**Public endpoint**
View invitation details using token from email.

### POST /api/invitations/accept/:token
**Public endpoint**
Accept invitation and create decision maker account.

```json
{
  "name": "Sarah Johnson",
  "password": "SecurePass123",
  "company": "Target Company",
  "jobTitle": "VP of Sales",
  "availability": {
    "timezone": "EST",
    "preferredDays": ["Monday", "Tuesday", "Wednesday"],
    "preferredTimes": ["09:00", "14:00", "16:00"]
  },
  "interests": ["SaaS", "Sales Technology", "Team Management"],
  "expertnessAreas": ["Sales Leadership", "B2B Sales"]
}
```

### POST /api/invitations/reject/:token
**Public endpoint**
Reject invitation.

### DELETE /api/invitations/:id
**Role:** Sales Rep only
Cancel pending invitation.

---

## Call Management

### POST /api/calls
**Role:** Sales Rep only
Schedule new call with decision maker.

```json
{
  "decisionMakerId": "decision_maker_user_id",
  "scheduledAt": "2024-01-15T14:00:00Z",
  "duration": 30,
  "notes": "Demo of new features"
}
```

### GET /api/calls
**Role:** Sales Rep or Decision Maker
Get my calls with filtering.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (scheduled, in_progress, completed, cancelled, no_show)
- `upcoming`: Set to "true" for upcoming calls only

### GET /api/calls/stats
**Role:** Sales Rep or Decision Maker
Get call statistics for current user.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCalls": 45,
    "completedCalls": 32,
    "cancelledCalls": 8,
    "upcomingCalls": 5,
    "averageRating": 4.2,
    "completionRate": "71.1"
  }
}
```

### GET /api/calls/:id
**Role:** Sales Rep or Decision Maker
Get specific call details.

### PUT /api/calls/:id/status
**Role:** Sales Rep or Decision Maker
Update call status.

```json
{
  "status": "in_progress",
  "actualStartTime": "2024-01-15T14:05:00Z",
  "connectionQuality": "excellent"
}
```

### POST /api/calls/:id/feedback
**Role:** Sales Rep or Decision Maker
Submit post-call evaluation.

**Sales Rep Feedback:**
```json
{
  "rating": 4,
  "feedback": "Great conversation, very engaged prospect",
  "outcome": "interested",
  "followUpDate": "2024-01-20T10:00:00Z",
  "dealValue": 50000
}
```

**Decision Maker Feedback:**
```json
{
  "rating": 5,
  "feedback": "Excellent presentation, very professional"
}
```

### DELETE /api/calls/:id
**Role:** Sales Rep or Decision Maker
Cancel scheduled call.

---

## User Management

### GET /api/auth/me
**Role:** All authenticated users
Get current user profile with role-specific data.

### PUT /api/auth/profile
**Role:** All authenticated users
Update profile information.

```json
{
  "name": "John Smith Updated",
  "company": "New Company Inc",
  "jobTitle": "VP of Sales",
  "linkedinUrl": "https://linkedin.com/in/johnsmith-updated"
}
```

### PUT /api/auth/password
**Role:** All authenticated users
Change password.

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```

---

## Admin Endpoints

### GET /api/users
**Role:** Admin only
Get all users with pagination and search.

### GET /api/users/stats
**Role:** Admin only
Get platform statistics.

### PUT /api/users/:id/role
**Role:** Admin only
Update user role.

### GET /api/invitations/admin/all
**Role:** Admin only
Get all invitations across platform.

### GET /api/calls/admin/all
**Role:** Admin only
Get all calls across platform.

---

## Data Models

### User Model
```javascript
{
  id: "ObjectId",
  name: "string",
  email: "string",
  role: "admin|sales_rep|decision_maker",
  isActive: "boolean",
  emailVerified: "boolean",
  
  // Professional info
  company: "string",
  jobTitle: "string",
  industry: "string",
  companySize: "string",
  yearsInRole: "number",
  linkedinUrl: "string",
  linkedinVerified: "boolean",
  
  // Sales rep specific
  packageType: "free|basic|premium|pro-team",
  callCredits: "number",
  monthlyDMLimit: "number",
  
  // Decision maker specific
  availability: {
    timezone: "string",
    preferredDays: ["string"],
    preferredTimes: ["string"]
  },
  interests: ["string"],
  expertnessAreas: ["string"],
  standing: "excellent|good|average|poor",
  
  createdAt: "Date",
  updatedAt: "Date"
}
```

### Invitation Model
```javascript
{
  id: "ObjectId",
  salesRepId: "ObjectId ref User",
  decisionMakerEmail: "string",
  decisionMakerName: "string",
  status: "pending|accepted|rejected|expired",
  message: "string",
  expiresAt: "Date",
  acceptedAt: "Date",
  rejectedAt: "Date",
  createdAt: "Date"
}
```

### Call Model
```javascript
{
  id: "ObjectId",
  salesRepId: "ObjectId ref User",
  decisionMakerId: "ObjectId ref User",
  scheduledAt: "Date",
  duration: "number", // minutes
  status: "scheduled|in_progress|completed|cancelled|no_show",
  
  // Post-call evaluation
  salesRepRating: "number 1-5",
  decisionMakerRating: "number 1-5",
  salesRepFeedback: "string",
  decisionMakerFeedback: "string",
  outcome: "interested|not_interested|follow_up_needed|closed_deal|no_decision",
  
  // Call details
  actualStartTime: "Date",
  actualEndTime: "Date",
  connectionQuality: "excellent|good|fair|poor",
  notes: "string",
  meetingLink: "string",
  
  createdAt: "Date",
  updatedAt: "Date"
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "Please provide a valid email",
        "value": "invalid-email"
      }
    ]
  }
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Resource not found"
}
```

---

## Rate Limits
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Password reset: 3 requests per hour

---

## Frontend Integration Examples

### Sales Rep Registration
```javascript
const registerSalesRep = async (formData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      role: 'sales_rep',
      packageType: 'premium'
    })
  });
  return response.json();
};
```

### Invite Decision Maker
```javascript
const inviteDecisionMaker = async (invitationData, token) => {
  const response = await fetch('/api/invitations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(invitationData)
  });
  return response.json();
};
```

### Schedule Call
```javascript
const scheduleCall = async (callData, token) => {
  const response = await fetch('/api/calls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(callData)
  });
  return response.json();
};
```

### Submit Call Feedback
```javascript
const submitFeedback = async (callId, feedback, token) => {
  const response = await fetch(`/api/calls/${callId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(feedback)
  });
  return response.json();
};
```

---

## Environment Setup

```env
MONGODB_URI=mongodb://localhost:27017/naeberly-clone
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
NODE_ENV=development
BCRYPT_SALT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Quick Start

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

3. **Start server:**
```bash
npm run dev
```

4. **Test endpoints:**
```bash
npm test
```

The backend is now ready to support your Naeberly frontend with complete user management, invitation system, and call scheduling functionality.