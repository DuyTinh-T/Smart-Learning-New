import { NextRequest } from 'next/server';
import { 
  authenticate,
  clearAuthCookie, 
  createResponse, 
  createErrorResponse 
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (optional - we can logout even without valid auth)
    const { user, error } = await authenticate(request);
    
    // Even if authentication fails, we still clear the cookie
    const response = createResponse(
      null,
      user ? 'Logged out successfully' : 'Logged out (session was already invalid)',
      200
    );

    // Clear the auth cookie
    response.headers.set('Set-Cookie', clearAuthCookie());

    return response;

  } catch (error: any) {
    console.error('Logout error:', error);
    
    // Even if there's an error, we should clear the cookie
    const response = createErrorResponse('Logout completed with errors', 200);
    response.headers.set('Set-Cookie', clearAuthCookie());
    
    return response;
  }
}

// GET method for logout (some clients prefer GET for logout)
export async function GET(request: NextRequest) {
  return POST(request);
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}