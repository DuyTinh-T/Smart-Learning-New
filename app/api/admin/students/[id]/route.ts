import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { Enrollment } from '@/models/Enrollment';
import Course from '@/models/Course';
import Progress from '@/models/Progress';
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
    const studentId = id;

    // Get student details
    const student = await User.findById(studentId)
      .select('-password')
      .lean();

    if (!student || student.role !== 'student') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get student's enrollments with course details
    const enrollments = await Enrollment.find({ student: studentId })
      .populate({
        path: 'course',
        select: 'title slug thumbnail price createdBy',
        populate: {
          path: 'createdBy',
          select: 'name',
        },
      })
      .lean();

    const enrollmentIds = enrollments.map((e: any) => e._id);

    // Get progress for each enrollment
    const progressRecords = await Progress.find({
      enrollment: { $in: enrollmentIds },
    }).lean();

    // Calculate overall stats
    const totalCourses = enrollments.length;
    const activeCourses = enrollments.filter((e: any) => e.status === 'active').length;
    const completedCourses = enrollments.filter((e: any) => e.status === 'completed').length;

    const avgProgress =
      progressRecords.length > 0
        ? progressRecords.reduce(
            (sum, progress) => sum + (progress.completionPercentage || 0),
            0
          ) / progressRecords.length
        : 0;

    // Map enrollments with progress
    const coursesWithProgress = enrollments.map((enrollment: any) => {
      const progress = progressRecords.find(
        (p: any) => p.enrollment.toString() === enrollment._id.toString()
      );

      return {
        id: enrollment._id.toString(),
        courseId: enrollment.course?._id?.toString(),
        title: enrollment.course?.title || 'Unknown Course',
        slug: enrollment.course?.slug,
        thumbnail: enrollment.course?.thumbnail,
        price: enrollment.course?.price || 0,
        teacher: {
          name: enrollment.course?.createdBy?.name || 'Unknown',
        },
        status: enrollment.status,
        progress: progress?.completionPercentage || 0,
        enrolledAt: new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        lastAccessed: enrollment.progress?.lastAccessedAt
          ? new Date(enrollment.progress.lastAccessedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Never',
      };
    });

    // Get recent activity (last 5 courses)
    const recentCourses = coursesWithProgress
      .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
      .slice(0, 5);

    const studentProfile = {
      id: student._id.toString(),
      name: student.name,
      email: student.email,
      role: student.role,
      avatar: student.avatar,
      isActive: student.isActive,
      lastLogin: student.lastLogin,
      createdAt: student.createdAt,
      dailyStudyTime: student.dailyStudyTime || 0,
      stats: {
        totalCourses,
        activeCourses,
        completedCourses,
        avgProgress: Math.round(avgProgress),
      },
      recentCourses,
      allCourses: coursesWithProgress,
    };

    return NextResponse.json({
      success: true,
      data: studentProfile,
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student profile' },
      { status: 500 }
    );
  }
}
