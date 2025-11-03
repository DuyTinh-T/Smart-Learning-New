import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quiz from '@/models/Quiz';
import { authenticate, requireRole } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/quizzes/[id] - Get a specific quiz by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid quiz ID format' },
        { status: 400 }
      );
    }

    // Find quiz by ID
    const quiz = await Quiz.findById(id)
      .populate('createdBy', 'name email')
      .populate('lessonId', 'title')
      .lean();

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quiz
    });

  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/quizzes/[id] - Update a specific quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid quiz ID format' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authResult = await authenticate(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Find existing quiz
    const existingQuiz = await Quiz.findById(id);
    if (!existingQuiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator or has admin role
    const isCreator = existingQuiz.createdBy.toString() === authResult.user.id;
    const roleChecker = requireRole(['admin']);
    const isAdmin = roleChecker(authResult.user).authorized;

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Permission denied. You can only edit your own quizzes or need admin role' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      questions,
      timeLimit,
      passingScore,
      allowMultipleAttempts,
      maxAttempts,
      showCorrectAnswers,
      shuffleQuestions,
      shuffleOptions,
      isActive
    } = body;

    // Validate questions format if provided
    if (questions) {
      if (questions.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Quiz must have at least one question' },
          { status: 400 }
        );
      }

      for (const [index, question] of questions.entries()) {
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
          if (!question.options || question.options.length < 2) {
            return NextResponse.json(
              {
                success: false,
                error: `Multiple choice question ${index + 1} must have at least 2 options`
              },
              { status: 400 }
            );
          }
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
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (questions !== undefined) updateData.questions = questions;
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit;
    if (passingScore !== undefined) updateData.passingScore = passingScore;
    if (allowMultipleAttempts !== undefined) updateData.allowMultipleAttempts = allowMultipleAttempts;
    if (maxAttempts !== undefined) updateData.maxAttempts = maxAttempts;
    if (showCorrectAnswers !== undefined) updateData.showCorrectAnswers = showCorrectAnswers;
    if (shuffleQuestions !== undefined) updateData.shuffleQuestions = shuffleQuestions;
    if (shuffleOptions !== undefined) updateData.shuffleOptions = shuffleOptions;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update quiz
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'name email')
     .populate('lessonId', 'title');

    return NextResponse.json({
      success: true,
      data: updatedQuiz,
      message: 'Quiz updated successfully'
    });

  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/quizzes/[id] - Delete a specific quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid quiz ID format' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authResult = await authenticate(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Find existing quiz
    const existingQuiz = await Quiz.findById(id);
    if (!existingQuiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator or has admin role
    const isCreator = existingQuiz.createdBy.toString() === authResult.user.id;
    const roleChecker = requireRole(['admin']);
    const isAdmin = roleChecker(authResult.user).authorized;

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Permission denied. You can only delete your own quizzes or need admin role' },
        { status: 403 }
      );
    }

    // Check if we should do a soft delete (set isActive to false) or hard delete
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete && isAdmin) {
      // Hard delete (only for admins)
      await Quiz.findByIdAndDelete(id);
      return NextResponse.json({
        success: true,
        message: 'Quiz permanently deleted'
      });
    } else {
      // Soft delete (set isActive to false)
      const deletedQuiz = await Quiz.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      ).populate('createdBy', 'name email')
       .populate('lessonId', 'title');

      return NextResponse.json({
        success: true,
        data: deletedQuiz,
        message: 'Quiz deactivated successfully'
      });
    }

  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}