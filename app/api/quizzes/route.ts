import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quiz from '@/models/Quiz';
import { authenticate, requireRole } from '@/lib/auth';

// GET /api/quizzes - Get all quizzes with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const lessonId = searchParams.get('lessonId');
    const createdBy = searchParams.get('createdBy');
    const isActive = searchParams.get('isActive');
    const keyword = searchParams.get('q') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter query
    const filter: any = {};

    // Add lesson filter
    if (lessonId) {
      filter.lessonId = lessonId;
    }

    // Add creator filter
    if (createdBy) {
      filter.createdBy = createdBy;
    }

    // Add active status filter
    if (isActive !== null && isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Add keyword search
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [quizzes, total] = await Promise.all([
      Quiz.find(filter)
        .populate('createdBy', 'name email')
        .populate('lessonId', 'title')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Quiz.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      data: quizzes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch quizzes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/quizzes - Create a new quiz
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Authenticate user
    const authResult = await authenticate(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has teacher role
    const roleChecker = requireRole(['teacher', 'admin']);
    const roleCheck = roleChecker(authResult.user);
    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: roleCheck.error || 'Teacher or admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Received quiz data:', body); // Debug log
    
    const {
      lessonId,
      title,
      description,
      questions,
      timeLimit,
      passingScore,
      allowMultipleAttempts,
      maxAttempts,
      showCorrectAnswers,
      shuffleQuestions,
      shuffleOptions
    } = body;
    
    console.log('Parsed questions:', questions); // Debug log

    // Validate required fields
    if (!lessonId || !title || !questions || questions.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: lessonId, title, and at least one question are required' 
        },
        { status: 400 }
      );
    }

    // Validate questions format
    for (const [index, question] of questions.entries()) {
      console.log(`Validating question ${index + 1}:`, question); // Debug log
      
      if (!question.text || !question.type) {
        return NextResponse.json(
          {
            success: false,
            error: `Question ${index + 1} is missing required fields (text and type)`
          },
          { status: 400 }
        );
      }

      if (question.type === 'multiple-choice') {
        // Check if options exists and is an array
        if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
          return NextResponse.json(
            {
              success: false,
              error: `Multiple choice question ${index + 1} must have at least 2 options`
            },
            { status: 400 }
          );
        }
        // Safe check for correctIndex with existing options array
        if (question.correctIndex === undefined || question.correctIndex < 0 || question.correctIndex >= question.options.length) {
          return NextResponse.json(
            {
              success: false,
              error: `Multiple choice question ${index + 1} must have a valid correct answer index`
            },
            { status: 400 }
          );
        }
      }

      if (question.type === 'essay') {
        if (!question.maxWords || question.maxWords <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: `Essay question ${index + 1} must have a positive max word count`
            },
            { status: 400 }
          );
        }
      }
    }

    // Create quiz
    const quizData = {
      lessonId,
      title,
      description,
      questions,
      timeLimit,
      passingScore: passingScore || 60,
      allowMultipleAttempts: allowMultipleAttempts !== false,
      maxAttempts,
      showCorrectAnswers: showCorrectAnswers !== false,
      shuffleQuestions: shuffleQuestions || false,
      shuffleOptions: shuffleOptions || false,
      createdBy: authResult.user.id
    };
    
    console.log('Creating quiz with data:', quizData); // Debug log
    
    try {
      const quiz = new Quiz(quizData);
      console.log('Quiz instance created successfully'); // Debug log
      
      const savedQuiz = await quiz.save();
      console.log('Quiz saved successfully:', savedQuiz._id); // Debug log
    
      // Populate related fields for response
      await savedQuiz.populate('createdBy', 'name email');
      await savedQuiz.populate('lessonId', 'title');

      return NextResponse.json({
        success: true,
        data: savedQuiz,
        message: 'Quiz created successfully'
      }, { status: 201 });
      
    } catch (saveError) {
      console.error('Error saving quiz:', saveError);
      throw saveError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}