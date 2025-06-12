# Node.js MongoDB Backend API

A scalable Node.js backend application with MongoDB, featuring JWT authentication, role-based access control, and comprehensive error handling.

## 🚀 Features

- **Authentication System**: Complete signup, login, password reset
- **JWT Security**: Token-based authentication with role-based access
- **MongoDB Integration**: Mongoose ODM with optimized schemas
- **Input Validation**: Express-validator for request validation
- **Error Handling**: Global error handling with detailed responses
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **Security Headers**: Helmet.js for security best practices
- **CORS Support**: Configurable cross-origin resource sharing
- **Modular Architecture**: Clean separation of concerns

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── authController.js    # Authentication route handlers
│   └── userController.js    # User management route handlers
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── errorHandler.js     # Global error handling
│   ├── security.js         # Security configurations
│   └── validation.js       # Input validation rules
├── models/
│   └── User.js             # User MongoDB schema
├── routes/
│   ├── authRoutes.js       # Authentication endpoints
│   └── userRoutes.js       # User management endpoints
├── services/
│   └── userService.js      # Business logic for user operations
├── utils/
│   ├── helpers.js          # Utility functions
│   └── jwt.js              # JWT token utilities
├── .env.example            # Environment variables template
├── package.json            # Dependencies and scripts
└── server.js               # Main application entry point
```

## 🛠️ Installation

1. **Clone and setup**:
```bash
cd backend
npm install
```

2. **Environment Configuration**:
```bash
cp .env.example .env
```

3. **Configure your `.env` file**:
```env
MONGODB_URI=mongodb://localhost:27017/your-app-name
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex
PORT=5000
NODE_ENV=development
```

4. **Start the application**:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "user"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

#### Change Password
```http
PUT /api/auth/password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

### User Management Endpoints (Admin Only)

#### Get All Users
```http
GET /api/users?page=1&limit=10&search=john&sort=-createdAt
Authorization: Bearer <admin_jwt_token>
```

#### Get User by ID
```http
GET /api/users/:userId
Authorization: Bearer <admin_jwt_token>
```

#### Update User Role
```http
PUT /api/users/:userId/role
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "role": "admin"
}
```

#### Delete User
```http
DELETE /api/users/:userId
Authorization: Bearer <admin_jwt_token>
```

#### Get User Statistics
```http
GET /api/users/stats
Authorization: Bearer <admin_jwt_token>
```

## 🔐 Authentication & Authorization

### JWT Token Usage
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### User Roles
- **user**: Standard user with basic permissions
- **admin**: Administrative user with full access

### Protected Routes
- `/api/auth/me` - Requires authentication
- `/api/auth/profile` - Requires authentication
- `/api/auth/password` - Requires authentication
- `/api/users/*` - Requires admin role

## 🛡️ Security Features

- **Rate Limiting**: Different limits for general, auth, and password reset endpoints
- **CORS Protection**: Configurable allowed origins
- **Security Headers**: Helmet.js for XSS, CSRF protection
- **Input Validation**: Comprehensive validation using express-validator
- **Password Hashing**: Bcrypt with configurable salt rounds
- **JWT Security**: Secure token generation and verification

## 📝 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "meta": {
    "stack": "..." // Only in development mode
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/your-app-name` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `12` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |

## 🚦 Health Check

Check server status:
```http
GET /health
```

Returns server uptime, environment, and status information.

## 🛠️ Development

### Adding New Features

1. **Create Model** (if needed):
   - Add new schema in `models/`
   - Define relationships and validations

2. **Create Service**:
   - Add business logic in `services/`
   - Handle database operations

3. **Create Controller**:
   - Add route handlers in `controllers/`
   - Use services for business logic

4. **Create Routes**:
   - Define endpoints in `routes/`
   - Add validation middleware

5. **Add Validation**:
   - Create validation rules in `middleware/validation.js`

### Error Handling

All async operations should use the `asyncHandler` wrapper:
```javascript
const { asyncHandler } = require('../middleware/errorHandler');

const myController = asyncHandler(async (req, res) => {
  // Your async code here
});
```

### Database Queries

Always use the service layer for database operations:
```javascript
// ❌ Don't do this in controllers
const user = await User.findById(id);

// ✅ Do this instead
const user = await userService.getUserById(id);
```

## 📦 Dependencies

### Production Dependencies
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT implementation
- `dotenv` - Environment variables
- `cors` - CORS middleware
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `express-validator` - Input validation
- `morgan` - Request logging

### Development Dependencies
- `nodemon` - Auto-restart development server

## 🚀 Deployment

1. Set production environment variables
2. Ensure MongoDB is accessible
3. Build and start the application:
```bash
NODE_ENV=production npm start
```

## 📋 TODO / Future Enhancements

- [ ] API documentation with Swagger
- [ ] Email service integration
- [ ] File upload functionality
- [ ] Advanced logging with Winston
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Monitoring and metrics