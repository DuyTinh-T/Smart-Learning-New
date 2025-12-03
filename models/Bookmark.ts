import mongoose from "mongoose"

const bookmarkSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
)

// Create compound index to ensure a user can only bookmark a course once
bookmarkSchema.index({ userId: 1, courseId: 1 }, { unique: true })

export default mongoose.models.Bookmark || mongoose.model("Bookmark", bookmarkSchema)
