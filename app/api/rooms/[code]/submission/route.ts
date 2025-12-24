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

// GET /api/rooms/[code]/submission - Get student's submission for a room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can view their submissions' }, { status: 401 });
    }

    await connectDB();
    
    const room = await Room.findByCode(code);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Find student's submission
    const submission = await Submission.findOne({
      roomId: room._id,
      studentId: (user as any)._id,
    }).populate('quizId', 'type title');

    if (!submission) {
      return NextResponse.json({ error: 'No submission found' }, { status: 404 });
    }

    const submissionObj = submission.toObject();
    console.log('📊 Student submission violations:', submissionObj.violations);

    return NextResponse.json({ 
      submission: submissionObj
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
