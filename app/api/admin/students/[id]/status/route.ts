import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const studentId = params.id;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. isActive must be a boolean.' },
        { status: 400 }
      );
    }

    // Get student
    const student = await User.findById(studentId);

    if (!student || student.role !== 'student') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Update student status
    student.isActive = isActive;
    await student.save();

    return NextResponse.json({
      success: true,
      message: `Student account ${isActive ? 'activated' : 'suspended'} successfully`,
      data: {
        id: (student._id as any).toString(),
        name: student.name,
        email: student.email,
        isActive: student.isActive,
      },
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    return NextResponse.json(
      { error: 'Failed to update student status' },
      { status: 500 }
    );
  }
}
