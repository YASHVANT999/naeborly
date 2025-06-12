# Complete API Documentation

## Overview
This Node.js MongoDB backend provides a complete authentication system with role-based access control, user management, and secure API endpoints.

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All responses follow this consistent format:
```json
{
  "success": boolean,
  "message": "string",
  "data": object | null,
  "meta": object | null,
  "timestamp": "ISO 8601 string"
}
```

## Error Codes
- 200: Success
- 201: Created
- 400: Bad Request / Validation Error
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "user" // optional, defaults to "user"
}
```

**Validation Rules:**
- name: 2-50 characters, required
- email: valid email format, unique
- password: min 6 chars, must contain uppercase, lowercase, and number
- role: either "user" or "admin"

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "emailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_string"
  }
}
```

### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token_string"
  }
}
```

**Rate Limit:** 5 requests per 15 minutes per IP

### GET /api/auth/me
Get current authenticated user profile.

**Headers:** Authorization: Bearer <token>

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "avatar": null,
      "isActive": true,
      "emailVerified": false,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### PUT /api/auth/profile
Update user profile information.

**Headers:** Authorization: Bearer <token>

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { /* updated user object */ }
  }
}
```

### PUT /api/auth/password
Change user password.

**Headers:** Authorization: Bearer <token>

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### POST /api/auth/forgot-password
Request password reset token.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset instructions sent to email",
  "data": {
    "resetToken": "token_string" // only in development mode
  }
}
```

**Rate Limit:** 3 requests per hour per IP

### POST /api/auth/reset-password
Reset password using token.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### POST /api/auth/logout
Logout user (client-side token removal).

**Headers:** Authorization: Bearer <token>

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Management Endpoints (Admin Only)

### GET /api/users
Get all users with pagination and search.

**Headers:** Authorization: Bearer <admin_token>

**Query Parameters:**
- page: integer (default: 1)
- limit: integer (default: 10, max: 100)
- sort: string (default: "-createdAt")
- search: string (searches name and email)

**Example:** `/api/users?page=1&limit=10&search=john&sort=-createdAt`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### GET /api/users/:id
Get specific user by ID.

**Headers:** Authorization: Bearer <admin_token>

**Parameters:**
- id: MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": { /* user object */ }
  }
}
```

### PUT /api/users/:id/role
Update user role (admin only).

**Headers:** Authorization: Bearer <admin_token>

**Request Body:**
```json
{
  "role": "admin"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "user": { /* updated user object */ }
  }
}
```

### DELETE /api/users/:id
Soft delete user (deactivate account).

**Headers:** Authorization: Bearer <admin_token>

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### GET /api/users/stats
Get user statistics (admin only).

**Headers:** Authorization: Bearer <admin_token>

**Success Response (200):**
```json
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "totalUsers": 100,
    "activeUsers": 95,
    "adminUsers": 5,
    "recentUsers": 10,
    "inactiveUsers": 5
  }
}
```

---

## Health Check Endpoint

### GET /health
Check server status and uptime.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600.123,
  "environment": "development"
}
```

---

## Security Features

### Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Password reset: 3 requests per hour

### CORS
Configurable allowed origins via environment variable.

### Security Headers
- Helmet.js for XSS protection
- Content Security Policy
- CSRF protection

### Input Validation
- Express-validator for request validation
- Mongoose schema validation
- Custom validation middleware

---

## Error Examples

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
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Rate Limit Error (429)
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Register user
const registerUser = async () => {
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123'
    });
    
    const { user, token } = response.data.data;
    console.log('User registered:', user.name);
    return token;
  } catch (error) {
    console.error('Registration failed:', error.response.data.message);
  }
};

// Login user
const loginUser = async () => {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'john@example.com',
      password: 'SecurePass123'
    });
    
    const { user, token } = response.data.data;
    console.log('Login successful:', user.name);
    return token;
  } catch (error) {
    console.error('Login failed:', error.response.data.message);
  }
};

// Get current user
const getCurrentUser = async (token) => {
  try {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Current user:', response.data.data.user);
  } catch (error) {
    console.error('Failed to get user:', error.response.data.message);
  }
};
```

### curl Examples
```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Login user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Get current user (replace TOKEN with actual JWT)
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Get all users (admin only)
curl -X GET "http://localhost:3001/api/users?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Environment Configuration

Required environment variables:
```env
MONGODB_URI=mongodb://localhost:27017/your-app-name
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
NODE_ENV=development
BCRYPT_SALT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Testing
Run the included test script:
```bash
cd backend
node test-simple.js  # Basic endpoint tests
node test-api.js     # Complete API tests (requires axios)
```