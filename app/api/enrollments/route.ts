import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Enrollment, Course, User } from '@/models'
import jwt from 'jsonwebtoken'

// Helper function to verify JWT token
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
  } catch {
    return null
  }
}

// GET /api/enrollments - Get user's enrollments
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
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build query
    const query: any = { student: decoded.userId }
    if (status) {
      query.status = status
    }

    // Get enrollments with populated course data
    const enrollments = await Enrollment
      .find(query)
      .populate({
        path: 'course',
        select: 'title description instructor thumbnail level duration price category tags'
      })
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Enrollment.countDocuments(query)

    // Calculate additional statistics
    const stats = {
      total: await Enrollment.countDocuments({ student: decoded.userId }),
      active: await Enrollment.countDocuments({ student: decoded.userId, status: 'active' }),
      completed: await Enrollment.countDocuments({ student: decoded.userId, status: 'completed' }),
      dropped: await Enrollment.countDocuments({ student: decoded.userId, status: 'dropped' })
    }

    return NextResponse.json({
      success: true,
      data: {
        enrollments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats
      }
    })

  } catch (error) {
    console.error('Get enrollments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}

// POST /api/enrollments - Enroll in a course
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ success: false, error: 'Course ID is required' }, { status: 400 })
    }

    // Check if user is a student
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Only students can enroll in courses' }, { status: 403 })
    }

    // Check if course exists
    const course = await Course.findById(courseId).populate('modules.lessons')
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: decoded.userId,
      course: courseId
    })

    if (existingEnrollment) {
      return NextResponse.json({ success: false, error: 'Already enrolled in this course' }, { status: 409 })
    }

    // Count total lessons in course
    const totalLessons = course.modules.reduce((total: number, module: any) => {
      return total + (module.lessons ? module.lessons.length : 0)
    }, 0)

    // Create enrollment
    const enrollment = new Enrollment({
      student: decoded.userId,
      course: courseId,
      progress: {
        completedLessons: [],
        totalLessons,
        percentage: 0
      },
      quizResults: [],
      projectSubmissions: []
    })

    await enrollment.save()

    // Return enrollment with populated course data
    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate({
        path: 'course',
        select: 'title description instructor thumbnail level duration price category tags'
      })

    return NextResponse.json({
      success: true,
      data: populatedEnrollment,
      message: 'Successfully enrolled in course'
    }, { status: 201 })

  } catch (error) {
    console.error('Enrollment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to enroll in course' },
      { status: 500 }
    )
  }
}