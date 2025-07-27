const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.'
      });
    }

    // Check if user account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts.'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Account not verified. Please check your email.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin authentication.'
    });
  }
};

// Middleware to check if user is instructor or admin
const instructorAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Instructor privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Instructor auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during instructor authentication.'
    });
  }
};

// Optional authentication middleware (doesn't require login)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && !user.isLocked && user.isVerified) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (tokenError) {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

// Middleware to check course ownership
const courseOwnership = async (req, res, next) => {
  try {
    const Course = require('../models/Course');
    const courseId = req.params.id || req.params.courseId;
    
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.'
      });
    }

    // Admin can access any course
    if (req.user.role === 'admin') {
      req.course = course;
      return next();
    }

    // Check if user is the course instructor
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the instructor of this course.'
      });
    }

    req.course = course;
    next();
  } catch (error) {
    console.error('Course ownership middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during course ownership verification.'
    });
  }
};

// Middleware to check if user is enrolled in course
const courseAccess = async (req, res, next) => {
  try {
    const Course = require('../models/Course');
    const courseId = req.params.id || req.params.courseId;
    
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.'
      });
    }

    // Admin and course instructor always have access
    if (req.user.role === 'admin' || course.instructor.toString() === req.user._id.toString()) {
      req.course = course;
      return next();
    }

    // Check if user is enrolled
    const enrollment = course.enrollments.find(
      enrollment => enrollment.user.toString() === req.user._id.toString()
    );

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not enrolled in this course.'
      });
    }

    // Check if course requires premium subscription
    if (course.isPremium && req.user.subscription.type !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required to access this course.'
      });
    }

    req.course = course;
    req.enrollment = enrollment;
    next();
  } catch (error) {
    console.error('Course access middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during course access verification.'
    });
  }
};

module.exports = {
  auth,
  adminAuth,
  instructorAuth,
  optionalAuth,
  courseOwnership,
  courseAccess
};