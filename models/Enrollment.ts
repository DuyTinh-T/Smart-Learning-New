import mongoose from 'mongoose'

export interface IEnrollment extends mongoose.Document {
  student: mongoose.Schema.Types.ObjectId
  course: mongoose.Schema.Types.ObjectId
  enrolledAt: Date
  status: 'active' | 'completed' | 'dropped'
  progress: {
    completedLessons: mongoose.Schema.Types.ObjectId[]
    totalLessons: number
    percentage: number
    lastAccessedLesson?: mongoose.Schema.Types.ObjectId
    lastAccessedAt?: Date
  }
  quizResults: Array<{
    lesson: mongoose.Schema.Types.ObjectId
    score: number
    attempts: number
    completedAt: Date
  }>
  projectSubmissions: Array<{
    lesson: mongoose.Schema.Types.ObjectId
    submission: string
    submittedAt: Date
    grade?: number
    feedback?: string
  }>
  completedAt?: Date
  certificateIssued?: boolean
}

const EnrollmentSchema = new mongoose.Schema<IEnrollment>({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active'
  },
  progress: {
    completedLessons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    }],
    totalLessons: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    lastAccessedLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    lastAccessedAt: Date
  },
  quizResults: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    attempts: {
      type: Number,
      default: 1
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  projectSubmissions: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true
    },
    submission: {
      type: String,
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    grade: Number,
    feedback: String
  }],
  completedAt: Date,
  certificateIssued: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true })
EnrollmentSchema.index({ student: 1, status: 1 })
EnrollmentSchema.index({ course: 1, status: 1 })

// Method to calculate progress percentage
EnrollmentSchema.methods.calculateProgress = function() {
  if (this.progress.totalLessons === 0) return 0
  return Math.round((this.progress.completedLessons.length / this.progress.totalLessons) * 100)
}

// Method to check if lesson is completed
EnrollmentSchema.methods.isLessonCompleted = function(lessonId: string) {
  return this.progress.completedLessons.some(
    (completedId: mongoose.Schema.Types.ObjectId) => completedId.toString() === lessonId
  )
}

// Method to mark lesson as completed
EnrollmentSchema.methods.markLessonCompleted = function(lessonId: string) {
  if (!this.isLessonCompleted(lessonId)) {
    this.progress.completedLessons.push(new mongoose.Types.ObjectId(lessonId))
    this.progress.percentage = this.calculateProgress()
    this.progress.lastAccessedLesson = new mongoose.Types.ObjectId(lessonId)
    this.progress.lastAccessedAt = new Date()
    
    // Check if course is completed
    if (this.progress.completedLessons.length >= this.progress.totalLessons) {
      this.status = 'completed'
      this.completedAt = new Date()
    }
  }
}

export const Enrollment = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema)