import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import { authenticate, requireRole } from '@/lib/auth';

// POST /api/courses/[id]/modules - Add a module to a course
export async function POST(
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

    // Check if user has permission to create modules (teacher/admin only)
    const roleCheck = requireRole(['teacher', 'admin'])(user);
    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: roleCheck.error },
        { status: 403 }
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

    // Check if user has permission to modify this course
    const isCreator = (user._id as any).toString() === course.createdBy.toString();
    const isAdmin = user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You can only modify your own courses.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const { title, order } = body;
    
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Module title is required' },
        { status: 400 }
      );
    }

    // Determine order if not provided
    let moduleOrder = order;
    if (!moduleOrder) {
      // Get the highest order number and add 1
      const maxOrder = Math.max(...course.modules.map(m => m.order || 0), 0);
      moduleOrder = maxOrder + 1;
    }

    // Check if order already exists
    const existingModule = course.modules.find(m => m.order === moduleOrder);
    if (existingModule) {
      return NextResponse.json(
        { success: false, error: `Module with order ${moduleOrder} already exists` },
        { status: 400 }
      );
    }

    // Create new module
    const newModule = {
      title: title.trim(),
      order: moduleOrder,
      lessons: []
    };

    // Add module to course
    course.modules.push(newModule);
    course.updatedAt = new Date();
    
    await course.save();

    // Get the newly created module (it will have an _id after save)
    const createdModule = course.modules[course.modules.length - 1];

    return NextResponse.json(
      {
        success: true,
        data: createdModule,
        message: 'Module created successfully'
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating module:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create module' },
      { status: 500 }
    );
  }
}

// GET /api/courses/[id]/modules - Get all modules for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: courseId } = await params;

    // Find the course
    const course = await Course.findById(courseId)
      .select('modules title visibility createdBy')
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

    // Sort modules by order
    const sortedModules = course.modules.sort((a, b) => (a.order || 0) - (b.order || 0));

    return NextResponse.json({
      success: true,
      data: {
        courseId: course._id,
        courseTitle: course.title,
        modules: sortedModules
      }
    });

  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}