import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import User from '@/models/User';
import '@/models/ExamQuiz'; // Import to ensure model is registered
import { verifyToken } from '@/lib/auth';

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    console.log('🔑 Token received:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token) {
      console.log('❌ No token in request');
      return null;
    }
    
    const decoded = verifyToken(token);
    console.log('🔓 Token decoded:', decoded ? `userId: ${decoded.userId}` : 'null');
    
    if (!decoded) {
      console.log('❌ Token verification failed');
      return null;
    }
    
    await connectDB();
    console.log('✅ DB connected, finding user...');
    
    const user = await User.findById(decoded.userId);
    console.log('👤 User found:', user ? `${user.name} (${user._id})` : 'null');
    
    return user;
  } catch (error) {
    console.error('❌ Error in getUserFromRequest:', error);
    return null;
  }
}

// GET /api/rooms/[code] - Get room by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    console.log('📨 GET /api/rooms/[code] - Code:', code);
    console.log('📨 Request URL:', request.url);
    console.log('📨 Request headers:', Object.fromEntries(request.headers.entries()));
    
    const user = await getUserFromRequest(request);
    
    if (!user) {
      console.log('❌ No user found in request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ User authenticated:', user._id, user.role);

    await connectDB();
    
    const room = await Room.findByCode(code);
    
    if (!room) {
      console.log('❌ Room not found:', code);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    console.log('✅ Room found:', room._id, room.status);

    // Check if user has access to this room
    const isTeacher = (room.teacherId as any).toString() === (user as any)._id.toString();
    
    // Student access logic:
    // - If allowedStudents is null/undefined/empty array → allow all students
    // - If allowedStudents has items → only allow students in the list
    const hasStudentRestriction = room.allowedStudents && room.allowedStudents.length > 0;
    const isAllowedStudent = !hasStudentRestriction || 
      (room.allowedStudents?.some(id => id.toString() === (user as any)._id.toString()) ?? false);

    if (!isTeacher && !isAllowedStudent && user.role === 'student') {
      console.log('❌ Access denied for student:', user._id);
      return NextResponse.json({ error: 'Access denied to this room' }, { status: 403 });
    }
    console.log('✅ Access granted -', isTeacher ? 'Teacher' : 'Student');

    // Populate exam quiz data
    try {
      const populatedRoom = await Room.findById(room._id)
        .populate('examQuizId')
        .populate('teacherId', 'name email');

      console.log('✅ Room populated successfully');
      
      return NextResponse.json({ 
        room: populatedRoom,
        userRole: isTeacher ? 'teacher' : 'student'
      }, { status: 200 });
    } catch (populateError) {
      console.error('❌ Error populating room:', populateError);
      // Return unpopulated room if populate fails
      return NextResponse.json({ 
        room: room,
        userRole: isTeacher ? 'teacher' : 'student'
      }, { status: 200 });
    }
    
  } catch (error) {
    console.error('❌ Error fetching room:', error);
    // Log stack trace for better debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

// PUT /api/rooms/[code] - Update room (teacher only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, duration, maxStudents, settings } = body;

    await connectDB();
    
    const room = await Room.findByCode(code);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if ((room.teacherId as any).toString() !== (user as any)._id.toString()) {
      return NextResponse.json({ error: 'Only the room creator can update it' }, { status: 403 });
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Cannot update room after exam has started' }, { status: 400 });
    }

    // Update room fields
    if (title) room.title = title;
    if (description !== undefined) room.description = description;
    if (duration) room.duration = duration;
    if (maxStudents !== undefined) room.maxStudents = maxStudents;
    if (settings) {
      room.settings = {
        ...room.settings,
        ...settings,
      };
    }

    await room.save();
    
    const populatedRoom = await Room.findById(room._id)
      .populate('examQuizId', 'title questions')
      .populate('teacherId', 'name email');

    return NextResponse.json({ 
      room: populatedRoom,
      message: 'Room updated successfully' 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/rooms/[code] - Delete room (teacher only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const room = await Room.findByCode(code);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Extract teacherId (handle both ObjectId and populated object)
    const roomTeacherId = typeof room.teacherId === 'object' && room.teacherId !== null
      ? (room.teacherId as any)._id?.toString() || (room.teacherId as any).toString()
      : room.teacherId.toString();
    
    const userId = (user as any)._id.toString();

    console.log('🗑️ Delete room check:', {
      roomTeacherId,
      userId,
      match: roomTeacherId === userId
    });

    if (roomTeacherId !== userId) {
      return NextResponse.json({ error: 'Only the room creator can delete it' }, { status: 403 });
    }

    if (room.status === 'running') {
      return NextResponse.json({ error: 'Cannot delete room while exam is running' }, { status: 400 });
    }

    await Room.findByIdAndDelete(room._id);

    console.log(`✅ Room ${code} deleted by ${userId}`);

    return NextResponse.json({ 
      message: 'Room deleted successfully' 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}