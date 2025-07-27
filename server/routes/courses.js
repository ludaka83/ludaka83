const express = require('express');
const router = express.Router();
const { auth, optionalAuth, courseAccess } = require('../middleware/auth');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Ad = require('../models/Ad');

// @route   GET /api/courses
// @desc    Get all published courses with pagination and filters
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const category = req.query.category;
    const level = req.query.level;
    const search = req.query.search;
    const sort = req.query.sort || 'newest';

    // Build query
    let query = { isPublished: true, isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (level && level !== 'all') {
      query.level = level;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'rating':
        sortOptions = { 'rating.average': -1 };
        break;
      case 'popular':
        sortOptions = { totalEnrollments: -1 };
        break;
      case 'price-low':
        sortOptions = { price: 1 };
        break;
      case 'price-high':
        sortOptions = { price: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const courses = await Course.find(query)
      .populate('instructor', 'username profile.firstName profile.lastName')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Course.countDocuments(query);

    // Add enrollment status for authenticated users
    if (req.user) {
      courses.forEach(course => {
        const enrollment = course.enrollments.find(
          enrollment => enrollment.user.toString() === req.user._id.toString()
        );
        course.isEnrolled = !!enrollment;
        course.progress = enrollment ? enrollment.progress : 0;
      });
    }

    // Get ads for course listing page
    const ads = await Ad.getAdsForPlacement('course-page', req.user, req.ip, 'desktop', 3);

    res.json({
      success: true,
      data: {
        courses,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCourses: total,
        ads
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course details
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('instructor', 'username profile.firstName profile.lastName profile.bio')
      .populate({
        path: 'lessons',
        select: 'title description type order duration isPreview isPremium',
        options: { sort: { order: 1 } }
      })
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isPublished && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is enrolled
    let isEnrolled = false;
    let progress = 0;
    if (req.user) {
      const enrollment = course.enrollments.find(
        enrollment => enrollment.user.toString() === req.user._id.toString()
      );
      isEnrolled = !!enrollment;
      progress = enrollment ? enrollment.progress : 0;
    }

    // Filter lessons based on access level
    if (!isEnrolled && req.user?.role !== 'admin') {
      course.lessons = course.lessons.filter(lesson => lesson.isPreview);
    }

    // Get ads for course detail page
    const ads = await Ad.getAdsForPlacement('course-page', req.user, req.ip, 'desktop', 2);

    res.json({
      success: true,
      data: {
        ...course,
        isEnrolled,
        progress,
        ads
      }
    });

  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course details'
    });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }

    // Check if already enrolled
    const existingEnrollment = course.enrollments.find(
      enrollment => enrollment.user.toString() === req.user._id.toString()
    );

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Check if premium course and user has premium subscription
    if (course.isPremium && req.user.subscription.type !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required for this course'
      });
    }

    // Add enrollment
    course.enrollments.push({
      user: req.user._id,
      enrolledAt: new Date(),
      progress: 0
    });

    await course.save();

    // Add to user's enrolled courses
    req.user.enrolledCourses.push({
      course: course._id,
      enrolledAt: new Date(),
      progress: 0
    });

    await req.user.save();

    res.json({
      success: true,
      message: 'Successfully enrolled in course'
    });

  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course'
    });
  }
});

// @route   GET /api/courses/:id/lessons/:lessonId
// @desc    Get lesson content
// @access  Private (enrolled users only)
router.get('/:id/lessons/:lessonId', auth, courseAccess, async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId)
      .populate('course', 'title')
      .lean();

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if lesson requires premium and user has premium access
    if (lesson.isPremium && req.user.subscription.type !== 'premium' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required for this lesson'
      });
    }

    // Get user completion status
    const completion = lesson.completions.find(
      completion => completion.user.toString() === req.user._id.toString()
    );

    // Get user notes
    const userNotes = lesson.notes.filter(
      note => note.user.toString() === req.user._id.toString()
    );

    // Get ads for lesson viewing
    const preVideoAds = await Ad.getAdsForPlacement('before-video', req.user, req.ip, 'desktop', 1);
    const postVideoAds = await Ad.getAdsForPlacement('after-video', req.user, req.ip, 'desktop', 1);

    res.json({
      success: true,
      data: {
        ...lesson,
        isCompleted: !!completion,
        completedAt: completion?.completedAt,
        userScore: completion?.score,
        userNotes,
        ads: {
          preVideo: preVideoAds,
          postVideo: postVideoAds
        }
      }
    });

  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lesson'
    });
  }
});

// @route   POST /api/courses/:id/lessons/:lessonId/complete
// @desc    Mark lesson as completed
// @access  Private (enrolled users only)
router.post('/:id/lessons/:lessonId/complete', auth, courseAccess, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { timeSpent, score } = req.body;

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Mark lesson as completed
    await lesson.markCompleted(req.user._id, timeSpent, score);

    // Update user progress in course
    const course = await Course.findById(req.params.id);
    const totalLessons = course.lessons.length;
    const completedLessons = await Lesson.countDocuments({
      _id: { $in: course.lessons },
      'completions.user': req.user._id
    });

    const progress = Math.round((completedLessons / totalLessons) * 100);

    // Update progress in course enrollments
    const enrollment = course.enrollments.find(
      enrollment => enrollment.user.toString() === req.user._id.toString()
    );
    if (enrollment) {
      enrollment.progress = progress;
      await course.save();
    }

    // Update progress in user's enrolled courses
    const userEnrollment = req.user.enrolledCourses.find(
      enrollment => enrollment.course.toString() === req.params.id
    );
    if (userEnrollment) {
      userEnrollment.progress = progress;
      await req.user.save();
    }

    res.json({
      success: true,
      message: 'Lesson marked as completed',
      data: {
        progress,
        completedLessons,
        totalLessons
      }
    });

  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing lesson'
    });
  }
});

// @route   POST /api/courses/:id/lessons/:lessonId/notes
// @desc    Add note to lesson
// @access  Private (enrolled users only)
router.post('/:id/lessons/:lessonId/notes', auth, courseAccess, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { content, timestamp, isPrivate } = req.body;

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    await lesson.addNote(req.user._id, content, timestamp, isPrivate);

    res.json({
      success: true,
      message: 'Note added successfully'
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding note'
    });
  }
});

// @route   GET /api/courses/categories
// @desc    Get all course categories
// @access  Public
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Course.distinct('category', { isPublished: true });
    
    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// @route   GET /api/courses/featured
// @desc    Get featured courses
// @access  Public
router.get('/meta/featured', optionalAuth, async (req, res) => {
  try {
    const featuredCourses = await Course.find({
      isPublished: true,
      isActive: true,
      'rating.average': { $gte: 4.0 }
    })
    .populate('instructor', 'username profile.firstName profile.lastName')
    .sort({ 'rating.average': -1, enrollments: -1 })
    .limit(6)
    .lean();

    // Add enrollment status for authenticated users
    if (req.user) {
      featuredCourses.forEach(course => {
        const enrollment = course.enrollments.find(
          enrollment => enrollment.user.toString() === req.user._id.toString()
        );
        course.isEnrolled = !!enrollment;
      });
    }

    res.json({
      success: true,
      data: featuredCourses
    });

  } catch (error) {
    console.error('Get featured courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured courses'
    });
  }
});

module.exports = router;