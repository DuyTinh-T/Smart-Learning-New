import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import { Enrollment } from '@/models/Enrollment';
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

    // Get all teachers
    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .lean();

    // Get course count and student count for each teacher
    const teachersWithStats = await Promise.all(
      teachers.map(async (teacher) => {
        const courses = await Course.find({ createdBy: teacher._id }).lean();
        const courseIds = courses.map((c) => c._id);

        // Count unique students enrolled in teacher's courses
        const enrollments = await Enrollment.find({
          course: { $in: courseIds },
        }).distinct('student');

        // Calculate average rating from all teacher's courses
        const avgRating =
          courses.length > 0
            ? courses.reduce((sum, course) => sum + (course.rating || 0), 0) /
              courses.length
            : 0;

        return {
          id: teacher._id.toString(),
          name: teacher.name,
          email: teacher.email,
          courses: courses.length,
          students: enrollments.length,
          rating: parseFloat(avgRating.toFixed(1)),
          status: teacher.isActive ? 'active' : 'inactive',
          joined: new Date(teacher.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          avatar: teacher.avatar,
          lastLogin: teacher.lastLogin,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: teachersWithStats,
      total: teachersWithStats.length,
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers data' },
      { status: 500 }
    );
  }
}
