import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

// GET /api/debug/user - Debug endpoint to check current user
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    
    return NextResponse.json({
      success: true,
      data: {
        user: user ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        } : null,
        error,
        hasAuthHeader: !!request.headers.get('authorization'),
        authHeader: request.headers.get('authorization')?.substring(0, 20) + '...',
        hasCookie: !!request.cookies.get('auth-token'),
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint failed',
      details: error
    });
  }
}