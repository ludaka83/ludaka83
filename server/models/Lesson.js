const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
    maxlength: [100, 'Lesson title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Lesson description cannot exceed 500 characters']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  order: {
    type: Number,
    required: [true, 'Lesson order is required'],
    min: 1
  },
  type: {
    type: String,
    required: [true, 'Lesson type is required'],
    enum: ['video', 'text', 'presentation', 'quiz', 'assignment']
  },
  content: {
    // For video lessons
    video: {
      url: String,
      public_id: String,
      duration: Number, // in seconds
      thumbnail: {
        url: String,
        public_id: String
      }
    },
    // For text/notes content
    text: {
      content: String,
      format: {
        type: String,
        enum: ['markdown', 'html', 'plain'],
        default: 'markdown'
      }
    },
    // For presentation content
    presentation: {
      url: String,
      public_id: String,
      slides: [{
        order: Number,
        title: String,
        content: String,
        image: {
          url: String,
          public_id: String
        }
      }]
    },
    // For quiz content
    quiz: {
      questions: [{
        question: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['multiple-choice', 'true-false', 'short-answer'],
          required: true
        },
        options: [String], // For multiple choice
        correctAnswer: {
          type: mongoose.Schema.Types.Mixed,
          required: true
        },
        explanation: String,
        points: {
          type: Number,
          default: 1
        }
      }],
      passingScore: {
        type: Number,
        default: 70
      },
      timeLimit: Number // in minutes
    },
    // For assignment content
    assignment: {
      instructions: String,
      submissionType: {
        type: String,
        enum: ['file', 'text', 'url'],
        default: 'text'
      },
      maxFileSize: {
        type: Number,
        default: 10 // MB
      },
      allowedFileTypes: [String],
      dueDate: Date,
      maxPoints: {
        type: Number,
        default: 100
      }
    }
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  resources: [{
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['pdf', 'doc', 'link', 'image', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    public_id: String,
    size: Number // in bytes
  }],
  notes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    timestamp: {
      type: Number, // video timestamp in seconds
      default: 0
    },
    isPrivate: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  completions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    score: Number // for quizzes/assignments
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date
}, {
  timestamps: true
});

// Virtual for completion rate
lessonSchema.virtual('completionRate').get(function() {
  if (!this.completions || this.completions.length === 0) return 0;
  // This would need the total enrolled users in the course to calculate properly
  return this.completions.length;
});

// Method to mark lesson as completed by user
lessonSchema.methods.markCompleted = async function(userId, timeSpent = 0, score = null) {
  const existingCompletion = this.completions.find(
    completion => completion.user.toString() === userId.toString()
  );

  if (!existingCompletion) {
    this.completions.push({
      user: userId,
      timeSpent,
      score,
      completedAt: new Date()
    });
    await this.save();
  }

  return this;
};

// Method to add user note
lessonSchema.methods.addNote = async function(userId, content, timestamp = 0, isPrivate = true) {
  this.notes.push({
    user: userId,
    content,
    timestamp,
    isPrivate,
    createdAt: new Date()
  });

  await this.save();
  return this;
};

// Static method to get lesson with user progress
lessonSchema.statics.findWithProgress = function(lessonId, userId) {
  return this.findById(lessonId)
    .populate('course', 'title')
    .lean()
    .then(lesson => {
      if (!lesson) return null;
      
      const userCompletion = lesson.completions.find(
        completion => completion.user.toString() === userId.toString()
      );
      
      const userNotes = lesson.notes.filter(
        note => note.user.toString() === userId.toString()
      );

      return {
        ...lesson,
        isCompleted: !!userCompletion,
        completedAt: userCompletion?.completedAt,
        userScore: userCompletion?.score,
        userNotes
      };
    });
};

// Index for better query performance
lessonSchema.index({ course: 1, order: 1 });
lessonSchema.index({ type: 1 });
lessonSchema.index({ isPublished: 1 });
lessonSchema.index({ 'completions.user': 1 });
lessonSchema.index({ 'notes.user': 1 });

module.exports = mongoose.model('Lesson', lessonSchema);