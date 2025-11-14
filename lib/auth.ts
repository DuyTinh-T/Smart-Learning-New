import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import User, { type IUser } from '@/models/User';
import connectDB from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-change-in-production';

export interface AuthenticatedRequest extends NextRequest {
  user?: IUser;
  userId?: string;
}

// JWT token generation
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// JWT token verification
export const verifyToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

// Middleware to authenticate requests
export const authenticate = async (request: NextRequest): Promise<{ user: IUser | null; error: string | null }> => {
  try {
    // Get token from Authorization header or cookies
    let token: string | null = null;
    
    // Check Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no Authorization header, check cookies
    if (!token) {
      token = request.cookies.get('auth-token')?.value || null;
    }

    if (!token) {
      return { user: null, error: 'No token provided' };
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return { user: null, error: 'Invalid token' };
    }

    // Connect to database and get user
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return { user: null, error: 'User not found' };
    }

    if (!user.isActive) {
      return { user: null, error: 'Account is disabled' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Authentication failed' };
  }
};

// Middleware to check user roles
export const requireRole = (allowedRoles: string[]) => {
  return (user: IUser): { authorized: boolean; error: string | null } => {
    if (!allowedRoles.includes(user.role)) {
      return { 
        authorized: false, 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      };
    }

    return { authorized: true, error: null };
  };
};

// Helper for API route authentication
export const verifyAuth = async (request: NextRequest): Promise<{ success: boolean; userId?: string; user?: IUser; error?: string }> => {
  try {
    const authResult = await authenticate(request);
    
    if (authResult.error || !authResult.user) {
      return { 
        success: false, 
        error: authResult.error || 'Authentication failed' 
      };
    }
    
    return { 
      success: true, 
      userId: (authResult.user._id as any).toString(),
      user: authResult.user 
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { 
      success: false, 
      error: 'Authentication verification failed' 
    };
  }
};

// Helper function to set secure cookie
export const createAuthCookie = (token: string): string => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `auth-token=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
    'SameSite=Strict',
    ...(isProduction ? ['Secure'] : [])
  ];
  
  return cookieOptions.join('; ');
};

// Helper function to clear auth cookie
export const clearAuthCookie = (): string => {
  return 'auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict';
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 50) {
    return { valid: false, message: 'Password must be less than 50 characters long' };
  }
  
  // You can add more password strength requirements here
  // const hasUppercase = /[A-Z]/.test(password);
  // const hasLowercase = /[a-z]/.test(password);
  // const hasNumbers = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return { valid: true, message: 'Password is valid' };
};

// Standard API response helpers
export const createResponse = (
  data: any = null, 
  message: string = 'Success', 
  status: number = 200
) => {
  return Response.json(
    {
      success: status >= 200 && status < 300,
      message,
      data,
      timestamp: new Date().toISOString()
    },
    { status }
  );
};

export const createErrorResponse = (
  message: string, 
  status: number = 400, 
  errors: any = null
) => {
  return Response.json(
    {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    },
    { status }
  );
};