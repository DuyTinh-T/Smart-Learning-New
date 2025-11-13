import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import { authenticate, requireRole } from '@/lib/auth';

// POST /api/modules/[moduleId]/lessons - Add a lesson to a module
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
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

    // Check if user has permission to create lessons (teacher/admin only)
    const roleCheck = requireRole(['teacher', 'admin'])(user);
    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: roleCheck.error },
        { status: 403 }
      );
    }

    const { moduleId } = await params;

    // Find the course that contains this module
    const course = await Course.findOne({ 'modules._id': moduleId });
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Find the specific module
    const module = course.modules.find(m => m._id?.toString() === moduleId);
    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
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
    const { title, type, content, videoUrl, resources, duration, order, difficulty } = body;
    
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Lesson title is required' },
        { status: 400 }
      );
    }

    // Validate video URL for video lessons
    if (type === 'video' && !videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Video URL is required for video lessons' },
        { status: 400 }
      );
    }

    // Determine order if not provided
    let lessonOrder = order;
    if (!lessonOrder) {
      // Get the highest order number from existing lessons in this module
      const existingLessons = await Lesson.find({ 
        _id: { $in: module.lessons },
        isActive: true 
      }).select('order');
      
      const maxOrder = Math.max(...existingLessons.map(l => l.order || 0), 0);
      lessonOrder = maxOrder + 1;
    }

    // Check if order already exists in this module. If so, shift orders for existing lessons
    const existingLesson = await Lesson.findOne({
      _id: { $in: module.lessons },
      order: lessonOrder,
      isActive: true
    });

    if (existingLesson) {
      // Shift all lessons in this module with order >= lessonOrder by +1
      await Lesson.updateMany(
        { _id: { $in: module.lessons }, order: { $gte: lessonOrder }, isActive: true },
        { $inc: { order: 1 } }
      );
    }

    // Create lesson data
    const lessonData = {
      title: title.trim(),
      type: type || 'text',
      content: content || '',
      videoUrl: type === 'video' ? videoUrl : undefined,
      resources: Array.isArray(resources) ? resources : [],
      duration: duration || undefined,
      courseId: course._id,
      moduleId: moduleId,
      order: lessonOrder,
      difficulty: difficulty || 'beginner'
    };

    // Create new lesson
    const lesson = new Lesson(lessonData);
    await lesson.save();

    // Add lesson to module's lessons array
    module.lessons.push(lesson._id as any);
    course.updatedAt = new Date();
    await course.save();

    return NextResponse.json(
      {
        success: true,
        data: lesson,
        message: 'Lesson created successfully'
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating lesson:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}

// GET /api/modules/[moduleId]/lessons - Get all lessons for a module
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    await connectDB();

    const { moduleId } = await params;

    // Find the course that contains this module
    const course = await Course.findOne({ 'modules._id': moduleId })
      .select('modules title visibility createdBy')
      .populate('createdBy', 'name email')
      .lean();

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Find the specific module
    const module = course.modules.find(m => m._id?.toString() === moduleId);
    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
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

    // Get lessons for this module
    const lessons = await Lesson.find({ 
      _id: { $in: module.lessons },
      isActive: true 
    })
    .select('title type duration order difficulty createdAt')
    .sort({ order: 1 })
    .lean();

    return NextResponse.json({
      success: true,
      data: {
        moduleId: module._id,
        moduleTitle: module.title,
        courseId: course._id,
        courseTitle: course.title,
        lessons
      }
    });

  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}