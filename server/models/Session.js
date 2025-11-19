import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: [true, 'Original name is required'],
    trim: true
  },
  text: {
    type: String,
    required: [true, 'Extracted text is required'],
    maxlength: [5000, 'Text cannot exceed 5000 characters'] // Limit stored text
  },
  embedding: {
    type: [Number],
    required: [true, 'Embedding vector is required'],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0 && v.every(n => typeof n === 'number');
      },
      message: 'Embedding must be a non-empty array of numbers'
    }
  },
  score: {
    type: Number,
    required: true,
    min: [0, 'Score cannot be less than 0'],
    max: [100, 'Score cannot exceed 100'],
    set: v => Math.round(v * 100) / 100 // Round to 2 decimal places
  },
  similarity: {
    type: Number,
    min: 0,
    max: 1,
    set: v => Math.round(v * 1000) / 1000 // Round to 3 decimal places
  },
  keywords: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 15; // Limit number of keywords
      },
      message: 'Cannot have more than 15 keywords'
    }
  },
  fileSize: {
    type: Number,
    min: 0
  },
  processingTime: {
    type: Number, // in milliseconds
    min: 0
  },
  status: {
    type: String,
    enum: ['processed', 'failed', 'pending'],
    default: 'processed'
  },
  error: {
    type: String,
    default: null
  }
}, { 
  _id: false,
  timestamps: false 
});

const SessionSchema = new mongoose.Schema({
  jobDescription: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    minlength: [10, 'Job description must be at least 10 characters'],
    maxlength: [10000, 'Job description cannot exceed 10000 characters']
  },
  jobEmbedding: {
    type: [Number],
    required: [true, 'Job embedding is required'],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Job embedding must be a non-empty array'
    }
  },
  resumes: {
    type: [ResumeSchema],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 50; // Limit number of resumes per session
      },
      message: 'Cannot process more than 50 resumes in one session'
    }
  },
  totalFiles: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  successfulProcesses: {
    type: Number,
    required: true,
    min: 0
  },
  failedProcesses: {
    type: Number,
    default: 0,
    min: 0
  },
  processingTime: {
    type: Number, // Total processing time in milliseconds
    min: 0
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'partial'],
    default: 'completed'
  },
  sessionName: {
    type: String,
    trim: true,
    maxlength: [100, 'Session name cannot exceed 100 characters']
  },
  createdBy: {
    type: String,
    default: 'user'
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
SessionSchema.index({ createdAt: -1 });
SessionSchema.index({ 'resumes.score': -1 });
SessionSchema.index({ status: 1 });

// Virtual for success rate
SessionSchema.virtual('successRate').get(function() {
  return this.totalFiles > 0 ? (this.successfulProcesses / this.totalFiles) * 100 : 0;
});

// Instance method to get top N resumes
SessionSchema.methods.getTopResumes = function(limit = 10) {
  return this.resumes
    .filter(resume => resume.status === 'processed')
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

// Instance method to get resume by original name
SessionSchema.methods.getResumeByName = function(originalName) {
  return this.resumes.find(resume => 
    resume.originalName === originalName && resume.status === 'processed'
  );
};

// Static method to find sessions by date range
SessionSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

// Static method to get session statistics
SessionSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalResumes: { $sum: '$totalFiles' },
        avgResumesPerSession: { $avg: '$totalFiles' },
        avgSuccessRate: { $avg: { $multiply: [{ $divide: ['$successfulProcesses', '$totalFiles'] }, 100] } },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    }
  ]);
  
  return stats[0] || {
    totalSessions: 0,
    totalResumes: 0,
    avgResumesPerSession: 0,
    avgSuccessRate: 0,
    avgProcessingTime: 0
  };
};

// Middleware to calculate failed processes before save
SessionSchema.pre('save', function(next) {
  if (this.isModified('resumes') || this.isModified('totalFiles')) {
    const failedResumes = this.resumes.filter(resume => resume.status === 'failed').length;
    this.failedProcesses = failedResumes;
    this.successfulProcesses = this.resumes.length - failedResumes;
    
    // Update overall status
    if (this.failedProcesses === this.totalFiles) {
      this.status = 'failed';
    } else if (this.failedProcesses > 0) {
      this.status = 'partial';
    } else {
      this.status = 'completed';
    }
  }
  next();
});

// Transform output to include virtuals and remove sensitive fields
SessionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Remove embedding arrays from output for security and performance
    delete ret.jobEmbedding;
    ret.resumes.forEach(resume => delete resume.embedding);
    return ret;
  }
});

export default mongoose.model('Session', SessionSchema);