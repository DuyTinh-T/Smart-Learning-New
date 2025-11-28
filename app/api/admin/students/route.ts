import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { Enrollment } from '@/models/Enrollment';
import Progress from '@/models/Progress';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Get all students
    const students = await User.find({ role: 'student' })
      .select('-password')
      .lean();

    // Get enrollment count and progress for each student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const enrollments = await Enrollment.find({ student: student._id }).lean();
        const enrollmentIds = enrollments.map((e: any) => e._id);

        // Calculate average progress across all enrolled courses
        const progressRecords = await Progress.find({
          enrollment: { $in: enrollmentIds },
        }).lean();

        const avgProgress =
          progressRecords.length > 0
            ? progressRecords.reduce(
                (sum, progress) => sum + (progress.completionPercentage || 0),
                0
              ) / progressRecords.length
            : 0;

        return {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          courses: enrollments.length,
          progress: Math.round(avgProgress),
          status: student.isActive ? 'active' : 'inactive',
          joined: new Date(student.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          avatar: student.avatar,
          lastLogin: student.lastLogin,
          dailyStudyTime: student.dailyStudyTime || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: studentsWithStats,
      total: studentsWithStats.length,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students data' },
      { status: 500 }
    );
  }
}
