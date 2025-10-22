import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface cho Notification document
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'reminder' | 'system' | 'ai' | 'achievement' | 'course_update' | 'quiz_grade';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  delivered: boolean;
  deliveredAt?: Date;
  pushSent: boolean;
  pushSentAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
  relatedId?: mongoose.Types.ObjectId;
  relatedModel?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface cho Notification Model với static methods
interface INotificationModel extends Model<INotification> {
  findUserNotifications(userId: string, limit?: number): Promise<INotification[]>;
  markAsRead(userId: string, notificationId?: string): Promise<void>;
  createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    options?: Partial<INotification>
  ): Promise<INotification>;
  getUnreadCount(userId: string): Promise<number>;
  bulkCreate(notifications: Partial<INotification>[]): Promise<INotification[]>;
  cleanupExpired(): Promise<void>;
}

const NotificationSchema = new Schema<INotification>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  type: { 
    type: String, 
    enum: {
      values: ['reminder', 'system', 'ai', 'achievement', 'course_update', 'quiz_grade'],
      message: 'Type must be one of: reminder, system, ai, achievement, course_update, quiz_grade'
    }, 
    default: 'system',
    index: true
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'normal', 'high', 'urgent'],
      message: 'Priority must be low, normal, high, or urgent'
    },
    default: 'normal',
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category cannot be more than 50 characters'],
    index: true
  },
  actionUrl: {
    type: String,
    maxlength: [500, 'Action URL cannot be more than 500 characters']
  },
  actionText: {
    type: String,
    maxlength: [50, 'Action text cannot be more than 50 characters']
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  read: { 
    type: Boolean, 
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  pushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: {
    type: Date
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  scheduledFor: {
    type: Date,
    index: true
  },
  expiresAt: {
    type: Date
  },
  relatedId: {
    type: Schema.Types.ObjectId
  },
  relatedModel: {
    type: String,
    enum: ['Course', 'Lesson', 'Quiz', 'User', 'Progress']
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for performance
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ scheduledFor: 1, delivered: 1 });

// TTL index to automatically remove expired notifications
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to update timestamps
NotificationSchema.pre<INotification>('save', function(next) {
  this.updatedAt = new Date();
  
  // Set readAt when read status changes to true
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
  }
  
  // Set deliveredAt when delivered status changes to true
  if (this.isModified('delivered') && this.delivered && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  
  next();
});

// Static method to find user notifications
NotificationSchema.statics.findUserNotifications = function(
  userId: string, 
  limit: number = 20
): Promise<INotification[]> {
  return this.find({ 
    userId,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to mark notifications as read
NotificationSchema.statics.markAsRead = async function(
  userId: string, 
  notificationId?: string
): Promise<void> {
  const query: any = { userId, read: false };
  
  if (notificationId) {
    query._id = notificationId;
  }
  
  await this.updateMany(query, { 
    read: true, 
    readAt: new Date() 
  });
};

// Static method to create a new notification
NotificationSchema.statics.createNotification = async function(
  userId: string,
  title: string,
  message: string,
  type: string,
  options: Partial<INotification> = {}
): Promise<INotification> {
  const notification = new this({
    userId,
    title,
    message,
    type,
    category: options.category || type,
    priority: options.priority || 'normal',
    actionUrl: options.actionUrl,
    actionText: options.actionText,
    data: options.data || {},
    scheduledFor: options.scheduledFor,
    expiresAt: options.expiresAt,
    relatedId: options.relatedId,
    relatedModel: options.relatedModel
  });
  
  return notification.save();
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = function(userId: string): Promise<number> {
  return this.countDocuments({ 
    userId, 
    read: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to bulk create notifications
NotificationSchema.statics.bulkCreate = async function(
  notifications: Partial<INotification>[]
): Promise<INotification[]> {
  const result = await this.insertMany(notifications);
  return result as INotification[];
};

// Static method to cleanup expired notifications
NotificationSchema.statics.cleanupExpired = async function(): Promise<void> {
  await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Virtual for time since creation
NotificationSchema.virtual('timeAgo').get(function(this: INotification) {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Virtual for status
NotificationSchema.virtual('status').get(function(this: INotification) {
  if (this.scheduledFor && this.scheduledFor > new Date()) {
    return 'scheduled';
  }
  if (this.read) {
    return 'read';
  }
  if (this.delivered) {
    return 'delivered';
  }
  return 'pending';
});

// Virtual for is expired
NotificationSchema.virtual('isExpired').get(function(this: INotification) {
  return this.expiresAt && this.expiresAt < new Date();
});

// Ensure virtual fields are serialised
NotificationSchema.set('toJSON', {
  virtuals: true
});

const Notification: INotificationModel = (mongoose.models.Notification as INotificationModel) || mongoose.model<INotification, INotificationModel>('Notification', NotificationSchema);

export default Notification;