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

    const teacherId = params.id;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. isActive must be a boolean.' },
        { status: 400 }
      );
    }

    // Get teacher
    const teacher = await User.findById(teacherId);

    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Update teacher status
    teacher.isActive = isActive;
    await teacher.save();

    return NextResponse.json({
      success: true,
      message: `Teacher account ${isActive ? 'activated' : 'suspended'} successfully`,
      data: {
        id: (teacher._id as any).toString(),
        name: teacher.name,
        email: teacher.email,
        isActive: teacher.isActive,
      },
    });
  } catch (error) {
    console.error('Error updating teacher status:', error);
    return NextResponse.json(
      { error: 'Failed to update teacher status' },
      { status: 500 }
    );
  }
}
