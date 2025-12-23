import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import { Enrollment } from '@/models/Enrollment';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const teacherId = id;

    // Get teacher details
    const teacher = await User.findById(teacherId)
      .select('-password')
      .lean();

    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Get teacher's courses
    const courses = await Course.find({ createdBy: teacherId })
      .select('title slug price enrollmentCount rating totalRatings isActive createdAt')
      .lean();

    const courseIds = courses.map((c) => c._id);

    // Get unique students enrolled in teacher's courses
    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
    })
      .distinct('student')
      .lean();

    // Calculate stats
    const totalStudents = enrollments.length;
    const totalCourses = courses.length;
    const activeCourses = courses.filter((c) => c.isActive).length;
    const totalEnrollments = courses.reduce(
      (sum, course) => sum + (course.enrollmentCount || 0),
      0
    );
    const avgRating =
      courses.length > 0
        ? courses.reduce((sum, course) => sum + (course.rating || 0), 0) /
          courses.length
        : 0;

    // Get recent courses (last 5)
    const recentCourses = courses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((course) => ({
        id: course._id.toString(),
        title: course.title,
        slug: course.slug,
        price: course.price,
        enrollments: course.enrollmentCount || 0,
        rating: course.rating || 0,
        totalRatings: course.totalRatings || 0,
        isActive: course.isActive,
        createdAt: new Date(course.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      }));

    const teacherProfile = {
      id: teacher._id.toString(),
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      avatar: teacher.avatar,
      isActive: teacher.isActive,
      lastLogin: teacher.lastLogin,
      createdAt: teacher.createdAt,
      dailyStudyTime: teacher.dailyStudyTime || 0,
      stats: {
        totalCourses,
        activeCourses,
        totalStudents,
        totalEnrollments,
        avgRating: parseFloat(avgRating.toFixed(1)),
      },
      recentCourses,
      allCourses: courses.map((course) => ({
        id: course._id.toString(),
        title: course.title,
        slug: course.slug,
        price: course.price,
        enrollments: course.enrollmentCount || 0,
        rating: course.rating || 0,
        isActive: course.isActive,
      })),
    };

    return NextResponse.json({
      success: true,
      data: teacherProfile,
    });
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher profile' },
      { status: 500 }
    );
  }
}
