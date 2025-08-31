#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');
const Ad = require('./models/Ad');

console.log('🚀 Initializing Studify Database...');
console.log('====================================\n');

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createAdminUser() {
  try {
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (adminExists) {
      console.log('👤 Admin user already exists');
      return adminExists;
    }

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    
    const adminUser = new User({
      username: 'admin',
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      profile: {
        firstName: 'System',
        lastName: 'Administrator',
        bio: 'Platform administrator for Studify learning management system'
      },
      isEmailVerified: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${process.env.ADMIN_EMAIL}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD}`);
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

async function createSampleUsers() {
  try {
    const existingUsers = await User.countDocuments({ role: 'user' });
    
    if (existingUsers > 0) {
      console.log('👥 Sample users already exist');
      return;
    }

    const sampleUsers = [
      {
        username: 'john_student',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          bio: 'Aspiring web developer learning new technologies'
        },
        isEmailVerified: true
      },
      {
        username: 'jane_learner',
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          bio: 'Marketing professional expanding technical skills'
        },
        isEmailVerified: true
      },
      {
        username: 'mike_instructor',
        email: 'mike@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        profile: {
          firstName: 'Mike',
          lastName: 'Johnson',
          bio: 'Senior software engineer and coding instructor'
        },
        isEmailVerified: true
      }
    ];

    await User.insertMany(sampleUsers);
    console.log('✅ Sample users created');
    console.log('   • john_student (user)');
    console.log('   • jane_learner (user)'); 
    console.log('   • mike_instructor (user - instructor profile)');
  } catch (error) {
    console.error('❌ Error creating sample users:', error);
    throw error;
  }
}

async function createSampleCourses() {
  try {
    const existingCourses = await Course.countDocuments();
    
    if (existingCourses > 0) {
      console.log('📚 Sample courses already exist');
      return;
    }

    const instructor = await User.findOne({ username: 'mike_instructor' });
    
    if (!instructor) {
      console.log('⚠️  No instructor found, skipping course creation');
      return;
    }

    const sampleCourses = [
      {
        title: 'JavaScript Fundamentals',
        description: 'Learn the core concepts of JavaScript programming from variables to functions and beyond.',
        category: 'Programming',
        level: 'Beginner',
        price: 0,
        isPremium: false,
        instructor: instructor._id,
        thumbnailUrl: 'https://via.placeholder.com/400x225/3b82f6/ffffff?text=JavaScript',
        tags: ['javascript', 'programming', 'web-development'],
        isPublished: true,
        enrollmentCount: 45
      },
      {
        title: 'React Development Masterclass',
        description: 'Build modern, interactive web applications using React. Covers hooks, state management, and best practices.',
        category: 'Programming',
        level: 'Intermediate', 
        price: 49.99,
        isPremium: true,
        instructor: instructor._id,
        thumbnailUrl: 'https://via.placeholder.com/400x225/61dafb/000000?text=React',
        tags: ['react', 'frontend', 'javascript'],
        isPublished: true,
        enrollmentCount: 28
      },
      {
        title: 'Digital Marketing Essentials',
        description: 'Master the fundamentals of digital marketing including SEO, social media, and analytics.',
        category: 'Marketing',
        level: 'Beginner',
        price: 29.99,
        isPremium: true,
        instructor: instructor._id,
        thumbnailUrl: 'https://via.placeholder.com/400x225/f59e0b/ffffff?text=Marketing',
        tags: ['marketing', 'seo', 'social-media'],
        isPublished: true,
        enrollmentCount: 67
      }
    ];

    await Course.insertMany(sampleCourses);
    console.log('✅ Sample courses created');
    console.log('   • JavaScript Fundamentals (Free)');
    console.log('   • React Development Masterclass ($49.99)');
    console.log('   • Digital Marketing Essentials ($29.99)');
  } catch (error) {
    console.error('❌ Error creating sample courses:', error);
    throw error;
  }
}

async function createSampleLessons() {
  try {
    const existingLessons = await Lesson.countDocuments();
    
    if (existingLessons > 0) {
      console.log('🎥 Sample lessons already exist');
      return;
    }

    const courses = await Course.find().limit(2);
    
    if (courses.length === 0) {
      console.log('⚠️  No courses found, skipping lesson creation');
      return;
    }

    const sampleLessons = [
      // JavaScript Fundamentals lessons
      {
        title: 'Introduction to JavaScript',
        description: 'Overview of JavaScript and its role in web development',
        course: courses[0]._id,
        type: 'video',
        content: {
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_720x480_1mb.mp4',
          duration: 15
        },
        order: 1,
        isPreview: true
      },
      {
        title: 'Variables and Data Types',
        description: 'Learn about JavaScript variables, strings, numbers, and booleans',
        course: courses[0]._id,
        type: 'video',
        content: {
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_720x480_2mb.mp4',
          duration: 22
        },
        order: 2,
        isPreview: false
      },
      {
        title: 'Functions and Scope',
        description: 'Understanding JavaScript functions and variable scope',
        course: courses[0]._id,
        type: 'video',
        content: {
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_720x480_5mb.mp4',
          duration: 28
        },
        order: 3,
        isPreview: false
      },
      // React Development lessons
      {
        title: 'React Setup and JSX',
        description: 'Setting up React development environment and JSX basics',
        course: courses[1]._id,
        type: 'video',
        content: {
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_720x480_1mb.mp4',
          duration: 18
        },
        order: 1,
        isPreview: true
      },
      {
        title: 'Components and Props',
        description: 'Creating reusable components and passing data with props',
        course: courses[1]._id,
        type: 'video',
        content: {
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_720x480_2mb.mp4',
          duration: 25
        },
        order: 2,
        isPreview: false
      }
    ];

    await Lesson.insertMany(sampleLessons);
    
    // Update course lesson counts
    for (const course of courses) {
      const lessonCount = await Lesson.countDocuments({ course: course._id });
      const totalDuration = await Lesson.aggregate([
        { $match: { course: course._id } },
        { $group: { _id: null, total: { $sum: '$content.duration' } } }
      ]);
      
      await Course.findByIdAndUpdate(course._id, {
        totalLessons: lessonCount,
        duration: totalDuration[0]?.total || 0
      });
    }

    console.log('✅ Sample lessons created');
    console.log('   • 3 JavaScript lessons');
    console.log('   • 2 React lessons');
  } catch (error) {
    console.error('❌ Error creating sample lessons:', error);
    throw error;
  }
}

async function createSampleAds() {
  try {
    const existingAds = await Ad.countDocuments();
    
    if (existingAds > 0) {
      console.log('📢 Sample ads already exist');
      return;
    }

    const sampleAds = [
      {
        title: 'Learn Cloud Computing',
        type: 'banner',
        placement: 'header',
        content: {
          text: 'Master AWS, Azure, and Google Cloud. Start your cloud journey today!',
          imageUrl: 'https://via.placeholder.com/728x90/059669/ffffff?text=Cloud+Computing+Course',
          ctaText: 'Enroll Now',
          ctaUrl: 'https://example.com/cloud-course'
        },
        advertiser: {
          name: 'CloudTech Academy',
          email: 'ads@cloudtech.com'
        },
        targeting: {
          categories: ['Programming', 'Technology'],
          userRoles: ['user']
        },
        pricing: {
          model: 'cpm',
          rate: 2.50
        },
        scheduling: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        status: 'active'
      },
      {
        title: 'Design Tools Discount',
        type: 'banner',
        placement: 'sidebar',
        content: {
          text: 'Professional design tools with 50% student discount!',
          imageUrl: 'https://via.placeholder.com/300x250/7c3aed/ffffff?text=Design+Tools',
          ctaText: 'Get Discount',
          ctaUrl: 'https://example.com/design-tools'
        },
        advertiser: {
          name: 'DesignPro Software',
          email: 'marketing@designpro.com'
        },
        targeting: {
          categories: ['Design', 'Creative'],
          userRoles: ['user', 'admin']
        },
        pricing: {
          model: 'cpc',
          rate: 1.25
        },
        scheduling: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        },
        status: 'active'
      }
    ];

    await Ad.insertMany(sampleAds);
    console.log('✅ Sample ads created');
    console.log('   • Cloud Computing banner ad');
    console.log('   • Design Tools sidebar ad');
  } catch (error) {
    console.error('❌ Error creating sample ads:', error);
    throw error;
  }
}

async function createSampleEnrollments() {
  try {
    const users = await User.find({ role: 'user' });
    const courses = await Course.find();
    
    if (users.length === 0 || courses.length === 0) {
      console.log('⚠️  No users or courses found, skipping enrollments');
      return;
    }

    // Enroll first user in JavaScript course
    if (users[0] && courses[0]) {
      const user = users[0];
      if (!user.enrolledCourses.includes(courses[0]._id)) {
        user.enrolledCourses.push(courses[0]._id);
        await user.save();
      }
    }

    // Enroll second user in both JavaScript and React courses
    if (users[1] && courses.length >= 2) {
      const user = users[1];
      if (!user.enrolledCourses.includes(courses[0]._id)) {
        user.enrolledCourses.push(courses[0]._id);
      }
      if (!user.enrolledCourses.includes(courses[1]._id)) {
        user.enrolledCourses.push(courses[1]._id);
      }
      await user.save();
    }

    console.log('✅ Sample enrollments created');
  } catch (error) {
    console.error('❌ Error creating sample enrollments:', error);
    throw error;
  }
}

async function displaySummary() {
  try {
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const lessonCount = await Lesson.countDocuments();
    const adCount = await Ad.countDocuments();

    console.log('\n📊 Database Summary');
    console.log('==================');
    console.log(`👥 Users: ${userCount}`);
    console.log(`📚 Courses: ${courseCount}`);
    console.log(`🎥 Lessons: ${lessonCount}`);
    console.log(`📢 Ads: ${adCount}`);

    console.log('\n🔑 Login Credentials');
    console.log('====================');
    console.log('**Admin Account:**');
    console.log(`Email: ${process.env.ADMIN_EMAIL}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD}`);
    console.log('');
    console.log('**Test Student Accounts:**');
    console.log('Email: john@example.com | Password: password123');
    console.log('Email: jane@example.com | Password: password123');
    console.log('');
    console.log('**Test Instructor Account:**');
    console.log('Email: mike@example.com | Password: password123 (user role)');

    console.log('\n🌐 Access URLs');
    console.log('==============');
    console.log('Frontend: http://localhost:3000');
    console.log('Backend API: http://localhost:5000');
    console.log('Admin Panel: http://localhost:3000/admin');

  } catch (error) {
    console.error('❌ Error getting database summary:', error);
  }
}

async function initializeDatabase() {
  try {
    await connectToDatabase();
    
    console.log('🔧 Creating database structure...\n');
    
    await createAdminUser();
    await createSampleUsers();
    await createSampleCourses();
    await createSampleLessons();
    await createSampleAds();
    await createSampleEnrollments();
    
    await displaySummary();
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n▶️  Next Steps:');
    console.log('   1. Start the backend: cd server && npm run dev');
    console.log('   2. Start the frontend: cd client && npm start');
    console.log('   3. Visit http://localhost:3000 to access Studify');
    console.log('   4. Set up Cloudinary credentials for file uploads');
    
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📤 Database connection closed');
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };