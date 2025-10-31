import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import Quiz from '@/models/Quiz';
import { authenticate, requireRole } from '@/lib/auth';

// GET /api/lessons/[id] - Get lesson by ID with quiz metadata (without revealing answers unless teacher/admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: lessonId } = await params;

    // Find lesson and populate related data
    const lesson = await Lesson.findById(lessonId)
      .populate('courseId', 'title visibility createdBy')
      .lean();

    if (!lesson || !lesson.isActive) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if course is public or user has access
    const course = lesson.courseId as any;
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
      const isCreator = (user._id as any).toString() === course.createdBy.toString();
      const isAdmin = user.role === 'admin';
      
      if (!isCreator && !isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Access denied. You do not have permission to view this lesson.' },
          { status: 403 }
        );
      }
    }

    // Get quiz metadata for this lesson (if any)
    const quizzes = await Quiz.find({ lessonId: lessonId })
      .select('title timeLimit questions.length')
      .lean();

    // Transform quiz data to hide answers from students
    const { user } = await authenticate(request);
    const isTeacherOrAdmin = user && (user.role === 'teacher' || user.role === 'admin');
    const isLessonCreator = user && (user._id as any).toString() === course.createdBy.toString();

    const lessonData = {
      ...lesson,
      quizzes: quizzes.map(quiz => ({
        _id: quiz._id,
        title: quiz.title,
        timeLimit: quiz.timeLimit,
        questionCount: quiz.questions?.length || 0
      }))
    };

    // If user is not teacher/admin/creator, remove sensitive content
    if (!isTeacherOrAdmin && !isLessonCreator) {
      // Students can see basic lesson info but might have restricted access to certain content
      lessonData.content = lesson.content; // Keep content for now, but you might want to restrict based on enrollment
    }

    return NextResponse.json({
      success: true,
      data: lessonData
    });

  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

// PUT /api/lessons/[id] - Update lesson (creator or admin only)
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

    const { id: lessonId } = await params;

    // Find the lesson and its course
    const lesson = await Lesson.findById(lessonId).populate('courseId', 'createdBy');
    if (!lesson || !lesson.isActive) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this lesson
    const course = lesson.courseId as any;
    const isCreator = (user._id as any).toString() === course.createdBy.toString();
    const isAdmin = user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You can only update lessons in your own courses.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Fields that can be updated
    const allowedUpdates = ['title', 'type', 'content', 'resources', 'duration', 'order', 'difficulty'];
    const updates: any = {};

    // Only include allowed fields in update
    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    // If order is being updated, check for conflicts
    if (updates.order && updates.order !== lesson.order) {
      const existingLesson = await Lesson.findOne({
        courseId: lesson.courseId,
        moduleId: lesson.moduleId,
        order: updates.order,
        isActive: true,
        _id: { $ne: lessonId }
      });

      if (existingLesson) {
        return NextResponse.json(
          { success: false, error: `Lesson with order ${updates.order} already exists in this module` },
          { status: 400 }
        );
      }
    }

    // Update the lesson
    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('courseId', 'title');

    return NextResponse.json({
      success: true,
      data: updatedLesson,
      message: 'Lesson updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating lesson:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

// DELETE /api/lessons/[id] - Delete lesson (creator or admin only)
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

    const { id: lessonId } = await params;

    // Find the lesson and its course
    const lesson = await Lesson.findById(lessonId).populate('courseId', 'createdBy');
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this lesson
    const course = lesson.courseId as any;
    const isCreator = (user._id as any).toString() === course.createdBy.toString();
    const isAdmin = user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You can only delete lessons from your own courses.' },
        { status: 403 }
      );
    }

    // HARD DELETE - Actually remove from database
    console.log('Performing hard delete of lesson:', lessonId);

    // 1. Remove lesson from module's lessons array
    await Course.updateOne(
      { 'modules.lessons': lessonId },
      { $pull: { 'modules.$.lessons': lessonId }, updatedAt: new Date() }
    );

    // 2. Delete any quizzes associated with this lesson
    const quizDeleteResult = await Quiz.deleteMany({ lessonId: lessonId });

    // 3. Delete the lesson itself
    const lessonDeleteResult = await Lesson.findByIdAndDelete(lessonId);

    return NextResponse.json({
      success: true,
      message: 'Lesson and associated content deleted permanently',
      details: {
        quizzesDeleted: quizDeleteResult.deletedCount,
        lessonDeleted: !!lessonDeleteResult
      }
    });

  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}