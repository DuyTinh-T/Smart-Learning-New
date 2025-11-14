import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface cho Payment document
export interface IPayment extends Document {
  stripeSessionId: string;
  stripeCustomerId?: string;
  stripePaymentIntentId?: string;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  amount: number; // amount in cents (VD: 2000 = $20.00)
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  metadata?: {
    courseName?: string;
    customerEmail?: string;
    [key: string]: any;
  };
  stripeMetadata?: any; // Raw metadata from Stripe
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  
  // Instance methods
  markAsCompleted(): Promise<IPayment>;
  markAsFailed(): Promise<IPayment>;
}

// Interface cho Payment Model với static methods
interface IPaymentModel extends Model<IPayment> {
  findBySessionId(sessionId: string): Promise<IPayment | null>;
  findByUserId(userId: string): Promise<IPayment[]>;
  findSuccessfulPaymentsByUser(userId: string): Promise<IPayment[]>;
}

// Payment Schema
const PaymentSchema = new Schema<IPayment>({
  stripeSessionId: {
    type: String,
    required: [true, 'Stripe session ID is required'],
    unique: true
  },
  stripeCustomerId: {
    type: String,
    sparse: true // Cho phép null nhưng unique nếu có giá trị
  },
  stripePaymentIntentId: {
    type: String,
    sparse: true
  },
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
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be non-negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'usd',
    lowercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  stripeMetadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better query performance
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ courseId: 1, status: 1 });

// Static methods
PaymentSchema.statics.findBySessionId = function(sessionId: string) {
  return this.findOne({ stripeSessionId: sessionId });
};

PaymentSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId }).populate('courseId', 'title slug price').sort({ createdAt: -1 });
};

PaymentSchema.statics.findSuccessfulPaymentsByUser = function(userId: string) {
  return this.find({ userId, status: 'completed' }).populate('courseId', 'title slug price');
};

// Instance methods
PaymentSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

PaymentSchema.methods.markAsFailed = function() {
  this.status = 'failed';
  return this.save();
};

// Pre-save middleware để validate business logic
PaymentSchema.pre('save', function(next) {
  // Nếu status là completed và chưa có completedAt thì set
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Nếu status không phải completed thì clear completedAt
  if (this.status !== 'completed') {
    this.completedAt = null;
  }
  
  next();
});

// Create and export model
const Payment: IPaymentModel = (mongoose.models.Payment as IPaymentModel) || 
  mongoose.model<IPayment, IPaymentModel>('Payment', PaymentSchema);

export default Payment;