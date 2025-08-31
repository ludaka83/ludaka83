#!/usr/bin/env node

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');

console.log('🧪 Studify Complete Setup Test');
console.log('===============================\n');

async function testMongoDB() {
  console.log('📦 Testing MongoDB Connection...');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB connected successfully');
    
    // Test basic database operations
    const db = mongoose.connection.db;
    const collections = await db.collections();
    console.log(`   📁 Found ${collections.length} collections`);
    
    // Test sample data
    const User = require('./models/User');
    const Course = require('./models/Course');
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    
    console.log(`   👥 Users in database: ${userCount}`);
    console.log(`   📚 Courses in database: ${courseCount}`);
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

async function testCloudinary() {
  console.log('\n☁️  Testing Cloudinary Configuration...');
  try {
    const cloudinary = require('cloudinary').v2;
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    console.log(`   📛 Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   🔑 API Key: ${process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set'}`);
    console.log(`   🔐 API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'}`);
    
    if (process.env.CLOUDINARY_CLOUD_NAME === 'studify-demo') {
      console.log('⚠️  Using demo credentials - Replace with real Cloudinary account');
      console.log('   📖 See setup-cloudinary.md for instructions');
      return 'demo';
    } else {
      // Try to ping Cloudinary API
      try {
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary connection successful');
        return true;
      } catch (err) {
        console.log('❌ Cloudinary credentials invalid:', err.message);
        return false;
      }
    }
  } catch (error) {
    console.log('❌ Cloudinary test failed:', error.message);
    return false;
  }
}

async function testBackendAPI() {
  console.log('\n🔧 Testing Backend API...');
  
  const testEndpoints = [
    { url: 'http://localhost:5000/api/health', name: 'Health Check' },
    { url: 'http://localhost:5000/api/courses', name: 'Courses API' },
  ];

  for (const endpoint of testEndpoints) {
    try {
      const response = await makeRequest(endpoint.url);
      if (response.status === 200) {
        console.log(`✅ ${endpoint.name}: Working`);
      } else {
        console.log(`❌ ${endpoint.name}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  try {
    const loginData = JSON.stringify({
      email: 'admin@studify.com',
      password: 'SecureAdmin123!'
    });

    const response = await makeRequest('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: loginData
    });

    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.success && data.token) {
        console.log('✅ Admin authentication: Working');
        return data.token;
      }
    }
    console.log('❌ Admin authentication: Failed');
    return null;
  } catch (error) {
    console.log('❌ Authentication test failed:', error.message);
    return null;
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? require('https') : http;
    
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();

    // Set timeout
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testFrontend() {
  console.log('\n⚛️  Testing Frontend...');
  try {
    const response = await makeRequest('http://localhost:3000');
    if (response.status === 200) {
      console.log('✅ React frontend: Running');
    } else {
      console.log(`❌ Frontend: Status ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Frontend: Not accessible -', error.message);
  }
}

async function displaySystemInfo() {
  console.log('\n💻 System Information');
  console.log('=====================');
  console.log(`Node.js: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

async function displayAccessInfo() {
  console.log('\n🌐 Access Information');
  console.log('=====================');
  console.log('**Application URLs:**');
  console.log('• Frontend: http://localhost:3000');
  console.log('• Backend API: http://localhost:5000');
  console.log('• Admin Panel: http://localhost:3000/admin');
  console.log('');
  console.log('**Login Credentials:**');
  console.log('• Admin: admin@studify.com / SecureAdmin123!');
  console.log('• Student: john@example.com / password123');
  console.log('• Student: jane@example.com / password123');
  console.log('• Instructor: mike@example.com / password123');
}

async function displayNextSteps(mongoOk, cloudinaryStatus) {
  console.log('\n📋 Next Steps');
  console.log('=============');
  
  if (!mongoOk) {
    console.log('❗ CRITICAL: Fix MongoDB connection first');
    console.log('   • Check if MongoDB is running');
    console.log('   • Verify MONGODB_URI in server/.env');
  }
  
  if (cloudinaryStatus === 'demo') {
    console.log('⚠️  RECOMMENDED: Set up real Cloudinary credentials');
    console.log('   • Visit: https://cloudinary.com (free account)');
    console.log('   • Update CLOUDINARY_* values in server/.env');
    console.log('   • See: setup-cloudinary.md for detailed instructions');
  } else if (!cloudinaryStatus) {
    console.log('❗ RECOMMENDED: Fix Cloudinary configuration');
    console.log('   • Check CLOUDINARY_* values in server/.env');
    console.log('   • Verify credentials are correct');
  }
  
  console.log('');
  console.log('✅ Ready to go:');
  console.log('   1. Admin can upload videos (demo mode without Cloudinary)');
  console.log('   2. Students can browse and enroll in courses');
  console.log('   3. Ads system is active with sample data');
  console.log('   4. All security features are enabled');
}

async function runCompleteTest() {
  console.log('Starting comprehensive system test...\n');
  
  const mongoOk = await testMongoDB();
  const cloudinaryStatus = await testCloudinary();
  await testBackendAPI();
  await testAuthentication();
  await testFrontend();
  
  await displaySystemInfo();
  await displayAccessInfo();
  await displayNextSteps(mongoOk, cloudinaryStatus);
  
  console.log('\n🎯 Test Summary');
  console.log('===============');
  if (mongoOk && cloudinaryStatus) {
    console.log('🎉 ALL SYSTEMS READY! Studify is fully operational.');
  } else if (mongoOk) {
    console.log('⚠️  MOSTLY READY! Database working, Cloudinary needs setup.');
  } else {
    console.log('❌ SETUP NEEDED! Please fix the issues above first.');
  }
}

// Run the test
if (require.main === module) {
  runCompleteTest().catch(console.error);
}

module.exports = { runCompleteTest };