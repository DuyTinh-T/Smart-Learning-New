require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const cors = require('cors');

// Initialize Express app
const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Socket server is running' });
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-platform')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Import Mongoose models
const RoomSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  examQuizId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamQuiz', required: true },
  roomCode: { type: String, required: true, unique: true },
  status: { type: String, enum: ['waiting', 'running', 'ended'], default: 'waiting' },
  startTime: Date,
  endTime: Date,
  duration: { type: Number, required: true },
  maxStudents: Number,
  settings: {
    allowLateJoin: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: false },
    showResults: { type: Boolean, default: true },
  },
}, { timestamps: true });

RoomSchema.statics.findByCode = function(code) {
  return this.findOne({ roomCode: code }).populate('teacherId').populate('examQuizId');
};

const Room = mongoose.model('Room', RoomSchema);

const SubmissionSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamQuiz', required: true },
  answers: [{
    questionId: String,
    answer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    points: Number,
  }],
  score: { type: Number, default: 0 },
  status: { type: String, enum: ['in-progress', 'submitted', 'auto-submitted'], default: 'in-progress' },
  startedAt: { type: Date, default: Date.now },
  submittedAt: Date,
  timeSpent: Number,
}, { timestamps: true });

SubmissionSchema.statics.getRoomStatistics = function(roomId) {
  return this.aggregate([
    { $match: { roomId: new mongoose.Types.ObjectId(roomId) } },
    {
      $group: {
        _id: '$roomId',
        totalSubmissions: { $sum: 1 },
        completedSubmissions: {
          $sum: { $cond: [{ $in: ['$status', ['submitted', 'auto-submitted']] }, 1, 0] }
        },
        inProgressSubmissions: {
          $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
        },
        averageScore: { $avg: '$score' },
        averagePercentage: { $avg: '$percentage' },
      }
    },
    {
      $lookup: {
        from: 'submissions',
        let: { roomId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$roomId', '$$roomId'] } } },
          {
            $lookup: {
              from: 'users',
              localField: 'studentId',
              foreignField: '_id',
              as: 'student'
            }
          },
          { $unwind: '$student' },
          {
            $project: {
              studentId: 1,
              studentName: '$student.name',
              score: 1,
              status: 1,
              submittedAt: 1,
              timeSpent: 1
            }
          }
        ],
        as: 'submissions'
      }
    }
  ]);
};

const Submission = mongoose.model('Submission', SubmissionSchema);

