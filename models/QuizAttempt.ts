import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface cho QuizAttempt document
export interface IQuizAttempt extends Document {
  quizId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  answers: number[];
  score: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  timeSpent: number; // seconds
  startedAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
  isPassed: boolean;
  attemptNumber: number;
  detailedResults: Array<{
    questionId: mongoose.Types.ObjectId;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    points: number;
    timeSpent?: number;
  }>;
  createdAt: Date;
}

// Interface cho QuizAttempt Model với static methods
interface IQuizAttemptModel extends Model<IQuizAttempt> {
  findByUser(userId: string): Promise<IQuizAttempt[]>;
  findByQuiz(quizId: string): Promise<IQuizAttempt[]>;
  getUserAttemptCount(userId: string, quizId: string): Promise<number>;
  getBestScore(userId: string, quizId: string): Promise<IQuizAttempt | null>;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>({
  quizId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: [true, 'Quiz ID is required'],
    index: true
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required'],
    index: true
  },
  answers: {
    type: [Number],
    required: [true, 'Answers are required']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative']
  },
  percentage: {
    type: Number,
    required: [true, 'Percentage is required'],
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot be more than 100']
  },
  correctCount: {
    type: Number,
    required: [true, 'Correct count is required'],
    min: [0, 'Correct count cannot be negative']
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Total questions is required'],
    min: [1, 'Total questions must be at least 1']
  },
  timeSpent: {
    type: Number,
    required: [true, 'Time spent is required'],
    min: [0, 'Time spent cannot be negative']
  },
  startedAt: {
    type: Date,
    required: [true, 'Started at is required'],
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  attemptNumber: {
    type: Number,
    required: [true, 'Attempt number is required'],
    min: [1, 'Attempt number must be at least 1']
  },
  detailedResults: [{
    questionId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    selectedAnswer: {
      type: Number,
      required: true
    },
    correctAnswer: {
      type: Number,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    points: {
      type: Number,
      required: true,
      min: [0, 'Points cannot be negative']
    },
    timeSpent: {
      type: Number,
      min: [0, 'Time spent cannot be negative']
    }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound indexes for performance
QuizAttemptSchema.index({ userId: 1, quizId: 1 });
QuizAttemptSchema.index({ quizId: 1, createdAt: -1 });
QuizAttemptSchema.index({ userId: 1, createdAt: -1 });
QuizAttemptSchema.index({ userId: 1, quizId: 1, attemptNumber: 1 }, { unique: true });

// Pre-save middleware to set completion data
QuizAttemptSchema.pre<IQuizAttempt>('save', function(next) {
  if (this.isModified('isCompleted') && this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Static method to find attempts by user
QuizAttemptSchema.statics.findByUser = function(userId: string): Promise<IQuizAttempt[]> {
  return this.find({ userId }).sort({ createdAt: -1 }).populate('quizId', 'title lessonId');
};

// Static method to find attempts by quiz
QuizAttemptSchema.statics.findByQuiz = function(quizId: string): Promise<IQuizAttempt[]> {
  return this.find({ quizId }).sort({ createdAt: -1 }).populate('userId', 'name email');
};

// Static method to get user attempt count for a quiz
QuizAttemptSchema.statics.getUserAttemptCount = function(userId: string, quizId: string): Promise<number> {
  return this.countDocuments({ userId, quizId });
};

// Static method to get best score for a user on a quiz
QuizAttemptSchema.statics.getBestScore = function(userId: string, quizId: string): Promise<IQuizAttempt | null> {
  return this.findOne({ userId, quizId, isCompleted: true }).sort({ percentage: -1, createdAt: -1 });
};

// Virtual for grade letter
QuizAttemptSchema.virtual('gradeLetter').get(function(this: IQuizAttempt) {
  if (this.percentage >= 90) return 'A';
  if (this.percentage >= 80) return 'B';
  if (this.percentage >= 70) return 'C';
  if (this.percentage >= 60) return 'D';
  return 'F';
});

// Virtual for duration in minutes
QuizAttemptSchema.virtual('durationMinutes').get(function(this: IQuizAttempt) {
  return Math.round(this.timeSpent / 60);
});

// Virtual for accuracy percentage
QuizAttemptSchema.virtual('accuracy').get(function(this: IQuizAttempt) {
  return this.totalQuestions > 0 ? Math.round((this.correctCount / this.totalQuestions) * 100) : 0;
});

// Ensure virtual fields are serialised
QuizAttemptSchema.set('toJSON', {
  virtuals: true
});

const QuizAttempt: IQuizAttemptModel = (mongoose.models.QuizAttempt as IQuizAttemptModel) || mongoose.model<IQuizAttempt, IQuizAttemptModel>('QuizAttempt', QuizAttemptSchema);

export default QuizAttempt;