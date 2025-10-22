import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface cho User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  dailyStudyTime: number;
  enrolledCourses: mongoose.Types.ObjectId[];
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): any;
}

// Interface cho User Model với static methods
interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

const UserSchema = new Schema<IUser>({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: { 
    type: String, 
    enum: {
      values: ['admin', 'teacher', 'student'],
      message: 'Role must be admin, teacher, or student'
    }, 
    default: 'student' 
  },
  dailyStudyTime: { 
    type: Number, 
    default: 30,
    min: [0, 'Daily study time cannot be negative']
  },
  enrolledCourses: [{
    type: Schema.Types.ObjectId, 
    ref: 'Course'
  }],
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
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
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre<IUser>('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Update the updatedAt field before saving
UserSchema.pre<IUser>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to check password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find by email
UserSchema.statics.findByEmail = function(email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase() });
};

// Virtual for display name
UserSchema.virtual('displayName').get(function(this: IUser) {
  return this.name;
});

// Transform toJSON to remove sensitive data
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Ensure virtual fields are serialised
UserSchema.set('toJSON', {
  virtuals: true
});

const User: IUserModel = (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;