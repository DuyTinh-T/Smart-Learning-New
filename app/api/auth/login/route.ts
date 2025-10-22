import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { 
  generateToken, 
  createAuthCookie, 
  isValidEmail, 
  createResponse, 
  createErrorResponse 
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400);
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return createErrorResponse('Please provide a valid email address', 400);
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return createErrorResponse('Invalid email or password', 401);
    }

    // Check if account is active
    if (!user.isActive) {
      return createErrorResponse('Your account has been disabled. Please contact support.', 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return createErrorResponse('Invalid email or password', 401);
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken((user._id as string).toString());

    // Create response with user data (password excluded by toJSON)
    const response = createResponse(
      {
        user: user.toJSON(),
        token
      },
      'Login successful',
      200
    );

    // Set secure HTTP-only cookie
    response.headers.set('Set-Cookie', createAuthCookie(token));

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    
    return createErrorResponse('Internal server error. Please try again.', 500);
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}