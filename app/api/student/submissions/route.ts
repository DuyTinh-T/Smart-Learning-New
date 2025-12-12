import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import jwt from 'jsonwebtoken'
import { ProjectSubmission, Course, User, Lesson } from '@/models'

// Helper function to verify JWT token
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
  } catch {
    return null
  }
}

// GET /api/student/submissions - Get student's project submissions with detailed scores and feedback
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token) as any
    
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    // Verify user is a student
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Only students can access this endpoint' }, { status: 403 })
    }

    // Build query for project submissions
    const query: any = { studentId: decoded.userId }
    if (courseId) {
      query.courseId = courseId
    }

    // Get project submissions with course and lesson details
    const submissions = await ProjectSubmission
      .find(query)
      .populate({
        path: 'courseId',
        select: 'title instructor'
      })
      .populate({
        path: 'lessonId', 
        select: 'title'
      })
      .sort({ submittedAt: -1 })
      .lean()

    // Group submissions by course
    const submissionsByCourse = new Map()
    
    submissions.forEach((submission: any) => {
      const courseKey = submission.courseId._id.toString()
      if (!submissionsByCourse.has(courseKey)) {
        submissionsByCourse.set(courseKey, {
          courseId: courseKey,
          courseTitle: submission.courseId.title,
          instructor: submission.courseId.instructor,
          submissions: []
        })
      }
      
      submissionsByCourse.get(courseKey).submissions.push({
        lessonId: submission.lessonId._id,
        lessonTitle: submission.lessonId.title,
        code: submission.code,
        explanation: submission.explanation,
        submittedAt: submission.submittedAt,
        score: submission.score,
        feedback: submission.feedback,
        status: submission.status
      })
    })

    // Convert map to array
    const result = Array.from(submissionsByCourse.values())

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Get student submissions error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}