const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { uploadVideo, uploadThumbnail, uploadDocument, handleUploadError } = require('../middleware/upload');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Ad = require('../models/Ad');

// Apply auth middleware to all admin routes
router.use(auth);
router.use(adminAuth);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalLessons = await Lesson.countDocuments();
    const totalAds = await Ad.countDocuments();
    
    const recentUsers = await User.find()
      .select('username email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentCourses = await Course.find()
      .select('title instructor createdAt')
      .populate('instructor', 'username')
      .sort({ createdAt: -1 })
      .limit(5);

    const adMetrics = await Ad.aggregate([
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: '$metrics.impressions' },
          totalClicks: { $sum: '$metrics.clicks' },
          totalRevenue: { $sum: '$metrics.revenue' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalCourses,
          totalLessons,
          totalAds,
          adMetrics: adMetrics[0] || { totalImpressions: 0, totalClicks: 0, totalRevenue: 0 }
        },
        recentUsers,
        recentCourses
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// @route   POST /api/admin/courses
// @desc    Create a new course
// @access  Private (Admin only)
router.post('/courses', uploadThumbnail, handleUploadError, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      price,
      isPremium,
      tags,
      requirements,
      learningOutcomes,
      language
    } = req.body;

    const courseData = {
      title,
      description,
      category,
      level,
      price: parseFloat(price) || 0,
      isPremium: isPremium === 'true',
      instructor: req.user._id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      requirements: requirements ? requirements.split('\n').filter(req => req.trim()) : [],
      learningOutcomes: learningOutcomes ? learningOutcomes.split('\n').filter(outcome => outcome.trim()) : [],
      language: language || 'English'
    };

    // Add thumbnail if uploaded
    if (req.file) {
      courseData.thumbnail = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    const course = new Course(courseData);
    await course.save();

    await course.populate('instructor', 'username email');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course'
    });
  }
});

// @route   POST /api/admin/courses/:courseId/lessons
// @desc    Add a lesson to a course
// @access  Private (Admin only)
router.post('/courses/:courseId/lessons', uploadVideo, handleUploadError, async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      title,
      description,
      type,
      order,
      isPreview,
      isPremium,
      textContent,
      quizData,
      presentationData
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const lessonData = {
      title,
      description,
      course: courseId,
      order: parseInt(order),
      type,
      isPreview: isPreview === 'true',
      isPremium: isPremium === 'true'
    };

    // Handle different content types
    if (type === 'video' && req.file) {
      lessonData.content = {
        video: {
          url: req.file.path,
          public_id: req.file.filename
        }
      };
    } else if (type === 'text' && textContent) {
      lessonData.content = {
        text: {
          content: textContent,
          format: 'markdown'
        }
      };
    } else if (type === 'quiz' && quizData) {
      lessonData.content = {
        quiz: JSON.parse(quizData)
      };
    } else if (type === 'presentation' && presentationData) {
      lessonData.content = {
        presentation: JSON.parse(presentationData)
      };
    }

    const lesson = new Lesson(lessonData);
    await lesson.save();

    // Add lesson to course
    course.lessons.push(lesson._id);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lesson'
    });
  }
});

// @route   PUT /api/admin/courses/:id
// @desc    Update a course
// @access  Private (Admin only)
router.put('/courses/:id', uploadThumbnail, handleUploadError, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle boolean fields
    if (updateData.isPremium) updateData.isPremium = updateData.isPremium === 'true';
    if (updateData.isPublished) updateData.isPublished = updateData.isPublished === 'true';

    // Handle arrays
    if (updateData.tags) updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    if (updateData.requirements) updateData.requirements = updateData.requirements.split('\n').filter(req => req.trim());
    if (updateData.learningOutcomes) updateData.learningOutcomes = updateData.learningOutcomes.split('\n').filter(outcome => outcome.trim());

    // Handle new thumbnail
    if (req.file) {
      updateData.thumbnail = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    const course = await Course.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'username email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course'
    });
  }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Delete a course
// @access  Private (Admin only)
router.delete('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete all lessons associated with the course
    await Lesson.deleteMany({ course: id });

    // Delete the course
    await Course.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Course and associated lessons deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';

    let query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role'
    });
  }
});

// @route   POST /api/admin/ads
// @desc    Create a new ad
// @access  Private (Admin only)
router.post('/ads', async (req, res) => {
  try {
    const adData = {
      ...req.body,
      status: 'approved',
      isActive: true,
      approvedBy: req.user._id,
      approvedAt: new Date()
    };

    const ad = new Ad(adData);
    await ad.save();

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      data: ad
    });
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ad'
    });
  }
});

// @route   GET /api/admin/ads
// @desc    Get all ads with pagination
// @access  Private (Admin only)
router.get('/ads', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';

    let query = {};
    if (status) query.status = status;

    const ads = await Ad.find(query)
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ad.countDocuments(query);

    res.json({
      success: true,
      data: {
        ads,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAds: total
      }
    });
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ads'
    });
  }
});

// @route   PUT /api/admin/ads/:id/status
// @desc    Update ad status
// @access  Private (Admin only)
router.put('/ads/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const updateData = { status };

    if (status === 'approved') {
      updateData.approvedBy = req.user._id;
      updateData.approvedAt = new Date();
      updateData.isActive = true;
    } else if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason;
      updateData.isActive = false;
    } else if (status === 'paused') {
      updateData.isActive = false;
    }

    const ad = await Ad.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    res.json({
      success: true,
      message: 'Ad status updated successfully',
      data: ad
    });
  } catch (error) {
    console.error('Update ad status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ad status'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get admin analytics data
// @access  Private (Admin only)
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // User registration analytics
    const userStats = await User.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Course creation analytics
    const courseStats = await Course.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Ad revenue analytics
    const revenueStats = await Ad.aggregate([
      {
        $group: {
          _id: '$placement',
          totalRevenue: { $sum: '$metrics.revenue' },
          totalImpressions: { $sum: '$metrics.impressions' },
          totalClicks: { $sum: '$metrics.clicks' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        userStats,
        courseStats,
        revenueStats
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data'
    });
  }
});

module.exports = router;