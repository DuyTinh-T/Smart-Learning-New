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

// GET /api/rooms/[code]/statistics - Get room statistics (teacher only)
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view statistics' }, { status: 401 });
    }

    await connectDB();
    
    const room = await Room.findByCode(params.code);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if ((room.teacherId as any).toString() !== (user as any)._id.toString()) {
      return NextResponse.json({ error: 'Only the room creator can view statistics' }, { status: 403 });
    }

    // Get statistics
    const stats = await Submission.getRoomStatistics((room as any)._id.toString());
    const submissions = await Submission.findByRoom((room as any)._id.toString());

    // Calculate additional statistics
    const totalJoined = submissions.length;
    const completedCount = submissions.filter(s => ['submitted', 'auto-submitted', 'graded'].includes(s.status)).length;
    const inProgressCount = submissions.filter(s => s.status === 'in-progress').length;

    // Question-wise statistics (if needed)
    const questionStats: any = {};
    if (submissions.length > 0) {
      submissions.forEach(submission => {
        submission.answers.forEach(answer => {
          const qId = answer.questionId.toString();
          if (!questionStats[qId]) {
            questionStats[qId] = {
              correct: 0,
              incorrect: 0,
              total: 0
            };
          }
          questionStats[qId].total++;
          if (answer.isCorrect) {
            questionStats[qId].correct++;
          } else {
            questionStats[qId].incorrect++;
          }
        });
      });
    }

    const result = {
      room: room.toObject(),
      statistics: {
        ...stats[0],
        totalJoined,
        completedCount,
        inProgressCount,
        questionStats,
      },
      submissions: submissions.map(s => {
        // Calculate grade letter
        const gradeLetter = s.percentage >= 90 ? 'A' : 
                           s.percentage >= 80 ? 'B' : 
                           s.percentage >= 70 ? 'C' : 
                           s.percentage >= 60 ? 'D' : 'F';
        
        return {
          id: s._id,
          studentId: s.studentId,
          student: (s as any).studentId, // populated
          score: s.score,
          percentage: s.percentage,
          status: s.status,
          timeSpent: s.timeSpent,
          startedAt: s.startedAt,
          submittedAt: s.submittedAt,
          gradeLetter,
        };
      }),
    };

    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}