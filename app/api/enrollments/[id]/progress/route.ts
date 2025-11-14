import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Enrollment, Lesson } from '@/models'
import jwt from 'jsonwebtoken'

// Helper function to verify JWT token
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
  } catch {
    return null
  }
}

// GET /api/enrollments/[id]/progress - Get progress for specific enrollment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token) as any
    
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Get enrollment and verify ownership
    const enrollment = await Enrollment.findOne({
      _id: id,
      student: decoded.userId
    }).populate({
      path: 'course',
      populate: {
        path: 'modules.lessons',
        select: 'title type content videoUrl resources duration difficulty order'
      }
    })

    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Enrollment not found' }, { status: 404 })
    }

    // Get detailed progress info
    const courseData = enrollment.course as any
    const allLessons: any[] = []
    
    // Flatten all lessons with module info
    courseData.modules?.forEach((module: any, moduleIndex: number) => {
      module.lessons?.forEach((lesson: any) => {
        allLessons.push({
          ...lesson.toObject(),
          moduleId: module._id,
          moduleTitle: module.title,
          moduleOrder: moduleIndex,
          completed: enrollment.isLessonCompleted(lesson._id.toString())
        })
      })
    })

    // Sort lessons by module order and lesson order
    allLessons.sort((a, b) => {
      if (a.moduleOrder !== b.moduleOrder) {
        return a.moduleOrder - b.moduleOrder
      }
      return (a.order || 0) - (b.order || 0)
    })

    return NextResponse.json({
      success: true,
      data: {
        enrollment: {
          _id: enrollment._id,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          progress: enrollment.progress,
          quizResults: enrollment.quizResults,
          projectSubmissions: enrollment.projectSubmissions
        },
        course: {
          _id: courseData._id,
          title: courseData.title,
          description: courseData.description,
          instructor: courseData.instructor,
          thumbnail: courseData.thumbnail
        },
        lessons: allLessons,
        stats: {
          totalLessons: allLessons.length,
          completedLessons: enrollment.progress.completedLessons.length,
          percentage: enrollment.progress.percentage,
          lastAccessedLesson: enrollment.progress.lastAccessedLesson,
          lastAccessedAt: enrollment.progress.lastAccessedAt
        }
      }
    })

  } catch (error) {
    console.error('Get enrollment progress error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollment progress' },
      { status: 500 }
    )
  }
}

// PUT /api/enrollments/[id]/progress - Update lesson progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    
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
    const { lessonId, action, data } = body

    if (!lessonId || !action) {
      return NextResponse.json({ success: false, error: 'Lesson ID and action are required' }, { status: 400 })
    }

    // Get enrollment and verify ownership
    const enrollment = await Enrollment.findOne({
      _id: id,
      student: decoded.userId
    })

    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Enrollment not found' }, { status: 404 })
    }

    // Verify lesson exists
    const lesson = await Lesson.findById(lessonId)
    if (!lesson) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 })
    }

    let updated = false

    switch (action) {
      case 'complete':
        if (!enrollment.isLessonCompleted(lessonId)) {
          enrollment.markLessonCompleted(lessonId)
          updated = true
        }
        break

      case 'quiz_result':
        if (data?.score !== undefined) {
          // Update or add quiz result
          const existingResultIndex = enrollment.quizResults.findIndex(
            (result: any) => result.lesson.toString() === lessonId
          )
          
          if (existingResultIndex >= 0) {
            // Update existing result
            enrollment.quizResults[existingResultIndex].score = data.score
            enrollment.quizResults[existingResultIndex].attempts += 1
            enrollment.quizResults[existingResultIndex].completedAt = new Date()
          } else {
            // Add new result
            enrollment.quizResults.push({
              lesson: lessonId,
              score: data.score,
              attempts: 1,
              completedAt: new Date()
            })
          }

          // Mark lesson as completed if score >= 70%
          if (data.score >= 70 && !enrollment.isLessonCompleted(lessonId)) {
            enrollment.markLessonCompleted(lessonId)
          }
          
          updated = true
        }
        break

      case 'project_submission':
        if (data?.submission) {
          // Update or add project submission
          const existingSubmissionIndex = enrollment.projectSubmissions.findIndex(
            (submission: any) => submission.lesson.toString() === lessonId
          )
          
          if (existingSubmissionIndex >= 0) {
            // Update existing submission
            enrollment.projectSubmissions[existingSubmissionIndex].submission = data.submission
            enrollment.projectSubmissions[existingSubmissionIndex].submittedAt = new Date()
          } else {
            // Add new submission
            enrollment.projectSubmissions.push({
              lesson: lessonId,
              submission: data.submission,
              submittedAt: new Date()
            })
          }

          // Mark lesson as completed when project is submitted
          if (!enrollment.isLessonCompleted(lessonId)) {
            enrollment.markLessonCompleted(lessonId)
          }
          
          updated = true
        }
        break

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    if (updated) {
      await enrollment.save()
    }

    return NextResponse.json({
      success: true,
      data: {
        progress: enrollment.progress,
        quizResults: enrollment.quizResults,
        projectSubmissions: enrollment.projectSubmissions,
        status: enrollment.status
      },
      message: 'Progress updated successfully'
    })

  } catch (error) {
    console.error('Update progress error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}