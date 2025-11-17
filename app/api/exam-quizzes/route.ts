import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth';
import ExamQuiz from '@/models/ExamQuiz';

// GET /api/exam-quizzes - Get all exam quizzes for the teacher
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.user?.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view exam quizzes' }, { status: 403 });
    }

    const examQuizzes = await ExamQuiz.findByTeacher(auth.user.id);

    return NextResponse.json({
      examQuizzes
    });
  } catch (error) {
    console.error('GET /api/exam-quizzes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam quizzes' },
      { status: 500 }
    );
  }
}

// POST /api/exam-quizzes - Create a new exam quiz
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.user?.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can create exam quizzes' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      questions,
      timeLimit,
      passingScore,
      shuffleQuestions,
      shuffleOptions,
      showCorrectAnswers
    } = body;

    // Validation
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one question are required' },
        { status: 400 }
      );
    }

    // Validate questions format
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.text || !question.type) {
        return NextResponse.json(
          { error: `Question ${i + 1}: text and type are required` },
          { status: 400 }
        );
      }

      if (!['multiple-choice', 'essay'].includes(question.type)) {
        return NextResponse.json(
          { error: `Question ${i + 1}: type must be multiple-choice or essay` },
          { status: 400 }
        );
      }

      if (question.type === 'multiple-choice') {
        if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
          return NextResponse.json(
            { error: `Question ${i + 1}: multiple choice questions must have at least 2 options` },
            { status: 400 }
          );
        }
        
        if (question.correctIndex === undefined || 
            question.correctIndex < 0 || 
            question.correctIndex >= question.options.length) {
          return NextResponse.json(
            { error: `Question ${i + 1}: must have a valid correct answer index` },
            { status: 400 }
          );
        }
      }

      if (question.type === 'essay') {
        if (!question.maxWords || question.maxWords <= 0) {
          return NextResponse.json(
            { error: `Question ${i + 1}: essay questions must have a positive max word count` },
            { status: 400 }
          );
        }
      }
    }

    const examQuiz = new ExamQuiz({
      title,
      description,
      questions,
      timeLimit,
      passingScore: passingScore || 60,
      shuffleQuestions: shuffleQuestions || false,
      shuffleOptions: shuffleOptions || false,
      showCorrectAnswers: showCorrectAnswers !== false, // Default true
      createdBy: auth.user?.id
    });

    await examQuiz.save();

    return NextResponse.json({
      message: 'Exam quiz created successfully',
      examQuiz: {
        id: examQuiz._id,
        title: examQuiz.title,
        description: examQuiz.description,
        questionCount: examQuiz.questions.length,
        totalPoints: examQuiz.questions.reduce((total: number, q: any) => total + q.points, 0),
        timeLimit: examQuiz.timeLimit,
        estimatedTime: examQuiz.timeLimit || examQuiz.questions.length * 60,
        passingScore: examQuiz.passingScore,
        settings: {
          shuffleQuestions: examQuiz.shuffleQuestions,
          shuffleOptions: examQuiz.shuffleOptions,
          showCorrectAnswers: examQuiz.showCorrectAnswers
        },
        createdAt: examQuiz.createdAt
      }
    });

  } catch (error) {
    console.error('POST /api/exam-quizzes error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create exam quiz' },
      { status: 500 }
    );
  }
}