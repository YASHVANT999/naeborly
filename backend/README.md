# Naeberly Clone Backend

A comprehensive Node.js backend for a sales enablement platform that connects sales representatives with decision makers through warm introductions and scheduled calls.

## Platform Overview

Naeberly clone is a B2B sales platform featuring:
- **Three user roles**: Admins, Sales Representatives, and Decision Makers
- **Invitation system**: Sales reps invite decision makers via email
- **Call scheduling**: Integrated call management with post-call evaluations
- **Package tiers**: Flexible pricing for sales representatives
- **Analytics**: Comprehensive statistics and performance tracking

## Architecture

- **Backend**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with role-based access control
- **Security**: Rate limiting, CORS, helmet, bcrypt password hashing
- **Validation**: Express-validator with comprehensive input validation
- **Structure**: Modular architecture with separate layers

## User Roles & Permissions

### Sales Representatives
- Create invitations to decision makers
- Schedule and manage calls
- View invitation and call statistics
- Package-based limitations (call credits, monthly DM limits)
- Profile management with professional information

### Decision Makers
- Accept/reject invitations via email tokens
- Participate in scheduled calls
- Submit post-call evaluations
- Manage availability preferences
- Professional profile with expertise areas

### Admins
- Full platform oversight
- User management across all roles
- Platform-wide analytics
- Role assignment and permissions

## Package Tiers (Sales Representatives)

| Package | Call Credits | Monthly DM Limit | Price |
|---------|-------------|------------------|-------|
| Free | 1 | 1 | $0 |
| Basic | 5 | 3 | $29/month |
| Premium | 15 | 10 | $79/month |
| Pro Team | 50 | 25 | $199/month |

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration with role-specific setup
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/logout` - User logout

### Invitations (Sales Rep only)
- `POST /api/invitations` - Create invitation to decision maker
- `GET /api/invitations` - Get sent invitations with pagination
- `GET /api/invitations/stats` - Get invitation statistics
- `DELETE /api/invitations/:id` - Cancel pending invitation

### Invitation Acceptance (Public)
- `GET /api/invitations/token/:token` - View invitation details
- `POST /api/invitations/accept/:token` - Accept invitation and create account
- `POST /api/invitations/reject/:token` - Reject invitation

### Call Management
- `POST /api/calls` - Schedule new call (Sales Rep only)
- `GET /api/calls` - Get user's calls with filtering
- `GET /api/calls/stats` - Get call statistics
- `GET /api/calls/:id` - Get specific call details
- `PUT /api/calls/:id/status` - Update call status
- `POST /api/calls/:id/feedback` - Submit post-call evaluation
- `DELETE /api/calls/:id` - Cancel call

### Admin Operations
- `GET /api/users` - Get all users with pagination
- `GET /api/users/stats` - Get platform statistics
- `PUT /api/users/:id/role` - Update user role
- `DELETE /api/users/:id` - Delete user

## Data Models

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (required: admin|sales_rep|decision_maker),
  isActive: Boolean (default: true),
  emailVerified: Boolean (default: false),
  
  // Professional Information
  company: String,
  jobTitle: String,
  industry: String,
  companySize: String,
  yearsInRole: Number,
  linkedinUrl: String,
  linkedinVerified: Boolean,
  
  // Sales Rep Specific
  packageType: String (free|basic|premium|pro-team),
  callCredits: Number,
  monthlyDMLimit: Number,
  
  // Decision Maker Specific
  availability: {
    timezone: String,
    preferredDays: [String],
    preferredTimes: [String]
  },
  interests: [String],
  expertnessAreas: [String],
  standing: String (excellent|good|average|poor)
}
```

### Invitation Schema
```javascript
{
  salesRepId: ObjectId (ref: User),
  decisionMakerEmail: String (required),
  decisionMakerName: String (required),
  status: String (pending|accepted|rejected|expired),
  message: String,
  token: String (unique),
  expiresAt: Date,
  acceptedAt: Date,
  rejectedAt: Date
}
```

