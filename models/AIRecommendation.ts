import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface cho Recommendation subdocument
export interface IRecommendation {
  type: 'lesson' | 'course' | 'studyPlan' | 'resource' | 'review';
  refId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  payload?: Record<string, any>;
  isViewed: boolean;
  isActioned: boolean;
  _id?: mongoose.Types.ObjectId;
}

// Interface cho AIRecommendation document
export interface IAIRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  recommendations: IRecommendation[];
  context: {
    recentLessons: mongoose.Types.ObjectId[];
    quizScores: Record<string, number>;
    studyGoals: string[];
    preferences: Record<string, any>;
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    availableTime: number; // minutes per day
  };
  aiModel: string;
  promptUsed: string;
  rawAIResponse: Record<string, any>;
  processingTime: number; // milliseconds
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface cho AIRecommendation Model với static methods
interface IAIRecommendationModel extends Model<IAIRecommendation> {
  findActiveRecommendations(userId: string): Promise<IAIRecommendation[]>;
  createRecommendation(
    userId: string,
    recommendations: IRecommendation[],
    context: any,
    aiData: any
  ): Promise<IAIRecommendation>;
  markAsViewed(userId: string, recommendationId: string): Promise<void>;
  getRecommendationStats(userId: string): Promise<{
    total: number;
    viewed: number;
    actioned: number;
    byType: Record<string, number>;
  }>;
}

// Schema cho Recommendation subdocument
const RecommendationSchema = new Schema<IRecommendation>({
  type: {
    type: String,
    enum: {
      values: ['lesson', 'course', 'studyPlan', 'resource', 'review'],
      message: 'Type must be lesson, course, studyPlan, resource, or review'
    },
    required: [true, 'Recommendation type is required']
  },
  refId: {
    type: Schema.Types.ObjectId,
    refPath: 'recommendations.type'
  },
  title: {
    type: String,
    required: [true, 'Recommendation title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Recommendation description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  reason: {
    type: String,
    required: [true, 'Recommendation reason is required'],
    maxlength: [500, 'Reason cannot be more than 500 characters']
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be low, medium, or high'
    },
    default: 'medium'
  },
  confidence: {
    type: Number,
    required: [true, 'Confidence score is required'],
    min: [0, 'Confidence cannot be negative'],
    max: [100, 'Confidence cannot be more than 100']
  },
  payload: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isViewed: {
    type: Boolean,
    default: false
  },
  isActioned: {
    type: Boolean,
    default: false
  }
});

const AIRecommendationSchema = new Schema<IAIRecommendation>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  recommendations: {
    type: [RecommendationSchema],
    required: [true, 'Recommendations are required'],
    validate: {
      validator: function(recommendations: IRecommendation[]) {
        return recommendations.length >= 1 && recommendations.length <= 20;
      },
      message: 'Must have between 1 and 20 recommendations'
    }
  },
  context: {
    recentLessons: [{
      type: Schema.Types.ObjectId,
      ref: 'Lesson'
    }],
    quizScores: {
      type: Map,
      of: Number,
      default: new Map()
    },
    studyGoals: {
      type: [String],
      default: []
    },
    preferences: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map()
    },
    currentLevel: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: 'Level must be beginner, intermediate, or advanced'
      },
      default: 'beginner'
    },
    availableTime: {
      type: Number,
      default: 30,
      min: [5, 'Available time must be at least 5 minutes'],
      max: [480, 'Available time cannot be more than 8 hours']
    }
  },
  aiModel: {
    type: String,
    required: [true, 'AI model is required'],
    default: 'gpt-3.5-turbo'
  },
  promptUsed: {
    type: String,
    required: [true, 'Prompt used is required']
  },
  rawAIResponse: {
    type: Schema.Types.Mixed,
    required: [true, 'Raw AI response is required']
  },
  processingTime: {
    type: Number,
    required: [true, 'Processing time is required'],
    min: [0, 'Processing time cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
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
AIRecommendationSchema.index({ userId: 1, isActive: 1 });
AIRecommendationSchema.index({ createdAt: -1 });
AIRecommendationSchema.index({ expiresAt: 1 });
AIRecommendationSchema.index({ 'recommendations.type': 1 });
AIRecommendationSchema.index({ 'recommendations.priority': 1 });

// Update the updatedAt field before saving
AIRecommendationSchema.pre<IAIRecommendation>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find active recommendations for a user
AIRecommendationSchema.statics.findActiveRecommendations = function(userId: string): Promise<IAIRecommendation[]> {
  return this.find({ 
    userId, 
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
  .populate('recommendations.refId')
  .sort({ createdAt: -1 });
};

// Static method to create a new recommendation
AIRecommendationSchema.statics.createRecommendation = async function(
  userId: string,
  recommendations: IRecommendation[],
  context: any,
  aiData: any
): Promise<IAIRecommendation> {
  // Deactivate old recommendations
  await this.updateMany(
    { userId, isActive: true },
    { isActive: false }
  );

  // Create new recommendation
  const recommendation = new this({
    userId,
    recommendations,
    context,
    aiModel: aiData.model || 'gpt-3.5-turbo',
    promptUsed: aiData.prompt,
    rawAIResponse: aiData.response,
    processingTime: aiData.processingTime || 0
  });

  return recommendation.save();
};

// Static method to mark recommendation as viewed
AIRecommendationSchema.statics.markAsViewed = async function(userId: string, recommendationId: string): Promise<void> {
  await this.updateOne(
    { 
      userId, 
      'recommendations._id': recommendationId 
    },
    { 
      '$set': { 'recommendations.$.isViewed': true } 
    }
  );
};

// Static method to get recommendation statistics
AIRecommendationSchema.statics.getRecommendationStats = async function(userId: string) {
  const pipeline = [
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $unwind: '$recommendations' },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        viewed: {
          $sum: { $cond: ['$recommendations.isViewed', 1, 0] }
        },
        actioned: {
          $sum: { $cond: ['$recommendations.isActioned', 1, 0] }
        },
        byType: {
          $push: '$recommendations.type'
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  if (result.length === 0) {
    return {
      total: 0,
      viewed: 0,
      actioned: 0,
      byType: {}
    };
  }

  const stats = result[0];
  const byType = stats.byType.reduce((acc: Record<string, number>, type: string) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return {
    total: stats.total,
    viewed: stats.viewed,
    actioned: stats.actioned,
    byType
  };
};

// Virtual for high priority recommendations count
AIRecommendationSchema.virtual('highPriorityCount').get(function(this: IAIRecommendation) {
  return this.recommendations.filter(rec => rec.priority === 'high').length;
});

// Virtual for unviewed recommendations count
AIRecommendationSchema.virtual('unviewedCount').get(function(this: IAIRecommendation) {
  return this.recommendations.filter(rec => !rec.isViewed).length;
});

// Ensure virtual fields are serialised
AIRecommendationSchema.set('toJSON', {
  virtuals: true
});

const AIRecommendation: IAIRecommendationModel = (mongoose.models.AIRecommendation as IAIRecommendationModel) || mongoose.model<IAIRecommendation, IAIRecommendationModel>('AIRecommendation', AIRecommendationSchema);

export default AIRecommendation;