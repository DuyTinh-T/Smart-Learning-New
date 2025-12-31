import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import Submission from '@/models/Submission';
import User from '@/models/User';
import ExamQuiz from '@/models/ExamQuiz';
import { verifyToken } from '@/lib/auth';

// Get list of published exam results for a student
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch user from database to get role
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized - Only students can access this' },
        { status: 403 }
      );
    }

    console.log('📚 Fetching published results for student:', user._id);

    // Find all submissions by this student
    const submissions = await Submission.find({
      studentId: user._id,
      status: 'submitted'
    }).populate({
      path: 'roomId',
      match: { publishAnalysis: true },
      populate: [
        { path: 'examQuizId' },
        { path: 'teacherId', select: 'name email' }
      ]
    }).sort({ submittedAt: -1 });

    console.log('📊 Total submissions found:', submissions.length);

    // Filter out submissions where room is null (not published)
    const publishedSubmissions = submissions.filter(s => s.roomId !== null);

    console.log('✅ Published submissions:', publishedSubmissions.length);

    return NextResponse.json({
      success: true,
      submissions: publishedSubmissions
    });

  } catch (error: any) {
    console.error('❌ Error fetching published results:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
