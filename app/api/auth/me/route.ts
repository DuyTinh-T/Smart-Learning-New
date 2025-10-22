import { NextRequest } from 'next/server';
import { 
  authenticate, 
  createResponse, 
  createErrorResponse 
} from '@/lib/auth';

// GET - Check authentication status
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    
    if (error || !user) {
      return createResponse(
        { 
          authenticated: false,
          user: null
        },
        'Not authenticated',
        200
      );
    }

    return createResponse(
      { 
        authenticated: true,
        user: user.toJSON()
      },
      'Authenticated',
      200
    );

  } catch (error: any) {
    console.error('Auth check error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}