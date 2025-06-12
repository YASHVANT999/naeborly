const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'TestPass123'
};

const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'AdminPass123',
  role: 'admin'
};

let userToken = '';
let adminToken = '';
let userId = '';

/**
 * Test API endpoints
 */
async function runTests() {
  console.log('🚀 Starting API Tests...\n');

  try {
    // Test health check
    await testHealthCheck();
    
    // Test user registration
    await testUserRegistration();
    
    // Test user login
    await testUserLogin();
    
    // Test protected routes
    await testProtectedRoutes();
    
    // Test admin registration and operations
    await testAdminOperations();
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

async function testHealthCheck() {
  console.log('📊 Testing health check...');
  const response = await axios.get(`${API_BASE.replace('/api', '')}/health`);
  console.log('✅ Health check passed:', response.data.message);
}

async function testUserRegistration() {
  console.log('\n👤 Testing user registration...');
  const response = await axios.post(`${API_BASE}/auth/register`, testUser);
  console.log('✅ User registered:', response.data.data.user.name);
  userToken = response.data.data.token;
  userId = response.data.data.user.id;
}

async function testUserLogin() {
  console.log('\n🔐 Testing user login...');
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: testUser.email,
    password: testUser.password
  });
  console.log('✅ User logged in:', response.data.data.user.name);
  userToken = response.data.data.token;
}

async function testProtectedRoutes() {
  console.log('\n🛡️ Testing protected routes...');
  
  // Test get current user
  const meResponse = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  console.log('✅ Get current user:', meResponse.data.data.user.name);
  
  // Test update profile
  const updateResponse = await axios.put(`${API_BASE}/auth/profile`, {
    name: 'John Smith Updated'
  }, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  console.log('✅ Profile updated:', updateResponse.data.data.user.name);
  
  // Test change password
  await axios.put(`${API_BASE}/auth/password`, {
    currentPassword: testUser.password,
    newPassword: 'NewPassword123',
    confirmPassword: 'NewPassword123'
  }, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  console.log('✅ Password changed successfully');
}

async function testAdminOperations() {
  console.log('\n👑 Testing admin operations...');
  
  // Register admin user
  const adminRegResponse = await axios.post(`${API_BASE}/auth/register`, adminUser);
  adminToken = adminRegResponse.data.data.token;
  console.log('✅ Admin registered:', adminRegResponse.data.data.user.name);
  
  // Test get all users (admin only)
  const usersResponse = await axios.get(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✅ Retrieved users count:', usersResponse.data.data.length);
  
  // Test get user stats (admin only)
  const statsResponse = await axios.get(`${API_BASE}/users/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✅ User stats:', statsResponse.data.data);
  
  // Test update user role (admin only)
  const roleResponse = await axios.put(`${API_BASE}/users/${userId}/role`, {
    role: 'admin'
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✅ User role updated:', roleResponse.data.data.user.role);
}

// Test password reset flow
async function testPasswordReset() {
  console.log('\n🔄 Testing password reset...');
  
  // Request password reset
  const resetResponse = await axios.post(`${API_BASE}/auth/forgot-password`, {
    email: testUser.email
  });
  console.log('✅ Password reset requested');
  
  // In development mode, token is returned in response
  if (resetResponse.data.data && resetResponse.data.data.resetToken) {
    const resetToken = resetResponse.data.data.resetToken;
    
    // Reset password with token
    await axios.post(`${API_BASE}/auth/reset-password`, {
      token: resetToken,
      password: 'NewResetPassword123',
      confirmPassword: 'NewResetPassword123'
    });
    console.log('✅ Password reset completed');
  }
}

// Test error handling
async function testErrorHandling() {
  console.log('\n⚠️ Testing error handling...');
  
  try {
    // Test invalid login
    await axios.post(`${API_BASE}/auth/login`, {
      email: 'invalid@email.com',
      password: 'wrongpassword'
    });
  } catch (error) {
    console.log('✅ Invalid login handled:', error.response.data.message);
  }
  
  try {
    // Test unauthorized access
    await axios.get(`${API_BASE}/users`, {
      headers: { Authorization: 'Bearer invalid_token' }
    });
  } catch (error) {
    console.log('✅ Unauthorized access handled:', error.response.data.message);
  }
  
  try {
    // Test validation error
    await axios.post(`${API_BASE}/auth/register`, {
      name: '',
      email: 'invalid-email',
      password: '123'
    });
  } catch (error) {
    console.log('✅ Validation error handled:', error.response.data.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  // Add axios to package.json dependencies if not present
  try {
    require('axios');
  } catch (error) {
    console.log('Please install axios to run tests: npm install axios');
    process.exit(1);
  }
  
  runTests();
}

module.exports = {
  runTests,
  testHealthCheck,
  testUserRegistration,
  testUserLogin,
  testProtectedRoutes,
  testAdminOperations,
  testPasswordReset,
  testErrorHandling
};