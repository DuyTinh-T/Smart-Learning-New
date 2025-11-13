import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface cho Lesson document
export interface ILesson extends Document {
  title: string;
  type: 'text' | 'video' | 'quiz' | 'project';
  content?: string;
  videoUrl?: string;
  resources: string[];
  duration?: number; // minutes
  courseId: mongoose.Types.ObjectId;
  moduleId?: mongoose.Types.ObjectId;
  order: number;
  isActive: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: mongoose.Types.ObjectId[];
  completionCriteria?: {
    minTimeSpent?: number; // minutes
    requiredScore?: number; // percentage
    mustCompleteQuiz?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Interface cho Lesson Model với static methods
interface ILessonModel extends Model<ILesson> {
  findByCourse(courseId: string): Promise<ILesson[]>;
  findByModule(moduleId: string): Promise<ILesson[]>;
}

const LessonSchema = new Schema<ILesson>({
  title: { 
    type: String, 
    required: [true, 'Lesson title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  type: { 
    type: String, 
    enum: {
      values: ['text', 'video', 'quiz', 'project'],
      message: 'Type must be text, video, quiz, or project'
    }, 
    default: 'text' 
  },
  content: {
    type: String,
    maxlength: [50000, 'Content cannot be more than 50000 characters']
  },
  videoUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        // Basic URL validation
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Video URL must be a valid URL starting with http or https'
    }
  },
  resources: {
    type: [String],
    default: [],
    validate: {
      validator: function(resources: string[]) {
        return resources.length <= 20;
      },
      message: 'Cannot have more than 20 resources'
    }
  },
  duration: {
    type: Number,
    min: [1, 'Duration must be at least 1 minute'],
    max: [480, 'Duration cannot be more than 8 hours (480 minutes)']
  },
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course',
    required: [true, 'Course ID is required'],
    index: true
  },
  moduleId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  order: {
    type: Number,
    required: [true, 'Lesson order is required'],
    min: [1, 'Order must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  difficulty: {
    type: String,
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: 'Difficulty must be beginner, intermediate, or advanced'
    },
    default: 'beginner'
  },
  prerequisites: [{
    type: Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  completionCriteria: {
    minTimeSpent: {
      type: Number,
      min: [0, 'Min time spent cannot be negative']
    },
    requiredScore: {
      type: Number,
      min: [0, 'Required score cannot be negative'],
      max: [100, 'Required score cannot be more than 100']
    },
    mustCompleteQuiz: {
      type: Boolean,
      default: false
    }
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

// Indexes for performance
LessonSchema.index({ courseId: 1, order: 1 });
LessonSchema.index({ moduleId: 1, order: 1 });
LessonSchema.index({ type: 1 });
LessonSchema.index({ difficulty: 1 });
LessonSchema.index({ isActive: 1 });
LessonSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
LessonSchema.pre<ILesson>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find lessons by course
LessonSchema.statics.findByCourse = function(courseId: string): Promise<ILesson[]> {
  return this.find({ courseId, isActive: true }).sort({ order: 1 });
};

// Static method to find lessons by module
LessonSchema.statics.findByModule = function(moduleId: string): Promise<ILesson[]> {
  return this.find({ moduleId, isActive: true }).sort({ order: 1 });
};

// Virtual for estimated reading time (for text lessons)
LessonSchema.virtual('estimatedReadingTime').get(function(this: ILesson) {
  if (this.type === 'text' && this.content) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
  return this.duration || 0;
});

// Virtual for resource count
LessonSchema.virtual('resourceCount').get(function(this: ILesson) {
  if (!this.resources || !Array.isArray(this.resources)) {
    return 0;
  }
  return this.resources.length;
});

// Ensure virtual fields are serialised
LessonSchema.set('toJSON', {
  virtuals: true
});

const Lesson: ILessonModel = (mongoose.models.Lesson as ILessonModel) || mongoose.model<ILesson, ILessonModel>('Lesson', LessonSchema);

export default Lesson;