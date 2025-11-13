import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import { authenticate, requireRole } from '@/lib/auth';

// GET /api/courses/[id] - Get course by ID with modules and lessons
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: courseId } = await params;

    // Find course and populate related data
    const course = await Course.findById(courseId)
      .populate('createdBy', 'name email')
      .lean();

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course is public or user has access
    if (course.visibility === 'private') {
      const { user, error } = await authenticate(request);
      
      // If no authentication and course is private, deny access
      if (error || !user) {
        return NextResponse.json(
          { success: false, error: 'Access denied. Course is private.' },
          { status: 403 }
        );
      }

      // Check if user is creator or admin
      const isCreator = (user._id as any).toString() === (course.createdBy as any)._id.toString();
      const isAdmin = user.role === 'admin';
      
      if (!isCreator && !isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Access denied. You do not have permission to view this course.' },
          { status: 403 }
        );
      }
    }

    // Get lessons for each module
    const courseWithLessons = { ...course };
    
    if (course.modules && course.modules.length > 0) {
      const modulesWithLessons = await Promise.all(
        course.modules.map(async (module: any) => {
          if (module.lessons && module.lessons.length > 0) {
            const lessons = await Lesson.find({
              _id: { $in: module.lessons }
            })
            .select('title type content videoUrl duration order difficulty resources courseId moduleId')
            .sort({ order: 1 })
            .lean();
            
            return {
              ...module,
              lessons
            };
          }
          return module;
        })
      );
      
      courseWithLessons.modules = modulesWithLessons;
    }

    return NextResponse.json({
      success: true,
      data: courseWithLessons
    });

  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update course (creator or admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this course
    const isCreator = (user._id as any).toString() === course.createdBy.toString();
    const isAdmin = user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You can only update your own courses.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Fields that can be updated
    const allowedUpdates = ['title', 'description', 'category', 'tags', 'thumbnail', 'price', 'visibility'];
    const updates: any = {};

    // Only include allowed fields in update
    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    // Update the course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      data: updatedCourse,
      message: 'Course updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating course:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Course with this title already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete course (creator or admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this course
    const isCreator = (user._id as any).toString() === course.createdBy.toString();
    const isAdmin = user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied. You can only delete your own courses.'
        },
        { status: 403 }
      );
    }

    // HARD DELETE - Actually remove from database
    console.log('Deleting course:', courseId);
    
    // 1. Delete all lessons in this course first
    const lessonDeleteResult = await Lesson.deleteMany({ courseId: courseId });

    // 2. Delete the course itself
    const courseDeleteResult = await Course.findByIdAndDelete(courseId);

    return NextResponse.json({
      success: true,
      message: 'Course and all its content deleted permanently'
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}