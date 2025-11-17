import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for Exam Question (simplified for exam rooms)
export interface IExamQuestion {
  text: string;
  type: 'multiple-choice' | 'essay';
  points: number;
  options?: string[]; // For multiple choice
  correctIndex?: number; // For multiple choice
  maxWords?: number; // For essay
  explanation?: string;
  _id?: mongoose.Types.ObjectId;
}

// Interface for ExamQuiz document
export interface IExamQuiz extends Document {
  title: string;
  description?: string;
  questions: IExamQuestion[];
  timeLimit?: number; // seconds
  passingScore: number; // percentage
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId; // Teacher who created this quiz
  createdAt: Date;
  updatedAt: Date;
}

// Interface for ExamQuiz Model with static methods
interface IExamQuizModel extends Model<IExamQuiz> {
  findByTeacher(teacherId: string): Promise<IExamQuiz[]>;
  findActiveQuizzes(): Promise<IExamQuiz[]>;
}

// Schema for ExamQuestion subdocument
const ExamQuestionSchema = new Schema<IExamQuestion>({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [1000, 'Question text cannot be more than 1000 characters']
  },
  type: {
    type: String,
    enum: {
      values: ['multiple-choice', 'essay'],
      message: 'Question type must be multiple-choice or essay'
    },
    required: [true, 'Question type is required']
  },
  points: {
    type: Number,
    default: 1,
    min: [0.1, 'Points must be at least 0.1'],
    max: [10, 'Points cannot be more than 10']
  },
  explanation: {
    type: String,
    maxlength: [500, 'Explanation cannot be more than 500 characters']
  },
  // Multiple choice specific fields
  options: {
    type: [String],
    default: undefined
  },
  correctIndex: {
    type: Number,
    default: undefined
  },
  // Essay specific fields
  maxWords: {
    type: Number,
    default: undefined,
    min: [1, 'Max words must be at least 1'],
    max: [5000, 'Max words cannot exceed 5000']
  }
});

const ExamQuizSchema = new Schema<IExamQuiz>({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  questions: {
    type: [ExamQuestionSchema],
    required: [true, 'Quiz must have at least one question'],
    validate: {
      validator: function(questions: IExamQuestion[]) {
        if (!questions || !Array.isArray(questions)) {
          return false;
        }
        return questions.length >= 1 && questions.length <= 100;
      },
      message: 'Quiz must have between 1 and 100 questions'
    }
  },
  timeLimit: {
    type: Number,
    min: [5, 'Time limit must be at least 5 seconds'],
    max: [7200, 'Time limit cannot be more than 2 hours (7200 seconds)']
  },
  passingScore: {
    type: Number,
    default: 60,
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot be more than 100']
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  shuffleOptions: {
    type: Boolean,
    default: false
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Quiz creator is required']
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
ExamQuizSchema.index({ createdBy: 1 });
ExamQuizSchema.index({ isActive: 1 });
ExamQuizSchema.index({ createdAt: -1 });

// Custom validation for question types
ExamQuestionSchema.pre('validate', function() {
  const question = this as any;
  
  if (question.type === 'multiple-choice') {
    // Ensure options exists and is an array
    if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
      throw new Error('Multiple choice questions must have at least 2 options');
    }
    // Check correctIndex with safe array access
    if (question.correctIndex === undefined || question.correctIndex < 0 || question.correctIndex >= question.options.length) {
      throw new Error('Multiple choice questions must have a valid correct answer index');
    }
  }
  
  if (question.type === 'essay') {
    if (!question.maxWords || question.maxWords <= 0) {
      throw new Error('Essay questions must have a positive max word count');
    }
  }
});

// Update the updatedAt field before saving
ExamQuizSchema.pre<IExamQuiz>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find quizzes by teacher
ExamQuizSchema.statics.findByTeacher = function(teacherId: string): Promise<IExamQuiz[]> {
  return this.find({ createdBy: teacherId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find active quizzes
ExamQuizSchema.statics.findActiveQuizzes = function(): Promise<IExamQuiz[]> {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

// Virtual for total points
ExamQuizSchema.virtual('totalPoints').get(function(this: IExamQuiz) {
  if (!this.questions || !Array.isArray(this.questions)) {
    return 0;
  }
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Virtual for question count
ExamQuizSchema.virtual('questionCount').get(function(this: IExamQuiz) {
  if (!this.questions || !Array.isArray(this.questions)) {
    return 0;
  }
  return this.questions.length;
});

// Virtual for estimated completion time
ExamQuizSchema.virtual('estimatedTime').get(function(this: IExamQuiz) {
  if (!this.questions || !Array.isArray(this.questions)) {
    return this.timeLimit || 300; // 5 minutes default
  }
  // Rough estimate: 1 minute per question + reading time
  const baseTime = this.questions.length * 60; // 1 minute per question in seconds
  return this.timeLimit || baseTime;
});

// Ensure virtual fields are serialised
ExamQuizSchema.set('toJSON', {
  virtuals: true
});

const ExamQuiz: IExamQuizModel = (mongoose.models.ExamQuiz as IExamQuizModel) || mongoose.model<IExamQuiz, IExamQuizModel>('ExamQuiz', ExamQuizSchema);

export default ExamQuiz;