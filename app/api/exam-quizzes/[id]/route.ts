import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth';
import ExamQuiz from '@/models/ExamQuiz';

// GET /api/exam-quizzes/[id] - Get a specific exam quiz
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.user?.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view exam quizzes' }, { status: 403 });
    }

    const examQuiz = await ExamQuiz.findOne({
      _id: id,
      createdBy: auth.user.id,
      isActive: true
    });

    if (!examQuiz) {
      return NextResponse.json({ error: 'Exam quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ examQuiz });
  } catch (error) {
    console.error('GET /api/exam-quizzes/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam quiz' },
      { status: 500 }
    );
  }
}

// PUT /api/exam-quizzes/[id] - Update an exam quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.user?.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can update exam quizzes' }, { status: 403 });
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

    // Find and verify ownership
    const examQuiz = await ExamQuiz.findOne({
      _id: id,
      createdBy: auth.user.id,
      isActive: true
    });

    if (!examQuiz) {
      return NextResponse.json({ error: 'Exam quiz not found' }, { status: 404 });
    }

    // Validation
    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
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
    }

    // Update the quiz
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (questions) updateData.questions = questions;
    if (timeLimit) updateData.timeLimit = timeLimit;
    if (passingScore !== undefined) updateData.passingScore = passingScore;
    if (shuffleQuestions !== undefined) updateData.shuffleQuestions = shuffleQuestions;
    if (shuffleOptions !== undefined) updateData.shuffleOptions = shuffleOptions;
    if (showCorrectAnswers !== undefined) updateData.showCorrectAnswers = showCorrectAnswers;
    updateData.updatedAt = new Date();

    const updatedExamQuiz = await ExamQuiz.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return NextResponse.json({
      message: 'Exam quiz updated successfully',
      examQuiz: updatedExamQuiz
    });

  } catch (error) {
    console.error('PUT /api/exam-quizzes/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update exam quiz' },
      { status: 500 }
    );
  }
}

// DELETE /api/exam-quizzes/[id] - Soft delete an exam quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.user?.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can delete exam quizzes' }, { status: 403 });
    }

    // Find and verify ownership
    const examQuiz = await ExamQuiz.findOne({
      _id: id,
      createdBy: auth.user.id,
      isActive: true
    });

    if (!examQuiz) {
      return NextResponse.json({ error: 'Exam quiz not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await ExamQuiz.findByIdAndUpdate(id, { 
      isActive: false,
      updatedAt: new Date()
    });

    return NextResponse.json({
      message: 'Exam quiz deleted successfully'
    });

  } catch (error) {
    console.error('DELETE /api/exam-quizzes/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete exam quiz' },
      { status: 500 }
    );
  }
}