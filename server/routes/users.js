const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { uploadAvatar, handleUploadError } = require('../middleware/upload');
const User = require('../models/User');
const Course = require('../models/Course');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'enrolledCourses.course',
        select: 'title description thumbnail instructor rating duration',
        populate: {
          path: 'instructor',
          select: 'username profile.firstName profile.lastName'
        }
      });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, uploadAvatar, handleUploadError, async (req, res) => {
  try {
    const { firstName, lastName, bio } = req.body;

    const updateData = {
      'profile.firstName': firstName,
      'profile.lastName': lastName,
      'profile.bio': bio
    };

    // Add avatar if uploaded
    if (req.file) {
      updateData['profile.avatar'] = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'enrolledCourses.course',
        select: 'title description thumbnail instructor rating duration lessons',
        populate: {
          path: 'instructor',
          select: 'username profile.firstName profile.lastName'
        }
      });

    // Get recently accessed courses
    const recentCourses = user.enrolledCourses
      .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
      .slice(0, 4);

    // Get progress statistics
    const totalCourses = user.enrolledCourses.length;
    const completedCourses = user.enrolledCourses.filter(enrollment => enrollment.progress === 100).length;
    const inProgressCourses = user.enrolledCourses.filter(enrollment => enrollment.progress > 0 && enrollment.progress < 100).length;
    const averageProgress = totalCourses > 0 
      ? user.enrolledCourses.reduce((sum, enrollment) => sum + enrollment.progress, 0) / totalCourses 
      : 0;

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalCourses,
          completedCourses,
          inProgressCourses,
          averageProgress: Math.round(averageProgress)
        },
        recentCourses
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// @route   GET /api/users/courses
// @desc    Get user's enrolled courses
// @access  Private
router.get('/courses', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // 'all', 'in-progress', 'completed'

    const user = await User.findById(req.user._id)
      .populate({
        path: 'enrolledCourses.course',
        select: 'title description thumbnail instructor rating duration lessons',
        populate: {
          path: 'instructor',
          select: 'username profile.firstName profile.lastName'
        }
      });

    let courses = user.enrolledCourses;

    // Filter by status
    if (status === 'completed') {
      courses = courses.filter(enrollment => enrollment.progress === 100);
    } else if (status === 'in-progress') {
      courses = courses.filter(enrollment => enrollment.progress > 0 && enrollment.progress < 100);
    } else if (status === 'not-started') {
      courses = courses.filter(enrollment => enrollment.progress === 0);
    }

    // Sort by enrollment date (newest first)
    courses.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));

    // Paginate
    const total = courses.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedCourses = courses.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        courses: paginatedCourses,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCourses: total
      }
    });
  } catch (error) {
    console.error('Get user courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user courses'
    });
  }
});

// @route   DELETE /api/users/courses/:courseId
// @desc    Unenroll from a course
// @access  Private
router.delete('/courses/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Remove from user's enrolled courses
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { enrolledCourses: { course: courseId } } }
    );

    // Remove from course enrollments
    await Course.findByIdAndUpdate(
      courseId,
      { $pull: { enrollments: { user: req.user._id } } }
    );

    res.json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    console.error('Unenroll course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unenrolling from course'
    });
  }
});

// @route   GET /api/users/progress/:courseId
// @desc    Get detailed progress for a specific course
// @access  Private
router.get('/progress/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate({
        path: 'lessons',
        select: 'title type order duration completions',
        options: { sort: { order: 1 } }
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is enrolled
    const enrollment = course.enrollments.find(
      enrollment => enrollment.user.toString() === req.user._id.toString()
    );

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Get completion status for each lesson
    const lessonsWithProgress = course.lessons.map(lesson => {
      const completion = lesson.completions.find(
        completion => completion.user.toString() === req.user._id.toString()
      );

      return {
        _id: lesson._id,
        title: lesson.title,
        type: lesson.type,
        order: lesson.order,
        duration: lesson.duration,
        isCompleted: !!completion,
        completedAt: completion?.completedAt,
        score: completion?.score,
        timeSpent: completion?.timeSpent
      };
    });

    const totalLessons = lessonsWithProgress.length;
    const completedLessons = lessonsWithProgress.filter(lesson => lesson.isCompleted).length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    res.json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          instructor: course.instructor
        },
        progress,
        totalLessons,
        completedLessons,
        lessons: lessonsWithProgress,
        enrolledAt: enrollment.enrolledAt
      }
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course progress'
    });
  }
});

// @route   POST /api/users/subscription
// @desc    Update user subscription (placeholder for Stripe integration)
// @access  Private
router.post('/subscription', auth, async (req, res) => {
  try {
    const { subscriptionType } = req.body;

    if (!['free', 'premium'].includes(subscriptionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription type'
      });
    }

    // In a real application, you would integrate with Stripe here
    // For now, we'll just update the subscription type directly
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'subscription.type': subscriptionType,
        'subscription.expiresAt': subscriptionType === 'premium' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          : undefined
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: `Subscription updated to ${subscriptionType}`,
      data: user.subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subscription'
    });
  }
});

// @route   GET /api/users/achievements
// @desc    Get user achievements and badges (placeholder)
// @access  Private
router.get('/achievements', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('enrolledCourses.course', 'title category');

    const totalCourses = user.enrolledCourses.length;
    const completedCourses = user.enrolledCourses.filter(enrollment => enrollment.progress === 100).length;
    const categories = [...new Set(user.enrolledCourses.map(enrollment => enrollment.course.category))];

    // Generate achievements based on progress
    const achievements = [];

    if (totalCourses >= 1) {
      achievements.push({
        id: 'first-course',
        title: 'Getting Started',
        description: 'Enrolled in your first course',
        icon: '🎯',
        earned: true,
        earnedAt: user.enrolledCourses[0]?.enrolledAt
      });
    }

    if (completedCourses >= 1) {
      achievements.push({
        id: 'first-completion',
        title: 'Course Completer',
        description: 'Completed your first course',
        icon: '🏆',
        earned: true,
        earnedAt: user.enrolledCourses.find(e => e.progress === 100)?.enrolledAt
      });
    }

    if (completedCourses >= 5) {
      achievements.push({
        id: 'five-courses',
        title: 'Learning Enthusiast',
        description: 'Completed 5 courses',
        icon: '📚',
        earned: true
      });
    }

    if (categories.length >= 3) {
      achievements.push({
        id: 'diverse-learner',
        title: 'Diverse Learner',
        description: 'Explored 3 different categories',
        icon: '🌟',
        earned: true
      });
    }

    // Add future achievements
    achievements.push(
      {
        id: 'ten-courses',
        title: 'Dedicated Student',
        description: 'Complete 10 courses',
        icon: '🎓',
        earned: completedCourses >= 10
      },
      {
        id: 'speed-learner',
        title: 'Speed Learner',
        description: 'Complete a course in under 24 hours',
        icon: '⚡',
        earned: false
      }
    );

    res.json({
      success: true,
      data: {
        achievements,
        stats: {
          totalCourses,
          completedCourses,
          categoriesExplored: categories.length
        }
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements'
    });
  }
});

module.exports = router;