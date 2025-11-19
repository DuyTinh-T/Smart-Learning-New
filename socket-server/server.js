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

// Welcome page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Socket.IO Server - Smart Learning Platform</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          width: 100%;
          padding: 40px;
          text-align: center;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        h1 {
          color: #333;
          font-size: 32px;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 18px;
          margin-bottom: 30px;
        }
        .status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #10b981;
          color: white;
          padding: 10px 20px;
          border-radius: 50px;
          font-weight: 600;
          margin-bottom: 30px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: blink 1.5s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .info-card {
          background: #f8fafc;
          padding: 15px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }
        .info-label {
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 5px;
          font-weight: 600;
        }
        .info-value {
          color: #1e293b;
          font-size: 16px;
          font-weight: 600;
        }
        .endpoints {
          text-align: left;
          background: #f8fafc;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        .endpoints h3 {
          color: #333;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .endpoint {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: white;
          border-radius: 8px;
          margin-bottom: 10px;
          border: 1px solid #e2e8f0;
        }
        .method {
          background: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .path {
          color: #1e293b;
          font-family: 'Courier New', monospace;
          font-weight: 600;
        }
        .footer {
          color: #94a3b8;
          font-size: 14px;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🚀</div>
        <h1>Socket.IO Server</h1>
        <p class="subtitle">Smart Learning Platform - Real-time Communication</p>
        
        <div class="status">
          <span class="status-dot"></span>
          <span>Server Running</span>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">Environment</div>
            <div class="info-value">${process.env.NODE_ENV || 'development'}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Port</div>
            <div class="info-value">${process.env.PORT || 4000}</div>
          </div>
          <div class="info-card">
            <div class="info-label">CORS Origin</div>
            <div class="info-value">${(process.env.CORS_ORIGIN || 'localhost:3000').replace('https://', '').replace('http://', '')}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Redis</div>
            <div class="info-value">${process.env.REDIS_URL?.includes('upstash.io') ? 'Upstash' : 'Local'}</div>
          </div>
        </div>

        <div class="endpoints">
          <h3>📡 Available Endpoints</h3>
          <div class="endpoint">
            <span class="method">GET</span>
            <span class="path">/</span>
            <span style="margin-left: auto; color: #64748b; font-size: 14px;">This page</span>
          </div>
          <div class="endpoint">
            <span class="method">GET</span>
            <span class="path">/health</span>
            <span style="margin-left: auto; color: #64748b; font-size: 14px;">Health check</span>
          </div>
        </div>

        <div class="footer">
          <p>Smart Learning Platform © 2025</p>
          <p style="margin-top: 10px;">
            Built with <span style="color: #ef4444;">❤️</span> using Socket.IO & Express
          </p>
        </div>
      </div>
    </body>
    </html>
  `);
});

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

// Initialize Redis (Upstash compatible)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isUpstash = redisUrl.includes('upstash.io');

const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  // Enable TLS for Upstash, disable for local Redis
  tls: isUpstash ? {
    rejectUnauthorized: false
  } : undefined,
  // Connection timeout
  connectTimeout: 10000,
  // Keep alive
  keepAlive: 30000,
});

redis.on('connect', () => {
  console.log(`✅ Connected to Redis${isUpstash ? ' (Upstash)' : ' (Local)'}`);
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
  console.log('🔎 findByCode called with:', code);
  // Don't populate to avoid missing schema errors
  return this.findOne({ roomCode: code });
};

const Room = mongoose.models.Room || mongoose.model('Room', RoomSchema);

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

const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

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
      console.log('📨 Received join-room event:', data);
      const { roomCode, userId, userName, role } = data;
      
      console.log('🔍 Looking for room with code:', roomCode);
      const room = await Room.findByCode(roomCode);
      console.log('🏠 Room found:', room ? { _id: room._id, roomCode: room.roomCode, status: room.status } : 'null');

      if (!room) {
        console.error('❌ Room not found for code:', roomCode);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.status === 'ended') {
        console.error('❌ Room has already ended:', roomCode);
        socket.emit('error', { message: 'This room has ended' });
        return;
      }

      // teacherId is ObjectId, not populated
      if (role === 'teacher' && room.teacherId.toString() !== userId) {
        console.error('❌ User is not the teacher of this room. Expected:', room.teacherId.toString(), 'Got:', userId);
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

      // teacherId is ObjectId, not populated
      if (room.teacherId.toString() !== teacherId) {
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

      // teacherId is ObjectId, not populated
      if (room.teacherId.toString() !== teacherId) {
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
