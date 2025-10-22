import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface cho Progress document
export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  status: 'not-started' | 'in-progress' | 'completed';
  timeSpent: number; // minutes
  score?: number;
  completionPercentage: number;
  lastAccessedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  streakCount: number;
  notes?: string;
  bookmarked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface cho Progress Model với static methods
interface IProgressModel extends Model<IProgress> {
  findUserProgress(userId: string): Promise<IProgress[]>;
  findCourseProgress(userId: string, courseId: string): Promise<IProgress[]>;
  getUserCourseStats(userId: string, courseId: string): Promise<{
    totalLessons: number;
    completedLessons: number;
    inProgressLessons: number;
    totalTimeSpent: number;
    completionPercentage: number;
  }>;
  updateProgress(
    userId: string, 
    lessonId: string, 
    status: string, 
    timeSpent: number,
    score?: number
  ): Promise<IProgress>;
}

const ProgressSchema = new Schema<IProgress>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course',
    required: [true, 'Course ID is required'],
    index: true
  },
  lessonId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Lesson',
    required: [true, 'Lesson ID is required'],
    index: true
  },
  status: { 
    type: String, 
    enum: {
      values: ['not-started', 'in-progress', 'completed'],
      message: 'Status must be not-started, in-progress, or completed'
    }, 
    default: 'not-started' 
  },
  timeSpent: { 
    type: Number, 
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  score: {
    type: Number,
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot be more than 100']
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Completion percentage cannot be negative'],
    max: [100, 'Completion percentage cannot be more than 100']
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  streakCount: {
    type: Number,
    default: 0,
    min: [0, 'Streak count cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  bookmarked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound indexes for performance
ProgressSchema.index({ userId: 1, courseId: 1 });
ProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
ProgressSchema.index({ courseId: 1, status: 1 });
ProgressSchema.index({ status: 1, updatedAt: -1 });
ProgressSchema.index({ lastAccessedAt: -1 });

// Pre-save middleware to handle status changes
ProgressSchema.pre<IProgress>('save', function(next) {
  const now = new Date();
  this.updatedAt = now;
  this.lastAccessedAt = now;

  // Set startedAt when status changes from not-started
  if (this.isModified('status')) {
    if (this.status === 'in-progress' && !this.startedAt) {
      this.startedAt = now;
    } else if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = now;
      this.completionPercentage = 100;
    }
  }

  // Update completion percentage based on status
  if (this.status === 'completed') {
    this.completionPercentage = 100;
  } else if (this.status === 'not-started') {
    this.completionPercentage = 0;
  }

  next();
});

// Static method to find user's progress across all courses
ProgressSchema.statics.findUserProgress = function(userId: string): Promise<IProgress[]> {
  return this.find({ userId })
    .populate('courseId', 'title thumbnail')
    .populate('lessonId', 'title type duration')
    .sort({ updatedAt: -1 });
};

// Static method to find progress for a specific course
ProgressSchema.statics.findCourseProgress = function(userId: string, courseId: string): Promise<IProgress[]> {
  return this.find({ userId, courseId })
    .populate('lessonId', 'title type duration order')
    .sort({ 'lessonId.order': 1 });
};

// Static method to get course statistics for a user
ProgressSchema.statics.getUserCourseStats = async function(userId: string, courseId: string) {
  const pipeline = [
    { $match: { userId: new mongoose.Types.ObjectId(userId), courseId: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        totalLessons: { $sum: 1 },
        completedLessons: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgressLessons: {
          $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
        },
        totalTimeSpent: { $sum: '$timeSpent' },
        averageCompletion: { $avg: '$completionPercentage' }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  if (result.length === 0) {
    return {
      totalLessons: 0,
      completedLessons: 0,
      inProgressLessons: 0,
      totalTimeSpent: 0,
      completionPercentage: 0
    };
  }

  const stats = result[0];
  return {
    totalLessons: stats.totalLessons,
    completedLessons: stats.completedLessons,
    inProgressLessons: stats.inProgressLessons,
    totalTimeSpent: stats.totalTimeSpent,
    completionPercentage: Math.round(stats.averageCompletion || 0)
  };
};

// Static method to update or create progress
ProgressSchema.statics.updateProgress = async function(
  userId: string, 
  lessonId: string, 
  status: string, 
  timeSpent: number,
  score?: number
): Promise<IProgress> {
  const lesson = await mongoose.model('Lesson').findById(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  const updateData: any = {
    status,
    $inc: { timeSpent },
    lastAccessedAt: new Date()
  };

  if (score !== undefined) {
    updateData.score = score;
  }

  const progress = await this.findOneAndUpdate(
    { userId, lessonId },
    {
      ...updateData,
      courseId: lesson.courseId,
    },
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  return progress;
};

// Virtual for formatted time spent
ProgressSchema.virtual('formattedTimeSpent').get(function(this: IProgress) {
  const hours = Math.floor(this.timeSpent / 60);
  const minutes = this.timeSpent % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for days since last access
ProgressSchema.virtual('daysSinceLastAccess').get(function(this: IProgress) {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.lastAccessedAt.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Ensure virtual fields are serialised
ProgressSchema.set('toJSON', {
  virtuals: true
});

const Progress: IProgressModel = (mongoose.models.Progress as IProgressModel) || mongoose.model<IProgress, IProgressModel>('Progress', ProgressSchema);

export default Progress;