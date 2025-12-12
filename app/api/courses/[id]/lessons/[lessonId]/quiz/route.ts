import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import Quiz from '@/models/Quiz';
import { authenticate } from '@/lib/auth';

// GET /api/courses/[id]/lessons/[lessonId]/quiz - Get quiz data for a lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    await connectDB();

    const { id: courseId, lessonId } = await params;

    // Find the lesson and course
    const lesson = await Lesson.findById(lessonId).populate('courseId', 'title visibility createdBy');
    if (!lesson || !lesson.isActive) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Verify lesson belongs to the specified course
    if (lesson.courseId._id.toString() !== courseId) {
      return NextResponse.json(
        { success: false, error: 'Lesson does not belong to this course' },
        { status: 400 }
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

      // Check if user is enrolled, creator, or admin
      const isCreator = (user._id as any).toString() === course.createdBy.toString();
      const isAdmin = user.role === 'admin';
      
      if (!isCreator && !isAdmin) {
        // TODO: Add enrollment check here
        // For now, allow access to authenticated users
      }
    }

    // Try to find quiz data in different places
    let quizData = null;

    // 1. Check if there's a dedicated Quiz document for this lesson
    const quizDocument = await Quiz.findOne({ lessonId: lessonId });
    if (quizDocument) {
      // Return quiz without correct answers for students
      const { user } = await authenticate(request);
      const isTeacherOrAdmin = user && (user.role === 'teacher' || user.role === 'admin');
      const isLessonCreator = user && (user._id as any).toString() === course.createdBy.toString();
      
      if (isTeacherOrAdmin || isLessonCreator) {
        // Teachers and admins get full quiz with answers
        quizData = {
          title: quizDocument.title,
          description: quizDocument.description,
          timeLimit: quizDocument.timeLimit,
          questions: quizDocument.questions
        };
      } else {
        // Students get quiz without correct answers
        quizData = {
          title: quizDocument.title,
          description: quizDocument.description,
          timeLimit: quizDocument.timeLimit,
          questions: quizDocument.questions.map((q: any) => ({
            question: q.question,
            options: q.options,
            explanation: q.explanation
            // Remove correctAnswer for students
          }))
        };
      }
    }
    // 2. Check if quiz data is embedded in lesson content
    else if (lesson.content && typeof lesson.content === 'string') {
      try {
        const parsedContent = JSON.parse(lesson.content);
        if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
          quizData = {
            title: lesson.title,
            description: parsedContent.description || 'Choose the correct answer for each question below.',
            questions: parsedContent.questions
          };
        }
      } catch (error) {
        // Content is not JSON, might be markdown
      }
    }
    // 3. Check if lesson has quiz field
    else if ((lesson as any).quiz && typeof (lesson as any).quiz === 'object') {
      const quiz = (lesson as any).quiz;
      if (quiz.questions && Array.isArray(quiz.questions)) {
        quizData = {
          title: lesson.title,
          description: quiz.description || 'Choose the correct answer for each question below.',
          questions: quiz.questions
        };
      }
    }

    if (!quizData) {
      return NextResponse.json(
        { success: false, error: 'No quiz data found for this lesson' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quizData
    });

  } catch (error) {
    console.error('Error fetching quiz data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quiz data' },
      { status: 500 }
    );
  }
}