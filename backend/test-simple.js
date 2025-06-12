const http = require('http');

// Simple test without MongoDB dependency
function testHealthEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Health Check Response:');
      console.log('Status Code:', res.statusCode);
      console.log('Response:', JSON.parse(data));
    });
  });

  req.on('error', (err) => {
    console.error('Error:', err.message);
  });

  req.end();
}

// Test API root endpoint
function testRootEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\nRoot Endpoint Response:');
      console.log('Status Code:', res.statusCode);
      console.log('Response:', JSON.parse(data));
    });
  });

  req.on('error', (err) => {
    console.error('Error:', err.message);
  });

  req.end();
}

// Run tests
console.log('Testing backend endpoints...\n');
setTimeout(() => {
  testHealthEndpoint();
  setTimeout(() => {
    testRootEndpoint();
  }, 1000);
}, 1000);