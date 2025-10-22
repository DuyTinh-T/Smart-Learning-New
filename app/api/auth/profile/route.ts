import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { 
  authenticate,
  isValidEmail,
  isValidPassword,
  createResponse, 
  createErrorResponse 
} from '@/lib/auth';

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    
    if (error || !user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    // Return user profile (password already excluded by toJSON)
    return createResponse(
      { user: user.toJSON() },
      'Profile retrieved successfully',
      200
    );

  } catch (error: any) {
    console.error('Get profile error:', error);
    return createErrorResponse('Internal server error. Please try again.', 500);
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    
    if (error || !user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { name, email, currentPassword, newPassword, dailyStudyTime, avatar } = body;

    // Find the current user in database to update
    const currentUser = await User.findById(user._id);
    if (!currentUser) {
      return createErrorResponse('User not found', 404);
    }

    // Validate and update fields
    const updates: any = {};

    // Update name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return createErrorResponse('Name must be at least 2 characters long', 400);
      }
      if (name.length > 50) {
        return createErrorResponse('Name must be less than 50 characters long', 400);
      }
      updates.name = name.trim();
    }

    // Update email
    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return createErrorResponse('Please provide a valid email address', 400);
      }
      
      // Check if email is already taken by another user
      if (email.toLowerCase() !== currentUser.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          return createErrorResponse('A user with this email already exists', 409);
        }
      }
      
      updates.email = email.toLowerCase().trim();
    }

    // Update password
    if (newPassword !== undefined) {
      if (!currentPassword) {
        return createErrorResponse('Current password is required to set a new password', 400);
      }
      
      // Verify current password
      const isCurrentPasswordValid = await currentUser.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return createErrorResponse('Current password is incorrect', 400);
      }
      
      // Validate new password
      const passwordValidation = isValidPassword(newPassword);
      if (!passwordValidation.valid) {
        return createErrorResponse(passwordValidation.message, 400);
      }
      
      updates.password = newPassword;
    }

    // Update daily study time
    if (dailyStudyTime !== undefined) {
      if (typeof dailyStudyTime !== 'number' || dailyStudyTime < 0 || dailyStudyTime > 1440) {
        return createErrorResponse('Daily study time must be between 0 and 1440 minutes (24 hours)', 400);
      }
      updates.dailyStudyTime = dailyStudyTime;
    }

    // Update avatar
    if (avatar !== undefined) {
      if (avatar && (typeof avatar !== 'string' || avatar.length > 500)) {
        return createErrorResponse('Avatar URL must be a valid string under 500 characters', 400);
      }
      updates.avatar = avatar;
    }

    // Apply updates
    Object.assign(currentUser, updates);
    await currentUser.save();

    // Return updated user profile
    return createResponse(
      { user: currentUser.toJSON() },
      'Profile updated successfully',
      200
    );

  } catch (error: any) {
    console.error('Update profile error:', error);
    
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
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}