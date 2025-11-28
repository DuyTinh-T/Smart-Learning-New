import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
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

    // Get all courses with teacher information
    const courses = await Course.find()
      .populate('createdBy', 'name email')
      .lean();

    // Get enrollment count for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({
          course: course._id,
        });

        const teacher = course.createdBy as any;
        return {
          id: course._id.toString(),
          title: course.title,
          slug: course.slug,
          description: course.description,
          category: course.category,
          thumbnail: course.thumbnail,
          price: course.price,
          teacher: {
            id: teacher?._id?.toString(),
            name: teacher?.name || 'Unknown',
            email: teacher?.email,
          },
          modules: course.modules?.length || 0,
          enrollments: enrollmentCount,
          rating: course.rating || 0,
          totalRatings: course.totalRatings || 0,
          visibility: course.visibility,
          isActive: course.isActive,
          createdAt: new Date(course.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: coursesWithStats,
      total: coursesWithStats.length,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses data' },
      { status: 500 }
    );
  }
}
