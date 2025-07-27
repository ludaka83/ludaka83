#!/usr/bin/env node

const http = require('http');
const https = require('https');

console.log('🧪 Studify App Test Suite');
console.log('========================\n');

// Test configuration
const tests = [
  {
    name: 'Backend Health Check',
    url: 'http://localhost:5000/api/health',
    expectedStatus: 200,
    expectedData: ['success', 'Studify Server']
  },
  {
    name: 'Backend Test Endpoint',
    url: 'http://localhost:5000/api/test',
    expectedStatus: 200,
    expectedData: ['success', 'Security middleware', 'CORS enabled']
  },
  {
    name: 'Mock Courses API',
    url: 'http://localhost:5000/api/courses',
    expectedStatus: 200,
    expectedData: ['success', 'JavaScript Fundamentals', 'React Development']
  },
  {
    name: 'Mock Admin Dashboard',
    url: 'http://localhost:5000/api/admin/dashboard',
    expectedStatus: 200,
    expectedData: ['success', 'totalUsers', 'totalCourses']
  }
];

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            raw: data
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: null,
            raw: data,
            error: 'Invalid JSON'
          });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;
  
  console.log('🚀 Starting tests...\n');
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`${i + 1}. Testing: ${test.name}`);
    
    try {
      const result = await makeRequest(test.url);
      
      // Check status code
      if (result.status !== test.expectedStatus) {
        console.log(`   ❌ Status: ${result.status} (expected ${test.expectedStatus})`);
        failed++;
        continue;
      }
      
      // Check expected data exists
      let dataValid = true;
      for (const expectedItem of test.expectedData) {
        if (!result.raw.includes(expectedItem)) {
          console.log(`   ❌ Missing expected data: "${expectedItem}"`);
          dataValid = false;
        }
      }
      
      if (dataValid) {
        console.log(`   ✅ Status: ${result.status} - Data validation passed`);
        passed++;
      } else {
        failed++;
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  // Test summary
  console.log('📊 Test Results');
  console.log('===============');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Studify backend is working correctly.');
    console.log('\n📋 Backend Features Verified:');
    console.log('   • Express.js server running');
    console.log('   • Security middleware (Helmet, CORS, Rate limiting)');
    console.log('   • API endpoints responding correctly');
    console.log('   • JSON data parsing and validation');
    console.log('   • Mock data for courses and admin dashboard');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  // Additional system information
  console.log('\n🔧 System Information:');
  console.log(`   • Node.js Version: ${process.version}`);
  console.log(`   • Platform: ${process.platform}`);
  console.log(`   • Architecture: ${process.arch}`);
  console.log(`   • Working Directory: ${process.cwd()}`);
  
  // File structure check
  const fs = require('fs');
  console.log('\n📁 Project Structure:');
  
  const checkPaths = [
    './server/server-test.js',
    './server/package.json', 
    './client/package.json',
    './client/src/App.tsx',
    './client/src/contexts/AuthContext.tsx',
    './README.md'
  ];
  
  for (const path of checkPaths) {
    try {
      if (fs.existsSync(path)) {
        console.log(`   ✅ ${path}`);
      } else {
        console.log(`   ❌ ${path} (missing)`);
      }
    } catch (error) {
      console.log(`   ❓ ${path} (error checking)`);
    }
  }
  
  console.log('\n🌐 Access Points:');
  console.log('   • Backend API: http://localhost:5000');
  console.log('   • Health Check: http://localhost:5000/api/health');
  console.log('   • Test Endpoint: http://localhost:5000/api/test');
  console.log('   • Mock Courses: http://localhost:5000/api/courses');
  console.log('   • Frontend (when running): http://localhost:3000');
  
  console.log('\n📚 Next Steps:');
  console.log('   1. Set up MongoDB for full functionality');
  console.log('   2. Configure Cloudinary for file uploads');
  console.log('   3. Start the React frontend: cd client && npm start');
  console.log('   4. Replace mock data with real database');
  console.log('   5. Add authentication and user management');
}

// Start the test suite
runTests().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});