import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Room from '@/models/Room';
import ChatMessage from '@/models/ChatMessage';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

// GET - Fetch all messages for a room
export async function GET(
  req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  try {
    await dbConnect();

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { roomCode } = await params;

    // Verify room exists
    const room = await Room.findOne({ roomCode });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Fetch messages
    const messages = await ChatMessage.find({ roomCode })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ messages });

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(
  req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  try {
    await dbConnect();

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { roomCode } = await params;
    const { content, mentionedQuestionId } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Verify room exists
    const room = await Room.findOne({ roomCode })
      .populate('examQuizId')
      .lean();
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get user info
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine role
    let role = 'STUDENT';
    if (user._id.toString() === room.teacherId.toString()) {
      role = 'TEACHER';
    }

    // Create message
    const message = await ChatMessage.create({
      roomCode,
      userId: user._id,
      content,
      mentionedQuestionId: mentionedQuestionId || null,
      role,
    });

    // Populate user info
    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('userId', 'name email')
      .lean();

    // Check if AI should respond
    let aiResponse = null;
    if (mentionedQuestionId) {
      aiResponse = await triggerAIResponse(roomCode, mentionedQuestionId, room, content);
    }

    return NextResponse.json({ 
      message: populatedMessage,
      aiResponse 
    });

  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Helper function to trigger AI response
async function triggerAIResponse(
  roomCode: string,
  mentionedQuestionId: string,
  room: any,
  studentMessage: string
) {
  try {
    // Get recent messages about this question
    const recentMessages = await ChatMessage.find({
      roomCode,
      mentionedQuestionId,
      role: { $ne: 'AI' }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name')
      .lean();

    // Check if we should trigger AI
    // Trigger if: 1) First mention, 2) Multiple students confused, 3) Negative sentiment
    const shouldTrigger = 
      recentMessages.length >= 1 || // At least 1 message mentioning this question
      hasNegativeSentiment(studentMessage);

    if (!shouldTrigger) {
      return null;
    }

    // Find the question
    const question = room.examQuizId.questions.find(
      (q: any) => q._id.toString() === mentionedQuestionId
    );

    if (!question) {
      return null;
    }

    // Call OpenAI API
    const aiContent = await generateAIResponse(question, recentMessages, studentMessage);

    if (!aiContent) {
      return null;
    }

    // Create AI message
    const aiMessage = await ChatMessage.create({
      roomCode,
      userId: room.teacherId, // Use teacher's ID as AI user
      content: aiContent,
      mentionedQuestionId,
      role: 'AI',
    });

    const populatedAIMessage = await ChatMessage.findById(aiMessage._id)
      .populate('userId', 'name email')
      .lean();

    return populatedAIMessage;

  } catch (error) {
    console.error('Error triggering AI:', error);
    return null;
  }
}

// Helper to detect negative sentiment
function hasNegativeSentiment(text: string): boolean {
  const negativeWords = [
    'không hiểu', 'khó', 'chịu', 'confused', 'difficult', 
    'don\'t understand', 'can\'t', 'help', 'stuck', 'bế tắc'
  ];
  
  const lowerText = text.toLowerCase();
  return negativeWords.some(word => lowerText.includes(word));
}

// Helper to generate AI response using OpenAI
async function generateAIResponse(
  question: any,
  recentMessages: any[],
  latestMessage: string
): Promise<string | null> {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.log('OpenAI API key not configured');
      return null;
    }

    // Build context
    const discussionContext = recentMessages
      .reverse()
      .map(m => `${m.userId.name}: ${m.content}`)
      .join('\n');

    const prompt = `You are an AI teaching assistant helping students with an exam question.

Question:
"${question.text}"

${question.correctAnswer ? `Correct answer: ${JSON.stringify(question.correctAnswer)}` : ''}
${question.explanation ? `Explanation: ${question.explanation}` : ''}

Student discussion:
${discussionContext}

Latest message: "${latestMessage}"

Task:
- Give a helpful hint, NOT the final answer
- Suggest related concepts or study materials
- Be encouraging and supportive
- Keep response concise (2-3 sentences)
- Respond in the same language as the student's message

Your response:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful teaching assistant. Give hints, not answers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || null;

  } catch (error) {
    console.error('Error generating AI response:', error);
    return null;
  }
}
