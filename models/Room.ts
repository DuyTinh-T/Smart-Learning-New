import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IRoom extends Document {
  teacherId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  examQuizId: mongoose.Types.ObjectId;
  roomCode: string; // unique room code for students to join
  status: 'waiting' | 'running' | 'ended';
  startTime?: Date;
  endTime?: Date;
  duration: number; // duration in minutes
  allowedStudents?: mongoose.Types.ObjectId[]; // optional: specific students allowed
  maxStudents?: number; // optional: limit number of students
  settings: {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showCorrectAnswers: boolean;
    allowReview: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface IRoomModel extends Model<IRoom> {
  findByCode(roomCode: string): Promise<IRoom | null>;
  findByTeacher(teacherId: string): Promise<IRoom[]>;
  generateRoomCode(): string;
}

const RoomSchema = new Schema<IRoom>({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  title: {
    type: String,
    required: [true, 'Room title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  examQuizId: {
    type: Schema.Types.ObjectId,
    ref: 'ExamQuiz',
    required: [true, 'Exam quiz is required']
  },
  roomCode: {
    type: String,
    required: true,
    uppercase: true,
    length: 6
  },
  status: {
    type: String,
    enum: {
      values: ['waiting', 'running', 'ended'],
      message: 'Status must be waiting, running, or ended'
    },
    default: 'waiting'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [180, 'Duration cannot be more than 3 hours (180 minutes)']
  },
  allowedStudents: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxStudents: {
    type: Number,
    min: [1, 'Max students must be at least 1'],
    max: [500, 'Max students cannot be more than 500']
  },
  settings: {
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
    allowReview: {
      type: Boolean,
      default: true
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
RoomSchema.index({ roomCode: 1 }, { unique: true });
RoomSchema.index({ teacherId: 1 });
RoomSchema.index({ status: 1 });
RoomSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
RoomSchema.pre<IRoom>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find room by code
RoomSchema.statics.findByCode = function(roomCode: string): Promise<IRoom | null> {
  return this.findOne({ roomCode: roomCode.toUpperCase() })
    .populate('examQuizId')
    .populate('teacherId', 'name email');
};

// Static method to find rooms by teacher
RoomSchema.statics.findByTeacher = function(teacherId: string): Promise<IRoom[]> {
  return this.find({ teacherId }).sort({ createdAt: -1 })
    .populate('examQuizId', 'title questions')
    .populate('teacherId', 'name email');
};

// Static method to generate unique room code
RoomSchema.statics.generateRoomCode = function(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Virtual for room URL
RoomSchema.virtual('roomUrl').get(function(this: IRoom) {
  return `/student/room/${this.roomCode}`;
});

// Virtual for is active
RoomSchema.virtual('isActive').get(function(this: IRoom) {
  return this.status !== 'ended';
});

// Virtual for time remaining (if running)
RoomSchema.virtual('timeRemaining').get(function(this: IRoom) {
  if (this.status !== 'running' || !this.startTime) {
    return null;
  }
  const elapsed = Date.now() - this.startTime.getTime();
  const durationMs = this.duration * 60 * 1000; // convert minutes to ms
  const remaining = Math.max(0, durationMs - elapsed);
  return Math.floor(remaining / 1000); // return seconds
});

// Ensure virtual fields are serialised
RoomSchema.set('toJSON', {
  virtuals: true
});

const Room: IRoomModel = (mongoose.models.Room as IRoomModel) || mongoose.model<IRoom, IRoomModel>('Room', RoomSchema);

export default Room;