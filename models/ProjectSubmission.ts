import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface cho Project Submission
export interface IProjectSubmission extends Document {
  lessonId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  code: string;
  explanation?: string;
  status: 'submitted' | 'graded' | 'pending';
  score?: number; // percentage
  feedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Interface cho ProjectSubmission Model với static methods
interface IProjectSubmissionModel extends Model<IProjectSubmission> {
  findByLesson(lessonId: string): Promise<IProjectSubmission[]>;
  findByStudent(studentId: string): Promise<IProjectSubmission[]>;
  findByCourse(courseId: string): Promise<IProjectSubmission[]>;
  findStudentSubmission(lessonId: string, studentId: string): Promise<IProjectSubmission | null>;
}

const ProjectSubmissionSchema = new Schema<IProjectSubmission>({
  lessonId: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    required: [true, 'Lesson ID is required'],
    index: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required'],
    index: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
    index: true
  },
  code: {
    type: String,
    required: [true, 'Code/solution is required'],
    maxlength: [100000, 'Submission cannot exceed 100000 characters']
  },
  explanation: {
    type: String,
    maxlength: [10000, 'Explanation cannot exceed 10000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['submitted', 'graded', 'pending'],
      message: 'Status must be submitted, graded, or pending'
    },
    default: 'pending'
  },
  score: {
    type: Number,
    min: [0, 'Score cannot be less than 0'],
    max: [100, 'Score cannot be more than 100']
  },
  feedback: {
    type: String,
    maxlength: [5000, 'Feedback cannot exceed 5000 characters']
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  gradedAt: {
    type: Date
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Add compound index for finding student's submission for a specific lesson
ProjectSubmissionSchema.index({ lessonId: 1, studentId: 1 }, { unique: true });

// Static methods
ProjectSubmissionSchema.statics.findByLesson = function(lessonId: string) {
  return this.find({ lessonId }).populate('studentId', 'name email').sort('-submittedAt');
};

ProjectSubmissionSchema.statics.findByStudent = function(studentId: string) {
  return this.find({ studentId }).populate('lessonId', 'title').populate('courseId', 'title').sort('-submittedAt');
};

ProjectSubmissionSchema.statics.findByCourse = function(courseId: string) {
  return this.find({ courseId }).populate('studentId', 'name email').populate('lessonId', 'title').sort('-submittedAt');
};

ProjectSubmissionSchema.statics.findStudentSubmission = function(lessonId: string, studentId: string) {
  return this.findOne({ lessonId, studentId });
};

// Create or get model
const ProjectSubmission = mongoose.models.ProjectSubmission || 
  mongoose.model<IProjectSubmission, IProjectSubmissionModel>('ProjectSubmission', ProjectSubmissionSchema);

export default ProjectSubmission;
