import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import Submission from '@/models/Submission';
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

// POST /api/rooms/[code]/join - Student joins room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can join rooms' }, { status: 401 });
    }

    await connectDB();
    
    const { code } = await params;
    const room = await Room.findByCode(code);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status === 'ended') {
      return NextResponse.json({ error: 'This room has ended' }, { status: 400 });
    }

    // Check if student is banned from this room
    if (room.bannedStudents && room.bannedStudents.length > 0) {
      const isBanned = room.bannedStudents.some(id => id.toString() === (user as any)._id.toString());
      if (isBanned) {
        return NextResponse.json({ 
          error: 'You have been banned from this room',
          banned: true 
        }, { status: 403 });
      }
    }

    // Check if student is allowed (if allowedStudents is set)
    if (room.allowedStudents && room.allowedStudents.length > 0) {
      const isAllowed = room.allowedStudents.some(id => id.toString() === (user as any)._id.toString());
      if (!isAllowed) {
        return NextResponse.json({ error: 'You are not allowed to join this room' }, { status: 403 });
      }
    }

    // Check if room is full (if maxStudents is set)
    if (room.maxStudents) {
      const existingSubmissions = await Submission.countDocuments({ roomId: room._id });
      if (existingSubmissions >= room.maxStudents) {
        return NextResponse.json({ 
          error: `This exam room is full. Maximum capacity: ${room.maxStudents} students.`,
          roomFull: true 
        }, { status: 400 });
      }
    }

    // Check if student already has a submission for this room
    const existingSubmission = await Submission.findOne({
      roomId: room._id,
      studentId: (user as any)._id,
    });

    if (existingSubmission) {
      return NextResponse.json({ 
        room: room.toObject(),
        submission: existingSubmission.toObject(),
        message: 'Already joined this room' 
      }, { status: 200 });
    }

    // Create new submission record
    const submission = new Submission({
      roomId: room._id,
      studentId: (user as any)._id,
      quizId: room.examQuizId,
      answers: [],
      score: 0,
      totalPoints: 0,
      percentage: 0,
      startedAt: new Date(),
      status: 'in-progress',
    });

    await submission.save();

    // Get populated room data
    const populatedRoom = await Room.findById(room._id)
      .populate('examQuizId')
      .populate('teacherId', 'name email');

    return NextResponse.json({ 
      room: populatedRoom,
      submission: submission.toObject(),
      message: 'Successfully joined room' 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}