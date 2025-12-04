import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'
import { Enrollment } from '@/models'
import { authenticate } from '@/lib/auth'

// GET /api/student/courses - Get enrolled courses for current student
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const { user, error } = await authenticate(request)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only students can access this endpoint
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Forbidden - Students only' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'active'
    const skip = (page - 1) * limit

    // Get user's enrollments
    const enrollments = await Enrollment.find({ 
      student: user._id,
      status: status
    })
    .populate({
      path: 'course',
      select: 'title description category tags thumbnail price enrollmentCount createdBy createdAt',
      populate: {
        path: 'createdBy',
        select: 'name email'
      }
    })
    .sort({ enrolledAt: -1 })
    .skip(skip)
    .limit(limit)

    const total = await Enrollment.countDocuments({ 
      student: user._id,
      status: status
    })

    // Transform courses for student dashboard
    const enrolledCourses = enrollments
      .filter((enrollment: any) => enrollment.course != null) // Filter out null courses
      .map((enrollment: any) => {
        const course = enrollment.course
        // Use real enrollment progress data

        return {
          id: course._id.toString(),
          title: course.title,
          description: course.description,
          instructor: course.createdBy?.name || 'Unknown Instructor',
          instructorEmail: course.createdBy?.email,
          thumbnail: course.thumbnail,
          category: course.category,
          tags: course.tags,
          price: course.price,
          enrollmentCount: course.enrollmentCount,
          progress: enrollment.progress?.percentage || 0,
          totalLessons: enrollment.progress?.totalLessons || 0,
          completedLessons: enrollment.progress?.completedLessons?.length || 0,
          nextLesson: enrollment.progress?.percentage < 100 ? 'Continue Learning' : 'Course Completed',
          createdAt: course.createdAt,
          enrolledAt: enrollment.enrolledAt
        }
      })

    return NextResponse.json(
      {
        success: true,
        data: {
          courses: enrolledCourses,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          stats: {
            totalEnrolled: enrolledCourses.length,
            averageProgress: enrolledCourses.length > 0 
              ? Math.floor(enrolledCourses.reduce((acc, course) => acc + course.progress, 0) / enrolledCourses.length)
              : 0,
            totalHoursLearned: Math.floor(Math.random() * 100) + 20, // Mock data
            certificatesEarned: enrolledCourses.filter(c => c.progress === 100).length
          }
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching student courses:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch courses',
        details: error.message 
      },
      { status: 500 }
    )
  }
}