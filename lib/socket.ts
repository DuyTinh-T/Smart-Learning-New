import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';
import redis from '@/lib/redis';
import connectDB from '@/lib/mongodb';
import Room, { IRoom } from '@/models/Room';
import Submission from '@/models/Submission';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export interface RoomState {
  roomId: string;
  roomCode: string;
  status: 'waiting' | 'running' | 'ended';
  participants: {
    [socketId: string]: {
      userId: string;
      name: string;
      role: 'teacher' | 'student';
      joinedAt: Date;
    };
  };
  startTime?: Date;
  endTime?: Date;
  duration: number;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  console.log('🚀 Socket.IO is initializing...');
  const io = new ServerIO(res.socket.server);
  res.socket.server.io = io;

  const onConnection = (socket: any) => {
    console.log(`👤 User connected: ${socket.id}`);

    // Join room event
    socket.on('join-room', async (data: {
      roomCode: string;
      userId: string;
      userName: string;
      role: 'teacher' | 'student';
    }) => {
      try {
        await connectDB();
        const room: IRoom | null = await Room.findByCode(data.roomCode);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.status === 'ended') {
          socket.emit('error', { message: 'This room has ended' });
          return;
        }

        if (data.role === 'teacher' && room.teacherId.toString() !== data.userId) {
          socket.emit('error', { message: 'You are not the teacher of this room' });
          return;
        }

        if (data.role === 'student' && room.maxStudents) {
          const roomState = await getRoomState((room as any)._id.toString());
          const studentCount = Object.values(roomState?.participants || {})
            .filter(p => p.role === 'student').length;

          if (studentCount >= room.maxStudents) {
            socket.emit('error', { message: 'Room is full' });
            return;
          }
        }

        socket.join(data.roomCode);
        socket.roomCode = data.roomCode;
        socket.userId = data.userId;
        socket.role = data.role;

        await updateRoomParticipant((room as any)._id.toString(), socket.id, {
          userId: data.userId,
          name: data.userName,
          role: data.role,
          joinedAt: new Date(),
        });

        const roomState = await getRoomState((room as any)._id.toString());
        const participantsList = Object.values(roomState?.participants || {});

        io.to(data.roomCode).emit('room-update', {
          room: room.toObject(),
          participants: participantsList,
          totalStudents: participantsList.filter(p => p.role === 'student').length,
          totalParticipants: participantsList.length,
        });

        socket.emit('joined-room', {
          message: 'Successfully joined room',
          room: room.toObject(),
          role: data.role,
        });

        console.log(`📚 ${data.userName} (${data.role}) joined room ${data.roomCode}`);

      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Start exam
    socket.on('start-exam', async (data: { roomCode: string; teacherId: string }) => {
      try {
        await connectDB();
        const room: IRoom | null = await Room.findByCode(data.roomCode);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.teacherId.toString() !== data.teacherId) {
          socket.emit('error', { message: 'Only the teacher can start the exam' });
          return;
        }

        if (room.status !== 'waiting') {
          socket.emit('error', { message: 'Exam has already started or ended' });
          return;
        }

        room.status = 'running';
        room.startTime = new Date();
        room.endTime = new Date(Date.now() + room.duration * 60 * 1000);
        await room.save();

        await updateRoomState((room as any)._id.toString(), {
          status: 'running',
          startTime: room.startTime,
          endTime: room.endTime,
        });

        io.to(data.roomCode).emit('exam-started', {
          message: 'Exam has started!',
          startTime: room.startTime,
          endTime: room.endTime,
          duration: room.duration,
        });

        setTimeout(async () => {
          await handleExamEnd((room as any)._id.toString(), data.roomCode, io);
        }, room.duration * 60 * 1000);

        console.log(`🏁 Exam started in room ${data.roomCode}`);

      } catch (error) {
        console.error('Error starting exam:', error);
        socket.emit('error', { message: 'Failed to start exam' });
      }
    });

    // Submit exam
    socket.on('submit-exam', async (data: {
      roomCode: string;
      studentId: string;
      answers: any[];
    }) => {
      try {
        await connectDB();
        const room: IRoom | null = await Room.findByCode(data.roomCode);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        let submission = await Submission.findOne({
          roomId: (room as any)._id,
          studentId: data.studentId,
        });

        if (!submission) {
          socket.emit('error', { message: 'No submission found' });
          return;
        }

        if (submission.status !== 'in-progress') {
          socket.emit('error', { message: 'Submission already completed' });
          return;
        }

        submission.answers = data.answers;
        submission.status = 'submitted';
        submission.submittedAt = new Date();
        await submission.save();

        socket.emit('exam-submitted', {
          message: 'Exam submitted successfully',
          submission: submission.toObject(),
        });

        socket.to(data.roomCode).emit('student-submitted', {
          studentId: data.studentId,
          submittedAt: submission.submittedAt,
        });

        console.log(`📝 Student submitted exam in room ${data.roomCode}`);

      } catch (error) {
        console.error('Error submitting exam:', error);
        socket.emit('error', { message: 'Failed to submit exam' });
      }
    });

    // Get statistics
    socket.on('get-statistics', async (data: { roomCode: string; teacherId: string }) => {
      try {
        await connectDB();
        const room: IRoom | null = await Room.findByCode(data.roomCode);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.teacherId.toString() !== data.teacherId) {
          socket.emit('error', { message: 'Only teacher can view statistics' });
          return;
        }

        const stats = await Submission.getRoomStatistics((room as any)._id.toString());

        socket.emit('room-statistics', {
          roomId: (room as any)._id,
          statistics: stats[0] || {
            totalSubmissions: 0,
            completedSubmissions: 0,
            inProgressSubmissions: 0,
            averageScore: 0,
            averagePercentage: 0,
            submissions: []
          },
        });

      } catch (error) {
        console.error('Error getting statistics:', error);
        socket.emit('error', { message: 'Failed to get statistics' });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`👋 User disconnected: ${socket.id}`);

      if (socket.roomCode && socket.userId) {
        try {
          const room = await Room.findByCode(socket.roomCode);
          if (room) {
            await removeRoomParticipant((room as any)._id.toString(), socket.id);

            const roomState = await getRoomState((room as any)._id.toString());
            const participantsList = Object.values(roomState?.participants || {});

            socket.to(socket.roomCode).emit('room-update', {
              participants: participantsList,
              totalStudents: participantsList.filter(p => p.role === 'student').length,
              totalParticipants: participantsList.length,
            });
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  };

  io.on('connection', onConnection);

  console.log('✅ Socket.IO server initialized');
  res.end();
};

// Redis helper functions
async function getRoomState(roomId: string): Promise<RoomState | null> {
  try {
    const state = await redis.get(`room:${roomId}`);
    return state ? JSON.parse(state) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

async function updateRoomState(roomId: string, updates: Partial<RoomState>) {
  try {
    const currentState = await getRoomState(roomId);
    const newState = { ...currentState, ...updates };
    await redis.setex(`room:${roomId}`, 3600, JSON.stringify(newState));
  } catch (error) {
    console.error('Redis update error:', error);
  }
}

async function updateRoomParticipant(
  roomId: string,
  socketId: string,
  participant: RoomState['participants'][string]
) {
  try {
    const currentState = await getRoomState(roomId) || {
      roomId,
      roomCode: '',
      status: 'waiting' as const,
      participants: {},
      duration: 0,
    };

    currentState.participants[socketId] = participant;
    await redis.setex(`room:${roomId}`, 3600, JSON.stringify(currentState));
  } catch (error) {
    console.error('Redis participant update error:', error);
  }
}

async function removeRoomParticipant(roomId: string, socketId: string) {
  try {
    const currentState = await getRoomState(roomId);
    if (currentState && currentState.participants[socketId]) {
      delete currentState.participants[socketId];
      await redis.setex(`room:${roomId}`, 3600, JSON.stringify(currentState));
    }
  } catch (error) {
    console.error('Redis participant remove error:', error);
  }
}

async function handleExamEnd(roomId: string, roomCode: string, io: ServerIO) {
  try {
    await connectDB();
    const room = await Room.findById(roomId);

    if (room && room.status === 'running') {
      room.status = 'ended';
      await room.save();

      const inProgressSubmissions = await Submission.find({
        roomId: roomId,
        status: 'in-progress',
      });

      for (const submission of inProgressSubmissions) {
        submission.status = 'auto-submitted';
        submission.submittedAt = new Date();
        await submission.save();
      }

      await updateRoomState(roomId, { status: 'ended' });

      const stats = await Submission.getRoomStatistics(roomId);

      io.to(roomCode).emit('exam-ended', {
        message: 'Time is up! Exam has ended.',
        statistics: stats[0] || {},
      });

      console.log(`⏰ Exam ended in room ${roomCode}`);
    }
  } catch (error) {
    console.error('Error handling exam end:', error);
  }
}

export default SocketHandler;