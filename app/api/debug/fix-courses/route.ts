import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import { authenticate, requireRole } from '@/lib/auth';

// POST /api/debug/fix-courses - Fix courses that don't have isActive field
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Authenticate user (admin only)
    const { user, error } = await authenticate(request);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    const roleCheck = requireRole(['admin'])(user);
    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Find courses without isActive field
    const coursesWithoutIsActive = await Course.find({
      isActive: { $exists: false }
    });

    console.log(`Found ${coursesWithoutIsActive.length} courses without isActive field`);

    // Update all courses to have isActive: true
    const updateResult = await Course.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );

    console.log('Update result:', updateResult);

    return NextResponse.json({
      success: true,
      message: `Fixed ${updateResult.modifiedCount} courses`,
      data: {
        foundCourses: coursesWithoutIsActive.length,
        modifiedCount: updateResult.modifiedCount,
        matchedCount: updateResult.matchedCount
      }
    });

  } catch (error) {
    console.error('Fix courses error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix courses',
      details: error
    }, { status: 500 });
  }
}