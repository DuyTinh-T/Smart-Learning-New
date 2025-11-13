import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ProjectSubmission from '@/models/ProjectSubmission'
import { authenticate, requireRole } from '@/lib/auth'

// PUT - Grade a project submission
export async function PUT(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
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

    // Only teachers and admins can grade
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - only teachers can grade' },
        { status: 403 }
      )
    }

    const { submissionId } = params
    const body = await req.json()
    const { score, feedback } = body

    // Validation
    if (score !== undefined) {
      if (typeof score !== 'number' || score < 0 || score > 100) {
        return NextResponse.json(
          { error: 'Score must be a number between 0 and 100' },
          { status: 400 }
        )
      }
    }

    if (feedback && feedback.length > 5000) {
      return NextResponse.json(
        { error: 'Feedback cannot exceed 5000 characters' },
        { status: 400 }
      )
    }

    // Find submission
    const submission = await ProjectSubmission.findById(submissionId)
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Update submission with grade
    if (score !== undefined) {
      submission.score = score
    }
    if (feedback) {
      submission.feedback = feedback
    }
    
    submission.status = 'graded'
    submission.gradedAt = new Date()
    submission.gradedBy = user.id

    await submission.save()
    await submission.populate('studentId', 'name email')

    return NextResponse.json(
      { 
        submission,
        message: 'Project graded successfully'
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error grading submission:', error)
    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a project submission (only student or teacher can)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
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

    const { submissionId } = params

    // Find submission
    const submission = await ProjectSubmission.findById(submissionId)
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check permissions: only the student who submitted or teacher can delete
    if (
      submission.studentId.toString() !== user.id && 
      user.role !== 'teacher' && 
      user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await ProjectSubmission.findByIdAndDelete(submissionId)

    return NextResponse.json(
      { message: 'Submission deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }
}

// GET - Get a single submission
export async function GET(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
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

    const { submissionId } = params

    const submission = await ProjectSubmission.findById(submissionId)
      .populate('studentId', 'name email')
      .populate('lessonId', 'title')
      .populate('courseId', 'title')

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check permissions: student can only view their own, teachers can view all
    if (
      submission.studentId._id.toString() !== user.id && 
      user.role !== 'teacher' && 
      user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({ submission }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}
