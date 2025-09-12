import { NextRequest } from 'next/server';

export async function authenticateApiKey(request: NextRequest) {
  try {
    // Skip authentication in development
    if (process.env.NODE_ENV === 'development') {
      return { success: true };
    }

    // Get API key from headers (check both lowercase and uppercase)
    const apiKey = request.headers.get('x-api-key') || 
                   request.headers.get('X-API-Key') ||
                   request.headers.get('authorization')?.replace('Bearer ', '');

    // Check if API key exists
    if (!apiKey) {
      return { success: false, error: 'API key missing' };
    }

    // Validate API key (you can implement your own validation logic)
    const validApiKeys = [
      process.env.NEXT_PUBLIC_LIVE_API_KEY,
      process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY
    ].filter(Boolean);

    if (!validApiKeys.includes(apiKey)) {
      return { success: false, error: 'Invalid API key' };
    }

    return { success: true };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export async function authenticateUser(request: NextRequest) {
  // try {
  //   // Get user token from headers
  //   const token = request.headers.get('authorization')?.replace('Bearer ', '');

  //   if (!token) {
  //     return { success: false, error: 'Token missing' };
  //   }

  //   // Validate user token (implement your JWT validation logic here)
  //   // For now, return success
  //   return { success: true, user: { id: 'user1', role: 'admin' } };
  // } catch (error) {
  //   console.error('User authentication error:', error);
  //   return { success: false, error: 'User authentication failed' };
  // }
  return { success: true };
} 