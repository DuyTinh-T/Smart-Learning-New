import mongoose, { Document, Schema, Model } from 'mongoose';

// Base interface for questions
export interface IBaseQuestion {
  text: string;
  type: 'multiple-choice' | 'essay';
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  _id?: mongoose.Types.ObjectId;
}

// Interface for Multiple Choice Question
export interface IMultipleChoiceQuestion extends IBaseQuestion {
  type: 'multiple-choice';
  options: string[];
  correctIndex: number;
}

// Interface for Essay Question
export interface IEssayQuestion extends IBaseQuestion {
  type: 'essay';
  maxWords: number;
  rubric?: string;
}

// Union type for all question types
export type IQuestion = IMultipleChoiceQuestion | IEssayQuestion;

// Interface cho Quiz document
export interface IQuiz extends Document {
  lessonId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  questions: IQuestion[];
  timeLimit?: number; // seconds
  passingScore: number; // percentage
  allowMultipleAttempts: boolean;
  maxAttempts?: number;
  showCorrectAnswers: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Interface cho Quiz Model với static methods
interface IQuizModel extends Model<IQuiz> {
  findByLesson(lessonId: string): Promise<IQuiz[]>;
  findActiveQuizzes(): Promise<IQuiz[]>;
}

// Schema for Question subdocument - supports both multiple choice and essay
const QuestionSchema = new Schema<IQuestion>({
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
  difficulty: {
    type: String,
    enum: {
      values: ['easy', 'medium', 'hard'],
      message: 'Difficulty must be easy, medium, or hard'
    },
    default: 'medium'
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
  },
  rubric: {
    type: String,
    maxlength: [1000, 'Rubric cannot be more than 1000 characters']
  }
});

const QuizSchema = new Schema<IQuiz>({
  lessonId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Lesson', 
    required: [true, 'Lesson ID is required']
  },
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
    type: [QuestionSchema],
    required: [true, 'Quiz must have at least one question'],
    validate: {
      validator: function(questions: IQuestion[]) {
        if (!questions || !Array.isArray(questions)) {
          return false;
        }
        return questions.length >= 1 && questions.length <= 50;
      },
      message: 'Quiz must have between 1 and 50 questions'
    }
  },
  timeLimit: {
    type: Number,
    min: [60, 'Time limit must be at least 60 seconds'],
    max: [7200, 'Time limit cannot be more than 2 hours (7200 seconds)']
  },
  passingScore: {
    type: Number,
    default: 60,
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot be more than 100']
  },
  allowMultipleAttempts: {
    type: Boolean,
    default: true
  },
  maxAttempts: {
    type: Number,
    min: [1, 'Max attempts must be at least 1'],
    max: [10, 'Max attempts cannot be more than 10']
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  shuffleOptions: {
    type: Boolean,
    default: false
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
QuizSchema.index({ lessonId: 1 });
QuizSchema.index({ createdBy: 1 });
QuizSchema.index({ isActive: 1 });
QuizSchema.index({ createdAt: -1 });

// Custom validation for question types
QuestionSchema.pre('validate', function() {
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
QuizSchema.pre<IQuiz>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find quizzes by lesson
QuizSchema.statics.findByLesson = function(lessonId: string): Promise<IQuiz[]> {
  return this.find({ lessonId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find active quizzes
QuizSchema.statics.findActiveQuizzes = function(): Promise<IQuiz[]> {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

// Virtual for total points
QuizSchema.virtual('totalPoints').get(function(this: IQuiz) {
  if (!this.questions || !Array.isArray(this.questions)) {
    return 0;
  }
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Virtual for question count
QuizSchema.virtual('questionCount').get(function(this: IQuiz) {
  if (!this.questions || !Array.isArray(this.questions)) {
    return 0;
  }
  return this.questions.length;
});

// Virtual for estimated completion time
QuizSchema.virtual('estimatedTime').get(function(this: IQuiz) {
  if (!this.questions || !Array.isArray(this.questions)) {
    return this.timeLimit || 300; // 5 minutes default
  }
  // Rough estimate: 1 minute per question + reading time
  const baseTime = this.questions.length * 60; // 1 minute per question in seconds
  return this.timeLimit || baseTime;
});

// Ensure virtual fields are serialised
QuizSchema.set('toJSON', {
  virtuals: true
});

const Quiz: IQuizModel = (mongoose.models.Quiz as IQuizModel) || mongoose.model<IQuiz, IQuizModel>('Quiz', QuizSchema);

export default Quiz;