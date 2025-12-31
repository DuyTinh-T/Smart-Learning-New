import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import User from '@/models/User';
import ExamQuiz from '@/models/ExamQuiz';
import { verifyToken } from '@/lib/auth';

export async function POST(
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

    console.log('🔑 User info:', {
      userId: user._id,
      role: user.role,
      isTeacher: user.role === 'teacher'
    });

    if (user.role !== 'teacher') {
      console.log('❌ Role check failed:', user.role);
      return NextResponse.json(
        { error: 'Unauthorized - Only teachers can publish results' },
        { status: 403 }
      );
    }

    const { code } = params;
    const { publish } = await request.json();

    // Find room and verify ownership
    const room = await Room.findOne({ roomCode: code }).populate('examQuizId');
    
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    console.log('🔍 Ownership check:', {
      roomTeacherId: room.teacherId.toString(),
      userId: user._id.toString(),
      match: room.teacherId.toString() === user._id.toString()
    });

    if (room.teacherId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized - You are not the owner of this room' },
        { status: 403 }
      );
    }

    // Update publish status
    room.publishAnalysis = publish;
    await room.save();

    return NextResponse.json({
      success: true,
      room: {
        _id: room._id,
        publishAnalysis: room.publishAnalysis
      }
    });

  } catch (error: any) {
    console.error('❌ Error toggling publish status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
