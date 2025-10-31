import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import { authenticate } from '@/lib/auth';

// GET /api/debug/courses - Debug endpoint to check all courses and user permissions
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get current user
    const { user, error } = await authenticate(request);
    
    // Get all courses (including inactive ones)
    const allCourses = await Course.find({})
      .populate('createdBy', 'name email role')
      .select('title createdBy isActive createdAt')
      .lean();

    // Get only active courses using current filter
    const activeCourses = await Course.find({
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }
      ]
    })
      .populate('createdBy', 'name email role')
      .select('title createdBy isActive createdAt')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        currentUser: user ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        } : null,
        authError: error,
        totalCourses: allCourses.length,
        activeCourses: activeCourses.length,
        allCoursesDetails: allCourses.map(course => ({
          _id: course._id,
          title: course.title,
          isActive: course.isActive,
          createdBy: course.createdBy,
          canDelete: user ? (
            (user._id as any).toString() === (course.createdBy as any)?._id?.toString() || 
            user.role === 'admin'
          ) : false,
          createdAt: course.createdAt
        })),
        activeCoursesDetails: activeCourses.map(course => ({
          _id: course._id,
          title: course.title,
          isActive: course.isActive,
          createdBy: course.createdBy,
          canDelete: user ? (
            (user._id as any).toString() === (course.createdBy as any)?._id?.toString() || 
            user.role === 'admin'
          ) : false,
          createdAt: course.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Debug courses error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint failed',
      details: error
    }, { status: 500 });
  }
}