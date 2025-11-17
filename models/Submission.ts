import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  answer: string | number; // string for essay, number for multiple choice index
  isCorrect?: boolean;
  points?: number;
  timeTaken?: number; // seconds spent on this question
}

export interface ISubmission extends Document {
  roomId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  answers: IAnswer[];
  score: number;
  totalPoints: number;
  percentage: number;
  startedAt: Date;
  submittedAt: Date;
  timeSpent: number; // total time in seconds
  status: 'in-progress' | 'submitted' | 'auto-submitted' | 'graded';
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ISubmissionModel extends Model<ISubmission> {
  findByRoom(roomId: string): Promise<ISubmission[]>;
  findByStudent(studentId: string): Promise<ISubmission[]>;
  getRoomStatistics(roomId: string): Promise<any>;
}

const AnswerSchema = new Schema<IAnswer>({
  questionId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Question ID is required']
  },
  answer: {
    type: Schema.Types.Mixed,
    required: [true, 'Answer is required']
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  timeTaken: {
    type: Number,
    default: 0,
    min: [0, 'Time taken cannot be negative']
  }
});

const SubmissionSchema = new Schema<ISubmission>({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room ID is required']
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'ExamQuiz',
    required: [true, 'Quiz reference is required']
  },
  answers: [AnswerSchema],
  score: {
    type: Number,
    default: 0,
    min: [0, 'Score cannot be negative']
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: [0, 'Total points cannot be negative']
  },
  percentage: {
    type: Number,
    default: 0,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot be more than 100']
  },
  startedAt: {
    type: Date,
    required: [true, 'Started time is required']
  },
  submittedAt: {
    type: Date
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['in-progress', 'submitted', 'auto-submitted', 'graded'],
      message: 'Status must be in-progress, submitted, auto-submitted, or graded'
    },
    default: 'in-progress'
  },
  feedback: {
    type: String,
    maxlength: [2000, 'Feedback cannot be more than 2000 characters']
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
SubmissionSchema.index({ roomId: 1 });
SubmissionSchema.index({ studentId: 1 });
SubmissionSchema.index({ quizId: 1 });
SubmissionSchema.index({ roomId: 1, studentId: 1 }, { unique: true }); // One submission per student per room
SubmissionSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
SubmissionSchema.pre<ISubmission>('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate percentage if not set
  if (this.totalPoints > 0) {
    this.percentage = Math.round((this.score / this.totalPoints) * 100);
  }
  
  // Set submitted time if submitting
  if (this.status === 'submitted' || this.status === 'auto-submitted') {
    if (!this.submittedAt) {
      this.submittedAt = new Date();
    }
    // Calculate time spent if not set
    if (!this.timeSpent && this.startedAt) {
      this.timeSpent = Math.floor((this.submittedAt.getTime() - this.startedAt.getTime()) / 1000);
    }
  }
  
  next();
});

// Static method to find submissions by room
SubmissionSchema.statics.findByRoom = function(roomId: string): Promise<ISubmission[]> {
  return this.find({ roomId })
    .populate('studentId', 'name email')
    .sort({ submittedAt: -1, createdAt: -1 });
};

// Static method to find submissions by student
SubmissionSchema.statics.findByStudent = function(studentId: string): Promise<ISubmission[]> {
  return this.find({ studentId })
    .populate('roomId')
    .populate('quizId', 'title')
    .sort({ createdAt: -1 });
};

// Static method to get room statistics
SubmissionSchema.statics.getRoomStatistics = function(roomId: string) {
  return this.aggregate([
    { $match: { roomId: new mongoose.Types.ObjectId(roomId) } },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        completedSubmissions: {
          $sum: {
            $cond: [
              { $in: ['$status', ['submitted', 'auto-submitted', 'graded']] },
              1,
              0
            ]
          }
        },
        averageScore: { $avg: '$score' },
        averagePercentage: { $avg: '$percentage' },
        averageTimeSpent: { $avg: '$timeSpent' },
        highestScore: { $max: '$score' },
        lowestScore: { $min: '$score' },
        submissions: { $push: '$$ROOT' }
      }
    },
    {
      $project: {
        _id: 0,
        totalSubmissions: 1,
        completedSubmissions: 1,
        inProgressSubmissions: { 
          $subtract: ['$totalSubmissions', '$completedSubmissions'] 
        },
        averageScore: { $round: ['$averageScore', 2] },
        averagePercentage: { $round: ['$averagePercentage', 2] },
        averageTimeSpent: { $round: ['$averageTimeSpent', 0] },
        highestScore: 1,
        lowestScore: 1,
        submissions: 1
      }
    }
  ]);
};

// Virtual for is completed
SubmissionSchema.virtual('isCompleted').get(function(this: ISubmission) {
  return ['submitted', 'auto-submitted', 'graded'].includes(this.status);
});

// Virtual for grade letter (A, B, C, D, F)
SubmissionSchema.virtual('gradeLetter').get(function(this: ISubmission) {
  if (this.percentage >= 90) return 'A';
  if (this.percentage >= 80) return 'B';
  if (this.percentage >= 70) return 'C';
  if (this.percentage >= 60) return 'D';
  return 'F';
});

// Virtual for formatted time spent
SubmissionSchema.virtual('formattedTimeSpent').get(function(this: ISubmission) {
  const minutes = Math.floor(this.timeSpent / 60);
  const seconds = this.timeSpent % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Ensure virtual fields are serialised
SubmissionSchema.set('toJSON', {
  virtuals: true
});

const Submission: ISubmissionModel = (mongoose.models.Submission as ISubmissionModel) || mongoose.model<ISubmission, ISubmissionModel>('Submission', SubmissionSchema);

export default Submission;