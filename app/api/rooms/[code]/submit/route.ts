import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import Submission from '@/models/Submission';
import Quiz from '@/models/Quiz';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  await connectDB();
  const user = await User.findById(decoded.userId);
  return user;
}

// POST /api/rooms/[code]/submit - Submit exam answers
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can submit exams' }, { status: 401 });
    }

    const body = await request.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Answers array is required' }, { status: 400 });
    }

    await connectDB();
    
    const room = await Room.findByCode(params.code);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status === 'ended') {
      return NextResponse.json({ error: 'This exam has ended' }, { status: 400 });
    }

    // Find student's submission
    const submission = await Submission.findOne({
      roomId: room._id,
      studentId: (user as any)._id,
    });

    if (!submission) {
      return NextResponse.json({ error: 'No submission found. Please join the room first.' }, { status: 404 });
    }

    if (submission.status !== 'in-progress') {
      return NextResponse.json({ error: 'Submission has already been completed' }, { status: 400 });
    }

    // Get quiz to calculate score
    const quiz = await Quiz.findById(room.quizId);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Calculate score
    let totalScore = 0;
    let totalPoints = 0;
    const processedAnswers = [];

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const question = quiz.questions[i];
      
      if (!question || !question._id) continue;

      let isCorrect = false;
      let points = 0;

      if (question.type === 'multiple-choice') {
        isCorrect = answer.answer === question.correctIndex;
        points = isCorrect ? question.points : 0;
      } else if (question.type === 'essay') {
        // For essay questions, default to 0 points (needs manual grading)
        points = 0;
        isCorrect = false;
      }

      processedAnswers.push({
        questionId: question._id,
        answer: answer.answer,
        isCorrect,
        points,
        timeTaken: answer.timeTaken || 0,
      });

      totalScore += points;
      totalPoints += question.points;
    }

    // Update submission
    submission.answers = processedAnswers;
    submission.score = totalScore;
    submission.totalPoints = totalPoints;
    submission.percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
    submission.status = 'submitted';
    submission.submittedAt = new Date();
    
    if (submission.startedAt) {
      submission.timeSpent = Math.floor((submission.submittedAt.getTime() - submission.startedAt.getTime()) / 1000);
    }

    await submission.save();

    return NextResponse.json({ 
      submission: submission.toObject(),
      message: 'Exam submitted successfully' 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error submitting exam:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}