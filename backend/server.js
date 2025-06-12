require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const connectDatabase = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const {
  helmet,
  cors,
  corsOptions,
  helmetConfig,
  generalLimiter,
  authLimiter,
  passwordResetLimiter
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Create Express app
const app = express();

// Connect to database
connectDatabase();

// Security middleware
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));

// Rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Node.js MongoDB Backend API',
    version: '1.0.0',
    documentation: '/api-docs', // Add API documentation endpoint if needed
    timestamp: new Date().toISOString()
  });
});

// Handle undefined routes
app.use('*', notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}
📊 Health check: http://localhost:${PORT}/health
📚 API Base URL: http://localhost:${PORT}/api
🔐 Auth endpoints: http://localhost:${PORT}/api/auth
👥 User endpoints: http://localhost:${PORT}/api/users
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;