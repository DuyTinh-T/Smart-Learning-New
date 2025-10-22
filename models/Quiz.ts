import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface cho Question subdocument
export interface IQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  _id?: mongoose.Types.ObjectId;
}

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

// Schema cho Question subdocument
const QuestionSchema = new Schema<IQuestion>({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [1000, 'Question text cannot be more than 1000 characters']
  },
  options: {
    type: [String],
    required: [true, 'Question options are required'],
    validate: {
      validator: function(options: string[]) {
        return options.length >= 2 && options.length <= 6;
      },
      message: 'Question must have between 2 and 6 options'
    }
  },
  correctIndex: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: [0, 'Correct index cannot be negative']
  },
  explanation: {
    type: String,
    maxlength: [500, 'Explanation cannot be more than 500 characters']
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

// Validate correctIndex against options length
QuestionSchema.pre('validate', function() {
  if (this.correctIndex >= this.options.length) {
    throw new Error('Correct index must be less than the number of options');
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
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Virtual for question count
QuizSchema.virtual('questionCount').get(function(this: IQuiz) {
  return this.questions.length;
});

// Virtual for estimated completion time
QuizSchema.virtual('estimatedTime').get(function(this: IQuiz) {
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