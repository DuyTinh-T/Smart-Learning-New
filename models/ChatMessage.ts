import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for ChatMessage document
export interface IChatMessage extends Document {
  roomCode: string;
  userId: mongoose.Types.ObjectId;
  content: string;
  mentionedQuestionId?: mongoose.Types.ObjectId | null;
  role: 'STUDENT' | 'TEACHER' | 'AI';
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    roomCode: {
      type: String,
      required: [true, 'Room code is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    mentionedQuestionId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    role: {
      type: String,
      enum: ['STUDENT', 'TEACHER', 'AI'],
      required: [true, 'Role is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
ChatMessageSchema.index({ roomCode: 1, createdAt: 1 });
ChatMessageSchema.index({ roomCode: 1, mentionedQuestionId: 1 });

// Export model
const ChatMessage: Model<IChatMessage> = 
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