// Redis helper functions
async function getRoomState(roomId) {
  try {
    const state = await redis.get(`room:${roomId}`);
    return state ? JSON.parse(state) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

async function updateRoomState(roomId, updates) {
  try {
    const currentState = await getRoomState(roomId);
    const newState = { ...currentState, ...updates };
    await redis.setex(`room:${roomId}`, 3600, JSON.stringify(newState));
  } catch (error) {
    console.error('Redis update error:', error);
  }
}

async function updateRoomParticipant(roomId, socketId, participant) {
  try {
    const currentState = await getRoomState(roomId) || {
      roomId,
      roomCode: '',
      status: 'waiting',
      participants: {},
      duration: 0,
    };

    currentState.participants[socketId] = participant;
    await redis.setex(`room:${roomId}`, 3600, JSON.stringify(currentState));
  } catch (error) {
    console.error('Redis participant update error:', error);
  }
}

async function removeRoomParticipant(roomId, socketId) {
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

async function handleExamEnd(roomId, roomCode, io) {
  try {
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

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // Join room event
  socket.on('join-room', async (data) => {
    try {
      const { roomCode, userId, userName, role } = data;
      const room = await Room.findByCode(roomCode);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.status === 'ended') {
        socket.emit('error', { message: 'This room has ended' });
        return;
      }

      if (role === 'teacher' && room.teacherId._id.toString() !== userId) {
        socket.emit('error', { message: 'You are not the teacher of this room' });
        return;
      }

      if (role === 'student' && room.maxStudents) {
        const roomState = await getRoomState(room._id.toString());
        const studentCount = Object.values(roomState?.participants || {})
          .filter(p => p.role === 'student').length;

        if (studentCount >= room.maxStudents) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }
      }

      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.userId = userId;
      socket.role = role;

      await updateRoomParticipant(room._id.toString(), socket.id, {
        userId,
        name: userName,
        role,
        joinedAt: new Date(),
      });

      const roomState = await getRoomState(room._id.toString());
      const participantsList = Object.values(roomState?.participants || {});

      io.to(roomCode).emit('room-update', {
        room: room.toObject(),
        participants: participantsList,
        totalStudents: participantsList.filter(p => p.role === 'student').length,
        totalParticipants: participantsList.length,
      });

      socket.emit('joined-room', {
        message: 'Successfully joined room',
        room: room.toObject(),
        role,
      });

      console.log(`📚 ${userName} (${role}) joined room ${roomCode}`);

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Start exam
  socket.on('start-exam', async (data) => {
    try {
      const { roomCode, teacherId } = data;
      const room = await Room.findByCode(roomCode);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.teacherId._id.toString() !== teacherId) {
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

      await updateRoomState(room._id.toString(), {
        status: 'running',
        startTime: room.startTime,
        endTime: room.endTime,
      });

      io.to(roomCode).emit('exam-started', {
        message: 'Exam has started!',
        startTime: room.startTime,
        endTime: room.endTime,
        duration: room.duration,
      });

      setTimeout(async () => {
        await handleExamEnd(room._id.toString(), roomCode, io);
      }, room.duration * 60 * 1000);

      console.log(`🏁 Exam started in room ${roomCode}`);

    } catch (error) {
      console.error('Error starting exam:', error);
      socket.emit('error', { message: 'Failed to start exam' });
    }
  });

  // Submit exam
  socket.on('submit-exam', async (data) => {
    try {
      const { roomCode, studentId, answers } = data;
      const room = await Room.findByCode(roomCode);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      let submission = await Submission.findOne({
        roomId: room._id,
        studentId: studentId,
      });

      if (!submission) {
        socket.emit('error', { message: 'No submission found' });
        return;
      }

      if (submission.status !== 'in-progress') {
        socket.emit('error', { message: 'Submission already completed' });
        return;
      }

      submission.answers = answers;
      submission.status = 'submitted';
      submission.submittedAt = new Date();
      await submission.save();

      socket.emit('exam-submitted', {
        message: 'Exam submitted successfully',
        submission: submission.toObject(),
      });

      socket.to(roomCode).emit('student-submitted', {
        studentId,
        submittedAt: submission.submittedAt,
      });

      console.log(`📝 Student submitted exam in room ${roomCode}`);

    } catch (error) {
      console.error('Error submitting exam:', error);
      socket.emit('error', { message: 'Failed to submit exam' });
    }
  });

  // Get statistics
  socket.on('get-statistics', async (data) => {
    try {
      const { roomCode, teacherId } = data;
      const room = await Room.findByCode(roomCode);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.teacherId._id.toString() !== teacherId) {
        socket.emit('error', { message: 'Only teacher can view statistics' });
        return;
      }

      const stats = await Submission.getRoomStatistics(room._id.toString());

      socket.emit('room-statistics', {
        roomId: room._id,
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

  // Disconnect
  socket.on('disconnect', async () => {
    console.log(`👋 User disconnected: ${socket.id}`);

    if (socket.roomCode && socket.userId) {
      try {
        const room = await Room.findByCode(socket.roomCode);
        if (room) {
          await removeRoomParticipant(room._id.toString(), socket.id);

          const roomState = await getRoomState(room._id.toString());
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
});

// Start server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      redis.quit(() => {
        console.log('Redis connection closed');
        process.exit(0);
      });
    });
  });
});
