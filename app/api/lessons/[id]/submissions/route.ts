import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ProjectSubmission from '@/models/ProjectSubmission'
import Lesson from '@/models/Lesson'
import { authenticate, requireRole } from '@/lib/auth'

// GET submissions for a lesson or by student
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const { user, error } = await authenticate(req)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: lessonId } = params
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    // Verify lesson exists
    const lesson = await Lesson.findById(lessonId)
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // If studentId is provided, get specific submission (student can only view their own)
    if (studentId) {
      if (user.id !== studentId && user.role !== 'teacher' && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const submission = await (ProjectSubmission as any).findStudentSubmission(lessonId, studentId)
      
      if (!submission) {
        return NextResponse.json(
          { submission: null, message: 'No submission found' },
          { status: 200 }
        )
      }

      return NextResponse.json({ submission }, { status: 200 })
    }

    // Teachers can view all submissions for a lesson
    if (user.role === 'teacher' || user.role === 'admin') {
      const submissions = await (ProjectSubmission as any).findByLesson(lessonId)
      return NextResponse.json({ submissions }, { status: 200 })
    }

    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  } catch (error: any) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

// POST new submission
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const { user, error } = await authenticate(req)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: lessonId } = params
    const body = await req.json()
    const { code, explanation, courseId } = body

    // Validation
    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: 'Code/solution is required' },
        { status: 400 }
      )
    }

    if (code.length > 100000) {
      return NextResponse.json(
        { error: 'Submission too large (max 100000 characters)' },
        { status: 400 }
      )
    }

    // Verify lesson exists
    const lesson = await Lesson.findById(lessonId)
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Verify lesson is of type 'project'
    if (lesson.type !== 'project') {
      return NextResponse.json(
        { error: 'This lesson is not a project type' },
        { status: 400 }
      )
    }

    // Check if student already submitted (prevent duplicate submissions)
    const existingSubmission = await (ProjectSubmission as any).findStudentSubmission(lessonId, user.id)
    
    if (existingSubmission) {
      // Update existing submission instead of creating new
      existingSubmission.code = code
      existingSubmission.explanation = explanation || ''
      existingSubmission.status = 'submitted'
      existingSubmission.submittedAt = new Date()
      
      await existingSubmission.save()
      
      return NextResponse.json(
        { 
          submission: existingSubmission,
          message: 'Submission updated successfully'
        },
        { status: 200 }
      )
    }

    // Create new submission
    const submission = new ProjectSubmission({
      lessonId,
      courseId,
      studentId: user.id,
      code,
      explanation: explanation || '',
      status: 'submitted',
      submittedAt: new Date()
    })

    await submission.save()

    // Return populated submission
    await submission.populate('studentId', 'name email')

    return NextResponse.json(
      { 
        submission,
        message: 'Project submitted successfully'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error submitting project:', error)
    return NextResponse.json(
      { error: 'Failed to submit project' },
      { status: 500 }
    )
  }
}
