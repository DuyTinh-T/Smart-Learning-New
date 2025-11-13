import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ProjectSubmission from '@/models/ProjectSubmission'
import { authenticate, requireRole } from '@/lib/auth'

// GET - Get all submissions for a course or filter by status
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { user, error } = await authenticate(req)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only teachers and admins can view submissions
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - only teachers can view submissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const lessonId = searchParams.get('lessonId')
    const status = searchParams.get('status') // 'submitted', 'graded', 'pending'
    const studentId = searchParams.get('studentId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build filter
    const filter: any = {}

    if (courseId) {
      filter.courseId = courseId
    }

    if (lessonId) {
      filter.lessonId = lessonId
    }

    if (status) {
      filter.status = status
    }

    if (studentId) {
      filter.studentId = studentId
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count
    const total = await ProjectSubmission.countDocuments(filter)

    // Get submissions
    const submissions = await ProjectSubmission.find(filter)
      .populate('studentId', 'name email')
      .populate('lessonId', 'title')
      .populate('courseId', 'title')
      .sort('-submittedAt')
      .skip(skip)
      .limit(limit)

    return NextResponse.json(
      {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
