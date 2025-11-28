import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    await connectDB()

    const { isActive } = await request.json()

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. isActive must be a boolean.' },
        { status: 400 }
      )
    }

    // Update course status
    const course = await Course.findByIdAndUpdate(
      params.id,
      { isActive },
      { new: true }
    )

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Course ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: course._id,
        title: course.title,
        isActive: course.isActive,
      },
    })
  } catch (error) {
    console.error('Error updating course status:', error)
    return NextResponse.json(
      { error: 'Failed to update course status' },
      { status: 500 }
    )
  }
}
