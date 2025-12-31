/**
 * Script to clear submissions for a specific room
 * Usage: npx ts-node scripts/clear-submissions.ts <roomCode>
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-platform';

async function clearSubmissions(roomCode: string) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const roomsCollection = mongoose.connection.collection('rooms');
    const submissionsCollection = mongoose.connection.collection('submissions');

    // Find room by code
    console.log('🔍 Looking for room with code:', roomCode);
    const room = await roomsCollection.findOne({ roomCode });

    if (!room) {
      console.error('❌ Room not found with code:', roomCode);
      return;
    }

    console.log('📚 Found room:', {
      id: room._id,
      title: room.title,
      status: room.status,
    });

    // Find and delete submissions
    console.log('🔍 Looking for submissions...');
    const submissions = await submissionsCollection.find({ roomId: room._id }).toArray();

    console.log(`📊 Found ${submissions.length} submission(s)`);

    if (submissions.length === 0) {
      console.log('✅ No submissions to delete');
      return;
    }

    // Delete submissions
    const result = await submissionsCollection.deleteMany({ roomId: room._id });
    console.log(`✅ Deleted ${result.deletedCount} submission(s)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Get room code from command line args
const roomCode = process.argv[2];

if (!roomCode) {
  console.error('❌ Please provide a room code');
  console.log('Usage: npx ts-node scripts/clear-submissions.ts <roomCode>');
  process.exit(1);
}

clearSubmissions(roomCode);
