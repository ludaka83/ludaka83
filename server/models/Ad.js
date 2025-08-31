const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Ad title is required'],
    trim: true,
    maxlength: [100, 'Ad title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Ad description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Ad type is required'],
    enum: ['banner', 'video', 'interstitial', 'native', 'popup']
  },
  placement: {
    type: String,
    required: [true, 'Ad placement is required'],
    enum: [
      'header',
      'sidebar',
      'footer', 
      'before-video',
      'after-video',
      'mid-video',
      'between-lessons',
      'course-page',
      'home-page'
    ]
  },
  content: {
    // For banner ads
    banner: {
      image: {
        url: String,
        public_id: String
      },
      clickUrl: String,
      altText: String
    },
    // For video ads
    video: {
      url: String,
      public_id: String,
      duration: Number, // in seconds
      skipAfter: {
        type: Number,
        default: 5 // seconds
      },
      clickUrl: String
    },
    // For native ads
    native: {
      headline: String,
      description: String,
      image: {
        url: String,
        public_id: String
      },
      callToAction: String,
      clickUrl: String
    },
    // For HTML/custom ads
    html: {
      content: String,
      script: String
    }
  },
  targeting: {
    countries: [String],
    languages: [String],
    categories: [String], // Course categories
    userTypes: [{
      type: String,
      enum: ['free', 'premium', 'all']
    }],
    deviceTypes: [{
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'all']
    }],
    ageRange: {
      min: {
        type: Number,
        min: 13,
        max: 100
      },
      max: {
        type: Number,
        min: 13,
        max: 100
      }
    }
  },
  scheduling: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: Date,
    timezone: {
      type: String,
      default: 'UTC'
    },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    hoursOfDay: [{
      type: Number,
      min: 0,
      max: 23
    }]
  },
  pricing: {
    model: {
      type: String,
      enum: ['cpm', 'cpc', 'cpa', 'flat'],
      required: [true, 'Pricing model is required']
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },
    budget: {
      daily: Number,
      total: Number
    }
  },
  advertiser: {
    name: {
      type: String,
      required: [true, 'Advertiser name is required']
    },
    email: {
      type: String,
      required: [true, 'Advertiser email is required'],
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    website: String,
    logo: {
      url: String,
      public_id: String
    }
  },
  metrics: {
    impressions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    ctr: {
      type: Number,
      default: 0
    }, // Click-through rate
    cpc: {
      type: Number,
      default: 0
    }, // Cost per click
    cpm: {
      type: Number,
      default: 0
    } // Cost per mille
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'active', 'paused', 'completed', 'rejected'],
    default: 'draft'
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  isActive: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  impressionLog: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    placement: String,
    userAgent: String,
    ipAddress: String,
    country: String
  }],
  clickLog: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    placement: String,
    userAgent: String,
    ipAddress: String,
    country: String
  }]
}, {
  timestamps: true
});

// Virtual for CTR calculation
adSchema.virtual('clickThroughRate').get(function() {
  if (this.metrics.impressions === 0) return 0;
  return (this.metrics.clicks / this.metrics.impressions * 100).toFixed(2);
});

// Method to log impression
adSchema.methods.logImpression = async function(userId, placement, userAgent, ipAddress, country) {
  this.metrics.impressions += 1;
  this.impressionLog.push({
    user: userId,
    placement,
    userAgent,
    ipAddress,
    country,
    timestamp: new Date()
  });
  
  // Calculate CPM revenue
  if (this.pricing.model === 'cpm') {
    this.metrics.revenue += this.pricing.rate / 1000;
  }
  
  await this.save();
};

// Method to log click
adSchema.methods.logClick = async function(userId, placement, userAgent, ipAddress, country) {
  this.metrics.clicks += 1;
  this.clickLog.push({
    user: userId,
    placement,
    userAgent,
    ipAddress,
    country,
    timestamp: new Date()
  });
  
  // Calculate CPC revenue
  if (this.pricing.model === 'cpc') {
    this.metrics.revenue += this.pricing.rate;
  }
  
  // Update CTR
  this.metrics.ctr = this.clickThroughRate;
  
  await this.save();
};

// Method to check if ad should be shown
adSchema.methods.shouldShow = function(user, placement, country, deviceType) {
  // Check if ad is active
  if (!this.isActive || this.status !== 'active') return false;
  
  // Check date range
  const now = new Date();
  if (this.scheduling.startDate > now) return false;
  if (this.scheduling.endDate && this.scheduling.endDate < now) return false;
  
  // Check placement
  if (this.placement !== placement) return false;
  
  // Check targeting
  const targeting = this.targeting;
  
  // Country targeting
  if (targeting.countries && targeting.countries.length > 0) {
    if (!targeting.countries.includes(country)) return false;
  }
  
  // User type targeting
  if (targeting.userTypes && targeting.userTypes.length > 0) {
    const userType = user?.subscription?.type || 'free';
    if (!targeting.userTypes.includes(userType) && !targeting.userTypes.includes('all')) {
      return false;
    }
  }
  
  // Device type targeting
  if (targeting.deviceTypes && targeting.deviceTypes.length > 0) {
    if (!targeting.deviceTypes.includes(deviceType) && !targeting.deviceTypes.includes('all')) {
      return false;
    }
  }
  
  // Budget check
  if (this.pricing.budget) {
    if (this.pricing.budget.total && this.metrics.revenue >= this.pricing.budget.total) {
      return false;
    }
    
    // Daily budget check would require more complex logic with date grouping
  }
  
  return true;
};

// Static method to get ads for placement
adSchema.statics.getAdsForPlacement = function(placement, user, country, deviceType, limit = 5) {
  return this.find({
    placement,
    isActive: true,
    status: 'active',
    'scheduling.startDate': { $lte: new Date() },
    $or: [
      { 'scheduling.endDate': { $exists: false } },
      { 'scheduling.endDate': { $gte: new Date() } }
    ]
  })
  .sort({ priority: -1, createdAt: -1 })
  .limit(limit)
  .then(ads => {
    return ads.filter(ad => ad.shouldShow(user, placement, country, deviceType));
  });
};

// Index for better query performance
adSchema.index({ placement: 1, isActive: 1, status: 1 });
adSchema.index({ 'scheduling.startDate': 1, 'scheduling.endDate': 1 });
adSchema.index({ priority: -1 });
adSchema.index({ 'targeting.countries': 1 });
adSchema.index({ 'targeting.userTypes': 1 });
adSchema.index({ advertiser: 1 });

module.exports = mongoose.model('Ad', adSchema);