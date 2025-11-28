import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Payment from '@/models/Payment';
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

    // Get counts
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const activeCourses = await Course.countDocuments({ isActive: true });

    // Calculate total revenue
    const payments = await Payment.find({ status: 'completed' }).lean();
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Get previous month data for comparison (simplified)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthStudents = await User.countDocuments({
      role: 'student',
      createdAt: { $lt: lastMonth },
    });
    const lastMonthTeachers = await User.countDocuments({
      role: 'teacher',
      createdAt: { $lt: lastMonth },
    });
    const lastMonthCourses = await Course.countDocuments({
      isActive: true,
      createdAt: { $lt: lastMonth },
    });

    // Calculate percentage changes
    const studentChange = lastMonthStudents > 0
      ? Math.round(((totalStudents - lastMonthStudents) / lastMonthStudents) * 100)
      : 0;
    const teacherChange = lastMonthTeachers > 0
      ? Math.round(((totalTeachers - lastMonthTeachers) / lastMonthTeachers) * 100)
      : 0;
    const courseChange = lastMonthCourses > 0
      ? Math.round(((activeCourses - lastMonthCourses) / lastMonthCourses) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalStudents: {
          value: totalStudents,
          change: `${studentChange >= 0 ? '+' : ''}${studentChange}%`,
        },
        totalTeachers: {
          value: totalTeachers,
          change: `${teacherChange >= 0 ? '+' : ''}${teacherChange}%`,
        },
        activeCourses: {
          value: activeCourses,
          change: `${courseChange >= 0 ? '+' : ''}${courseChange}%`,
        },
        platformRevenue: {
          value: totalRevenue,
          change: '+23%', // Simplified for now
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}
