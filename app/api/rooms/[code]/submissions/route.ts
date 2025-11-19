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

// GET /api/rooms/[code]/submissions - Get all submissions for a room (teacher only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view submissions' }, { status: 401 });
    }

    await connectDB();
    
    const room = await Room.findByCode(code);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    console.log('📋 Room found:', { code, roomId: room._id, teacherId: room.teacherId });

    // Verify teacher owns this room
    // teacherId might be populated or just an ObjectId
    const roomTeacherId = typeof room.teacherId === 'object' && room.teacherId._id 
      ? room.teacherId._id.toString()
      : room.teacherId.toString();
    
    const requestUserId = (user as any)._id.toString();

    if (roomTeacherId !== requestUserId) {
      console.log('❌ Access denied:', { roomTeacher: roomTeacherId, requestUser: requestUserId });
      return NextResponse.json({ error: 'Access denied to this room' }, { status: 403 });
    }

    // Find all submissions for this room
    const submissions = await Submission.find({
      roomId: room._id,
    })
    .populate('studentId', 'name email')
    .sort({ submittedAt: -1 });

    console.log('✅ Found submissions:', submissions.length);

    return NextResponse.json({ 
      submissions: submissions.map(s => s.toObject())
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
