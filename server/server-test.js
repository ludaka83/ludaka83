require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Studify Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working',
    features: [
      'Security middleware configured',
      'CORS enabled',
      'Rate limiting active',
      'File compression enabled',
      'Request logging active'
    ]
  });
});

// Mock admin endpoint
app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalUsers: 150,
        totalCourses: 25,
        totalLessons: 180,
        totalAds: 12,
        adMetrics: { totalImpressions: 15000, totalClicks: 850, totalRevenue: 245.50 }
      },
      recentUsers: [
        { username: 'john_doe', email: 'john@example.com', createdAt: new Date() },
        { username: 'jane_smith', email: 'jane@example.com', createdAt: new Date() }
      ],
      recentCourses: [
        { title: 'JavaScript Fundamentals', instructor: { username: 'instructor1' }, createdAt: new Date() },
        { title: 'React Development', instructor: { username: 'instructor2' }, createdAt: new Date() }
      ]
    }
  });
});

// Mock courses endpoint
app.get('/api/courses', (req, res) => {
  res.json({
    success: true,
    data: {
      courses: [
        {
          _id: '1',
          title: 'JavaScript Fundamentals',
          description: 'Learn the basics of JavaScript programming',
          category: 'Programming',
          level: 'Beginner',
          price: 0,
          isPremium: false,
          instructor: { username: 'john_instructor', profile: { firstName: 'John', lastName: 'Doe' }},
          rating: { average: 4.5, count: 23 },
          duration: 120,
          totalLessons: 15
        },
        {
          _id: '2',
          title: 'React Development',
          description: 'Build modern web applications with React',
          category: 'Programming',
          level: 'Intermediate',
          price: 49.99,
          isPremium: true,
          instructor: { username: 'jane_instructor', profile: { firstName: 'Jane', lastName: 'Smith' }},
          rating: { average: 4.8, count: 45 },
          duration: 180,
          totalLessons: 22
        }
      ],
      currentPage: 1,
      totalPages: 1,
      totalCourses: 2,
      ads: []
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📊 Mock admin: http://localhost:${PORT}/api/admin/dashboard`);
  console.log(`📚 Mock courses: http://localhost:${PORT}/api/courses`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;