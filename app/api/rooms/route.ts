import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import ExamQuiz from '@/models/ExamQuiz';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// GET /api/rooms - Get rooms by teacher
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const rooms = await Room.findByTeacher(auth.userId!);
    
    return NextResponse.json({ rooms }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/rooms - Create new room
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/rooms - Starting authentication check...');
    
    // Debug: Check headers
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    
    const auth = await verifyAuth(request);
    console.log('Auth result:', { 
      success: auth.success, 
      hasUser: !!auth.user, 
      userRole: auth.user?.role,
      error: auth.error 
    });
    
    if (!auth.success || auth.user?.role !== 'teacher') {
      console.log('Authentication failed - returning 401');
      return NextResponse.json({ 
        error: auth.error || 'Unauthorized - must be teacher' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, examQuizId, duration, maxStudents, settings } = body;

    // Validate required fields
    if (!title || !examQuizId || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Verify exam quiz exists and belongs to teacher
    const examQuiz = await ExamQuiz.findOne({ _id: examQuizId, createdBy: auth.userId, isActive: true });
    if (!examQuiz) {
      return NextResponse.json({ error: 'Exam quiz not found or not accessible' }, { status: 404 });
    }

    // Generate unique room code
    let roomCode = '';
    let isUnique = false;
    
    while (!isUnique) {
      roomCode = Room.generateRoomCode();
      const existingRoom = await Room.findOne({ roomCode });
      if (!existingRoom) {
        isUnique = true;
      }
    }

    const room = new Room({
      teacherId: auth.userId,
      title,
      description,
      examQuizId,
      roomCode,
      duration,
      maxStudents,
      settings: {
        shuffleQuestions: settings?.shuffleQuestions || false,
        shuffleOptions: settings?.shuffleOptions || false,
        showCorrectAnswers: settings?.showCorrectAnswers || true,
        allowReview: settings?.allowReview || true,
      },
    });

    await room.save();
    
    const populatedRoom = await Room.findById(room._id)
      .populate('examQuizId', 'title questions')
      .populate('teacherId', 'name email');

    return NextResponse.json({ 
      room: populatedRoom,
      message: 'Room created successfully' 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}