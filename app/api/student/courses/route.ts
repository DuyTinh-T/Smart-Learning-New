import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'
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

    // For now, we'll get all public courses as a placeholder for enrolled courses
    // In a real app, you'd have an Enrollment model to track student enrollments
    const skip = (page - 1) * limit

    // Get courses (simulating enrollment - in real app you'd join with enrollment table)
    const courses = await Course.find({ 
      visibility: 'public',
      isActive: true 
    })
    .populate('createdBy', 'name email')
    .select('title description category tags thumbnail price enrollmentCount createdBy createdAt modules')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

    const total = await Course.countDocuments({ 
      visibility: 'public',
      isActive: true 
    })

    // Transform courses for student dashboard
    const enrolledCourses = courses.map((course: any) => {
      // Calculate progress (mock data - in real app this would come from user progress)
      const totalLessons = course.modules?.reduce((acc: number, module: any) => {
        return acc + (module.lessons?.length || 0)
      }, 0) || 0

      // Mock completed lessons (in real app, track actual progress)
      const completedLessons = Math.floor(Math.random() * totalLessons)
      const progress = totalLessons > 0 ? Math.floor((completedLessons / totalLessons) * 100) : 0

      // Mock next lesson (in real app, calculate from actual progress)
      const nextLessonOptions = [
        'Introduction to Basics',
        'Understanding Core Concepts', 
        'Practical Applications',
        'Advanced Techniques',
        'Project Implementation',
        'Final Assessment'
      ]
      const nextLesson = nextLessonOptions[Math.floor(Math.random() * nextLessonOptions.length)]

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
        progress,
        totalLessons,
        completedLessons,
        nextLesson,
        createdAt: course.createdAt,
        // Mock enrollment date (in real app, this would come from enrollment record)
        enrolledAt: new Date(course.createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within 30 days of course creation
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