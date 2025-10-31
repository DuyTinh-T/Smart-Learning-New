import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface cho Module subdocument
export interface IModule {
  title: string;
  order: number;
  lessons: mongoose.Types.ObjectId[];
  _id?: mongoose.Types.ObjectId;
}

// Interface cho Course document
export interface ICourse extends Document {
  title: string;
  slug: string;
  description?: string;
  category?: string;
  tags: string[];
  thumbnail?: string;
  price: number;
  createdBy: mongoose.Types.ObjectId;
  modules: IModule[];
  visibility: 'public' | 'private';
  isActive: boolean;
  enrollmentCount: number;
  rating: number;
  totalRatings: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface cho Course Model với static methods
interface ICourseModel extends Model<ICourse> {
  findBySlug(slug: string): Promise<ICourse | null>;
  findPublicCourses(): Promise<ICourse[]>;
}

// Schema cho Module subdocument
const ModuleSchema = new Schema<IModule>({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [100, 'Module title cannot be more than 100 characters']
  },
  order: {
    type: Number,
    required: [true, 'Module order is required'],
    min: [1, 'Module order must be at least 1']
  },
  lessons: [{
    type: Schema.Types.ObjectId,
    ref: 'Lesson'
  }]
});

const CourseSchema = new Schema<ICourse>({
  title: { 
    type: String, 
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: { 
    type: String, 
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot be more than 50 characters']
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags: string[]) {
        return tags.length <= 10;
      },
      message: 'Cannot have more than 10 tags'
    }
  },
  thumbnail: {
    type: String,
    default: null
  },
  price: { 
    type: Number, 
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Course creator is required']
  },
  modules: [ModuleSchema],
  visibility: { 
    type: String, 
    enum: {
      values: ['public', 'private'],
      message: 'Visibility must be public or private'
    }, 
    default: 'public' 
  },
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentCount: {
    type: Number,
    default: 0,
    min: [0, 'Enrollment count cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot be more than 5']
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: [0, 'Total ratings cannot be negative']
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
CourseSchema.index({ category: 1 });
CourseSchema.index({ tags: 1 });
CourseSchema.index({ createdBy: 1 });
CourseSchema.index({ visibility: 1, isActive: 1 });
CourseSchema.index({ createdAt: -1 });
CourseSchema.index({ rating: -1 });

// Generate slug from title before saving
CourseSchema.pre<ICourse>('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing dashes
  }
  this.updatedAt = new Date();
  next();
});

// Static method to find by slug
CourseSchema.statics.findBySlug = function(slug: string): Promise<ICourse | null> {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

// Static method to find public courses
CourseSchema.statics.findPublicCourses = function(): Promise<ICourse[]> {
  return this.find({ visibility: 'public', isActive: true }).sort({ createdAt: -1 });
};

// Virtual for total lessons count
CourseSchema.virtual('totalLessons').get(function(this: ICourse) {
  return this.modules ? this.modules.reduce((total, module) => total + module.lessons.length, 0) : 0;
});

// Virtual for average rating display
CourseSchema.virtual('averageRating').get(function(this: ICourse) {
  return this.totalRatings > 0 ? (this.rating / this.totalRatings).toFixed(1) : '0.0';
});

// Ensure virtual fields are serialised
CourseSchema.set('toJSON', {
  virtuals: true
});

const Course: ICourseModel = (mongoose.models.Course as ICourseModel) || mongoose.model<ICourse, ICourseModel>('Course', CourseSchema);

export default Course;