### Call Schema
```javascript
{
  salesRepId: ObjectId (ref: User),
  decisionMakerId: ObjectId (ref: User),
  scheduledAt: Date (required),
  duration: Number (minutes),
  status: String (scheduled|in_progress|completed|cancelled|no_show),
  
  // Post-call Evaluation
  salesRepRating: Number (1-5),
  decisionMakerRating: Number (1-5),
  salesRepFeedback: String,
  decisionMakerFeedback: String,
  outcome: String (interested|not_interested|follow_up_needed|closed_deal),
  
  // Call Details
  actualStartTime: Date,
  actualEndTime: Date,
  connectionQuality: String (excellent|good|fair|poor),
  notes: String,
  meetingLink: String
}
```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes (general), 5 per 15 minutes (auth)
- **CORS Protection**: Configurable allowed origins
- **Helmet**: Security headers
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **Input Validation**: Comprehensive validation with express-validator
- **Role-based Access Control**: Granular permissions per endpoint

## Installation & Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd backend
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/naeberly-clone
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3001
NODE_ENV=development
BCRYPT_SALT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

3. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally
```

4. **Run Application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Testing

### API Testing
```bash
# Run comprehensive API tests
npm run test:api

# Run simple health check tests
npm test
```

### Manual Testing with curl

**Register Sales Rep:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@salescompany.com",
    "password": "SecurePass123",
    "role": "sales_rep",
    "packageType": "premium",
    "company": "SalesCorp Inc",
    "jobTitle": "Senior Sales Manager"
  }'
```

**Create Invitation:**
```bash
curl -X POST http://localhost:3001/api/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "decisionMakerEmail": "sarah@targetcompany.com",
    "decisionMakerName": "Sarah Johnson",
    "message": "I would love to discuss our solution with you."
  }'
```

**Schedule Call:**
```bash
curl -X POST http://localhost:3001/api/calls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "decisionMakerId": "DECISION_MAKER_ID",
    "scheduledAt": "2024-01-15T14:00:00Z",
    "duration": 30,
    "notes": "Product demo"
  }'
```

## Error Handling

The API returns structured error responses:

```javascript
{
  "success": false,
  "message": "Error description",
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

## Development Guidelines

### Adding New Endpoints
1. Define route in appropriate route file (`routes/`)
2. Implement controller logic (`controllers/`)
3. Add business logic to service layer (`services/`)
4. Update data models if needed (`models/`)
5. Add validation rules (`middleware/validation.js`)
6. Add tests (`test-api.js`)

### Database Operations
- Use Mongoose models for all database operations
- Implement proper error handling
- Use transactions for complex operations
- Add indexes for performance-critical queries

### Security Considerations
- Always validate input data
- Use parameterized queries to prevent injection
- Implement rate limiting on sensitive endpoints
- Log security events for monitoring
- Regularly update dependencies

## Performance Optimization

- **Database Indexing**: Indexes on frequently queried fields
- **Pagination**: All list endpoints support pagination
- **Caching**: Consider Redis for session storage in production
- **Query Optimization**: Use lean queries for better performance
- **Connection Pooling**: MongoDB connection pooling configured

## Deployment

### Production Checklist
- [ ] Set strong JWT secret
- [ ] Configure production MongoDB URI
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for production domains
- [ ] Set up SSL/TLS
- [ ] Configure proper logging
- [ ] Set up monitoring and health checks
- [ ] Configure backup strategy

### Environment Variables
```env
# Required
MONGODB_URI=mongodb://production-uri
JWT_SECRET=production-jwt-secret
NODE_ENV=production

# Optional
PORT=3001
BCRYPT_SALT_ROUNDS=12
ALLOWED_ORIGINS=https://yourdomain.com
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Implement changes with tests
4. Ensure all tests pass (`npm run test:api`)
5. Submit pull request

## API Documentation

For detailed API documentation with examples, see [NAEBERLY_API_DOCS.md](./NAEBERLY_API_DOCS.md)

## Support

For issues and questions:
- Check existing GitHub issues
- Review API documentation
- Test with provided examples
- Contact development team

---

**Built with Node.js, Express, MongoDB, and JWT authentication for secure, scalable B2B sales enablement.**