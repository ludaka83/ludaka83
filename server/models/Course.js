const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Course title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [1000, 'Course description cannot exceed 1000 characters']
  },
  thumbnail: {
    url: String,
    public_id: String
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: [
      'Programming',
      'Design',
      'Business',
      'Marketing',
      'Science',
      'Mathematics',
      'Language',
      'Health',
      'Music',
      'Art',
      'Photography',
      'Cooking',
      'Other'
    ]
  },
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  lessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  enrollments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  duration: {
    type: Number, // in minutes
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  requirements: [{
    type: String,
    maxlength: [200, 'Requirement cannot exceed 200 characters']
  }],
  learningOutcomes: [{
    type: String,
    maxlength: [200, 'Learning outcome cannot exceed 200 characters']
  }],
  language: {
    type: String,
    default: 'English',
    enum: ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Other']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for total lessons count
courseSchema.virtual('totalLessons').get(function() {
  return this.lessons.length;
});

// Virtual for total enrollments count
courseSchema.virtual('totalEnrollments').get(function() {
  return this.enrollments.length;
});

// Method to calculate average rating
courseSchema.methods.calculateAverageRating = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { course: this._id } },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    this.rating.average = Math.round(stats[0].averageRating * 10) / 10;
    this.rating.count = stats[0].totalReviews;
  } else {
    this.rating.average = 0;
    this.rating.count = 0;
  }

  await this.save();
};

// Method to update course duration
courseSchema.methods.updateDuration = async function() {
  const Lesson = mongoose.model('Lesson');
  const lessons = await Lesson.find({ _id: { $in: this.lessons } });
  
  this.duration = lessons.reduce((total, lesson) => {
    return total + (lesson.duration || 0);
  }, 0);

  await this.save();
};

// Index for better search performance
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ isPremium: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ 'rating.average': -1 });
courseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Course', courseSchema);