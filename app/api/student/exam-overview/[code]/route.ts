import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import Submission from '@/models/Submission';
import User from '@/models/User';
import ExamQuiz from '@/models/ExamQuiz';
import { verifyToken } from '@/lib/auth';

// Get class statistics overview for a published exam
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    await connectDB();

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch user from database to get role
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized - Only students can access this' },
        { status: 403 }
      );
    }

    const { code } = params;

    // Find room and check if analysis is published
    const room = await Room.findOne({ roomCode: code })
      .populate('examQuizId')
      .populate('teacherId', 'name email');

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    if (!room.publishAnalysis) {
      return NextResponse.json(
        { error: 'Statistics have not been published yet' },
        { status: 403 }
      );
    }

    // Get all submissions for this room
    const submissions = await Submission.find({
      roomId: room._id,
      status: 'submitted'
    }).populate('studentId', 'name email');

    console.log('📊 Total submissions for overview:', submissions.length);

    return NextResponse.json({
      success: true,
      room,
      submissions
    });

  } catch (error: any) {
    console.error('❌ Error fetching exam overview:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
