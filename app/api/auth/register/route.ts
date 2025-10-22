import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { 
  generateToken, 
  createAuthCookie, 
  isValidEmail, 
  isValidPassword, 
  createResponse, 
  createErrorResponse 
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { name, email, password, role = 'student' } = body;

    // Validation
    if (!name || !email || !password) {
      return createErrorResponse('Name, email, and password are required', 400);
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return createErrorResponse('Please provide a valid email address', 400);
    }

    // Validate password strength
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return createErrorResponse(passwordValidation.message, 400);
    }

    // Validate role
    const allowedRoles = ['student', 'teacher', 'admin'];
    if (!allowedRoles.includes(role)) {
      return createErrorResponse('Invalid role. Must be one of: student, teacher, admin', 400);
    }

    // Validate name length
    if (name.trim().length < 2) {
      return createErrorResponse('Name must be at least 2 characters long', 400);
    }

    if (name.length > 50) {
      return createErrorResponse('Name must be less than 50 characters long', 400);
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return createErrorResponse('A user with this email already exists', 409);
    }

    // Create new user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role
    };

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = generateToken((user._id as string).toString());

    // Create response with user data (password excluded by toJSON)
    const response = createResponse(
      {
        user: user.toJSON(),
        token
      },
      'User registered successfully',
      201
    );

    // Set secure HTTP-only cookie
    response.headers.set('Set-Cookie', createAuthCookie(token));

    return response;

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse('Validation failed', 400, validationErrors);
    }

    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return createErrorResponse('A user with this email already exists', 409);
    }

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