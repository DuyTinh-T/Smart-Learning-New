import mongoose from "mongoose"

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    helpful: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// Create compound index to ensure a user can only review a course once
reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true })

// Index for querying reviews by course
reviewSchema.index({ courseId: 1, createdAt: -1 })

export default mongoose.models.Review || mongoose.model("Review", reviewSchema)
